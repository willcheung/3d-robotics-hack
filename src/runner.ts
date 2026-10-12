import { command, initialState, tick, type State } from './model.ts';
import { JavaTransport } from './java-transport.ts';
import { LIMITS, parseMessage, permittedOrigin } from './protocol.ts';
export type RunStatus = 'loading' | 'running' | 'finished' | 'stopped' | 'error';
export type Hooks = { snapshot: (s: State) => void; status: (status: RunStatus, detail?: string) => void; output: (text: string) => void };
export class Runner {
  private frame?: HTMLIFrameElement;
  private java?: JavaTransport;
  private origin: string;
  private token = crypto.randomUUID();
  private state = initialState();
  private dead = false;
  private ready = false;
  private busy = false;
  private nextId = 1;
  private messages = 0;
  private outputBytes = 0;
  private timer: ReturnType<typeof setTimeout>;
  private listener = (event: MessageEvent) => { void this.receive(event); };
  constructor(private source: string, private hooks: Hooks, private language: 'python' | 'java' = 'python') {
    this.origin = permittedOrigin(import.meta.env.VITE_RUNTIME_ORIGIN || 'http://127.0.0.1:4174', location.origin);
    if (source.length > LIMITS.source) throw new Error('Program is too long (16,000 character limit).');
    this.timer = setTimeout(() => this.fail(`${language === 'java' ? 'Java' : 'Python'} did not load in 45 seconds. Check the runtime and try again.`), LIMITS.loadMs);
    hooks.snapshot(this.state); hooks.status('loading');
    if(language === 'java') { this.java = new JavaTransport(source, value => { void this.receivePayload(value); }, text => this.fail(text)); return; }
    this.frame = document.createElement('iframe');
    this.frame.title = 'Isolated Python runtime';
    this.frame.hidden = true;
    // Separate origin + sandbox: no popup, top navigation, forms, downloads or app DOM access.
    this.frame.sandbox.add('allow-scripts', 'allow-same-origin');
    this.frame.referrerPolicy = 'no-referrer';
    this.frame.src = `${this.origin}/?parent=${encodeURIComponent(location.origin)}`;
    window.addEventListener('message', this.listener);
    document.body.append(this.frame);
  }
  private send(data: Record<string, unknown>) { if(this.java) { this.java.send(data); return; } this.frame?.contentWindow?.postMessage({ ...data, token: this.token }, this.origin); }
  private async receive(event: MessageEvent) {
    if (this.dead || event.source !== this.frame?.contentWindow || event.origin !== this.origin) return;
    if (++this.messages > LIMITS.messages) return this.fail('Too many runtime messages. Program stopped.');
    if (event.data?.type === 'frame-ready' && !this.ready) {
      this.send({ type: 'start', source: this.source }); return;
    }
    if (event.data?.token !== this.token) return;
    await this.receivePayload(event.data.payload);
  }
  private async receivePayload(payload: unknown) {
    if(this.dead) return;
    if(this.language === 'java' && ++this.messages > LIMITS.messages) return this.fail('Too many runtime messages. Program stopped.');
    try {
      const m = parseMessage(payload);
      if (m.type === 'ready') {
        if (this.ready) throw new Error('Unexpected runtime restart.');
        this.ready = true;
        clearTimeout(this.timer);
        this.timer = setTimeout(() => this.fail('20 second run limit reached. Try fewer steps, then Run again.'), LIMITS.runMs);
        this.hooks.status('running');
      } else if (m.type === 'output') {
        this.outputBytes += new TextEncoder().encode(m.text).length;
        if (this.outputBytes > LIMITS.output) throw new Error('Console limit reached (8 KB). Try printing less.');
        this.hooks.output(m.text);
      } else if (m.type === 'error') this.fail(m.text);
      else if (m.type === 'done') {
        if (!this.ready || this.busy) throw new Error('Program ended with an unfinished robot command.');
        this.end('finished');
      } else {
        if (!this.ready || this.busy || m.id !== this.nextId || m.id > LIMITS.commands) throw new Error('Robot commands must be awaited, ordered, and within the 2,000 command limit.');
        this.busy = true;
        this.nextId++;
        let value: number | null = null;
        try {
          if (m.command.op === 'wait') {
            // Pace playback against a deadline so expensive frames don't add
            // their duration to every tick. Always execute every fixed model
            // step; elapsed wall time chooses when to display it, never its dt.
            const startedAt = performance.now();
            let completed = 0;
            const count = m.command.value!;
            while (completed < count) {
              const delay = Math.max(0, startedAt + (completed + 1) * 20 - performance.now());
              await new Promise(resolve => setTimeout(resolve, delay));
              if (this.dead) return;
              const due = Math.min(count, Math.floor((performance.now() - startedAt) / 20));
              if (due <= completed) continue;
              while (completed < due) { this.state = tick(this.state); completed++; }
              this.hooks.snapshot(this.state);
            }
          } else {
            const result = command(this.state, m.command);
            this.state = result.state; value = result.value;
            this.hooks.snapshot(this.state);
          }
          if (!this.dead) this.send({ type: 'reply', id: m.id, value });
        } finally { this.busy = false; }
      }
    } catch (e) { this.fail(e instanceof Error ? e.message : 'Invalid runtime request.'); }
  }
  private fail(text: string) { if (!this.dead) this.end('error', text); }
  private end(status: RunStatus, detail?: string) {
    if (this.dead) return;
    this.dead = true;
    clearTimeout(this.timer);
    this.send({ type: 'stop' });
    this.java?.stop();
    this.frame?.remove();
    window.removeEventListener('message', this.listener);
    this.hooks.status(status, detail);
  }
  stop() { this.end('stopped'); }
}
