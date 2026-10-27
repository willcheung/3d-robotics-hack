/** Separate runtime work from bounded teaching/playback time. Replies can wait
 * for a learner, but cannot make an unresponsive interpreter run indefinitely. */
export class ExecutionBudget {
  private remaining: number;
  private started = 0;
  private timer?: ReturnType<typeof setTimeout>;
  private expired: () => void;
  constructor(ms: number, expired: () => void) { this.remaining = ms; this.expired = expired; }
  resume() {
    if (this.timer !== undefined) return;
    this.started = performance.now();
    this.timer = setTimeout(() => { this.timer = undefined; this.expired(); }, Math.max(0, this.remaining));
  }
  pause() {
    if (this.timer === undefined) return;
    clearTimeout(this.timer); this.timer = undefined;
    this.remaining -= performance.now() - this.started;
  }
  stop() { if (this.timer !== undefined) clearTimeout(this.timer); this.timer = undefined; }
}
