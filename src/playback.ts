export type PlaybackState = { paused: boolean; stepping: boolean; line: number | null };
/** One gate controls both line acknowledgements and model ticks. Wall time spent
 * paused never accumulates into simulation time. */
export class Playback {
  private paused = false;
  private stepping = false;
  private line: number | null = null;
  private boundary = false;
  private dead = false;
  private wake?: () => void;
  private speed = 1;
  private elapsed = 0;
  private syncedAt = performance.now();
  private changed: (state: PlaybackState) => void;
  constructor(changed: (state: PlaybackState) => void) { this.changed = changed; }
  setSpeed(speed: number) { if ([0.25, 0.5, 1, 2].includes(speed)) { this.time(); this.speed = speed; } }
  /** Presentation time includes rendering cost, excludes Pause, and never
   * supplies the model dt. Only ordered wait calls consume it as fixed ticks. */
  time() {
    const now = performance.now();
    if (!this.dead && (!this.paused || this.stepping)) this.elapsed += (now - this.syncedAt) * this.speed;
    this.syncedAt = now; return this.elapsed;
  }
  async until(deadline: number) {
    // Even an overdue catch-up batch must yield a browser task, so input,
    // Stop and Pause cannot be starved by a chain of resolved microtasks.
    await new Promise(resolve => setTimeout(resolve, 0));
    while (!this.dead) {
      await this.delay(0);
      const remaining = deadline - this.time();
      if (remaining <= 0 || this.dead) return;
      await new Promise(resolve => setTimeout(resolve, Math.min(16, remaining / this.speed)));
    }
  }
  pause() { this.time(); this.paused = true; this.stepping = false; this.emit(); }
  resume() { this.time(); this.paused = false; this.stepping = false; this.wake?.(); this.emit(); }
  step() {
    if (this.dead || this.stepping) return;
    this.time(); this.paused = true; this.stepping = true; this.wake?.(); this.emit();
  }
  private emit() { this.changed({ paused: this.paused, stepping: this.stepping, line: this.line }); }
  async atLine(line: number) {
    // A step finishes at the *next* source boundary, including repeated visits
    // to the same line. It never silently consumes an extra line.
    if (this.stepping && !this.boundary && this.line !== null) { this.time(); this.stepping = false; }
    this.line = line; this.boundary = true; this.emit();
    await this.delay(80, true);
    this.boundary = false;
  }
  async delay(ms: number, line = false) {
    let remaining = ms;
    while (!this.dead && (remaining > 0 || this.paused && !this.stepping)) {
      if (this.paused && !this.stepping) {
        await new Promise<void>(resolve => { this.wake = resolve; }); this.wake = undefined;
        continue;
      }
      // One stepped line needs no artificial reading delay, but wait still
      // animates so its effect remains visible before the next boundary.
      if (line && this.stepping) break;
      const began = performance.now(), speed = this.speed;
      await new Promise(resolve => setTimeout(resolve, Math.min(16, remaining / speed)));
      if (!this.paused || this.stepping) remaining -= (performance.now() - began) * speed;
    }
  }
  stop() { this.dead = true; this.wake?.(); this.line = null; this.stepping = false; this.emit(); }
}
