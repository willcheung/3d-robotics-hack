// This frame owns the worker lifecycle. Student code runs only in worker.js.
const parentOrigin = new URLSearchParams(location.search).get('parent');
const allowedParents = __APP_ORIGINS__;
let worker, token, messageCount = 0;
const send = payload => parent.postMessage({ token, payload }, parentOrigin);
const dispose = () => { worker?.terminate(); worker = undefined; };
if (allowedParents.includes(parentOrigin) && parent !== window) {
  addEventListener('message', event => {
    if (event.source !== parent || event.origin !== parentOrigin) return;
    const m = event.data;
    if (!m || typeof m !== 'object') return;
    if (m.type === 'start' && !worker && typeof m.token === 'string' && m.token.length <= 100 && typeof m.source === 'string' && m.source.length <= 16000) {
      token = m.token;
      worker = new Worker('/worker.js', { type: 'module', credentials: 'omit' });
      worker.onmessage = ({ data }) => {
        if (++messageCount > 12000) { dispose(); send({ type: 'error', text: 'Too many runtime messages. Program stopped.' }); return; }
        send(data);
      };
      worker.onerror = () => { dispose(); send({ type: 'error', text: 'Python worker could not load. Check the runtime origin, then Run again.' }); };
      // Opt in per run so an older app remains compatible during promotion
      // and rollback of this independently hosted runtime.
      worker.postMessage({ type: 'run', source: m.source, trace: m.trace === true });
    } else if (m.token === token && m.type === 'reply') {
      worker?.postMessage(m);
    } else if (m.token === token && m.type === 'stop') dispose();
  });
  parent.postMessage({ type: 'frame-ready' }, parentOrigin);
}
