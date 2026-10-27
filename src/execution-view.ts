import type { PlaybackState } from './playback.ts';
/** Source highlight is independent of text selection, focus and syntax colors. */
export function executionView(code: HTMLTextAreaElement, marker: HTMLElement, label: HTMLElement) {
  let snapshot = '', state: PlaybackState = { paused: false, stepping: false, line: null };
  let available: boolean | undefined;
  function paint(scroll = false) {
    const same = code.value === snapshot, line = state.line;
    marker.hidden = !same || line === null;
    code.dataset.executionLine = same && line !== null ? String(line) : '';
    if (available === false) { label.textContent = 'Line controls need a browser with Python stack switching, such as current Chrome or Edge. Ordinary Run still works.'; return; }
    if (line === null) return;
    label.textContent = !same ? 'Running the code from when you pressed Run. Highlight returns when your draft matches.' : `${state.paused && !state.stepping ? 'Paused on' : state.stepping ? 'Stepping through' : 'Running'} line ${line}`;
    if (!same) return;
    const height = parseFloat(getComputedStyle(code).lineHeight), y = (line - 1) * height;
    if (scroll && (y < code.scrollTop || y + height > code.scrollTop + code.clientHeight)) {
      code.scrollTop = Math.max(0, y - code.clientHeight / 3);
      code.dispatchEvent(new Event('scroll'));
    }
    marker.style.top = `${y - code.scrollTop}px`;
    marker.style.height = `${height}px`;
  }
  code.addEventListener('scroll', () => paint());
  code.addEventListener('input', () => paint());
  new ResizeObserver(() => paint()).observe(code);
  return {
    start(source: string) { snapshot = source; available = undefined; state = { paused: false, stepping: false, line: null }; marker.hidden = true; code.dataset.executionLine = ''; label.textContent = 'Preparing line tracing…'; },
    capability(value: boolean) { available = value; paint(); },
    update(value: PlaybackState) { state = value; paint(true); },
    clear() { available = undefined; state = { paused: false, stepping: false, line: null }; marker.hidden = true; code.dataset.executionLine = ''; label.textContent = 'Follow code and robot together. Pause to inspect, then Step one line.'; },
  };
}
