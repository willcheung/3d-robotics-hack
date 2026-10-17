/** Small, accessible textarea editor; execution remains in the isolated Runner. */
export function attachEditor(code: HTMLTextAreaElement, changed: () => void, run: () => void) {
  let leaveOnTab = false;
  function replace(start: number, end: number, text: string, selectionStart = start + text.length, selectionEnd = selectionStart) {
    code.setSelectionRange(start, end);
    // insertText keeps the browser's native undo history; setRangeText is a fallback.
    if (!document.execCommand('insertText', false, text)) code.setRangeText(text, start, end, 'end');
    code.setSelectionRange(selectionStart, selectionEnd);
    changed();
  }
  code.addEventListener('blur', () => { leaveOnTab = false; });
  code.addEventListener('keydown', e => {
    if (e.isComposing || code.readOnly || code.disabled) return;
    if (e.key === 'Escape') { leaveOnTab = true; return; }
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); run(); return; }
    if (e.key === 'Tab' && leaveOnTab) { leaveOnTab = false; return; }
    leaveOnTab = false;
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const { value, selectionStart: start, selectionEnd: end } = code;
    const lineStart = start === 0 ? 0 : value.lastIndexOf('\n', start - 1) + 1;
    if (e.key === 'Enter') {
      const prefix = value.slice(lineStart, start);
      const indent = prefix.match(/^[ \t]*/)?.[0] ?? '';
      if (indent || /[:{]$/.test(prefix.trimEnd())) {
        e.preventDefault(); replace(start, end, '\n' + indent + (/[:{]$/.test(prefix.trimEnd()) ? '    ' : ''));
      }
    }
    if (e.key !== 'Tab') return;
    e.preventDefault();
    if (start === end && !e.shiftKey) { replace(start, end, ' '.repeat(4 - ((start - lineStart) % 4))); return; }
    if (start === end) {
      const remove = value.slice(lineStart).match(/^( {1,4}|\t)/)?.[0].length ?? 0;
      if (remove) replace(lineStart, lineStart + remove, '', Math.max(lineStart, start - remove));
      return;
    }
    const selectedEnd = end > start && value[end - 1] === '\n' ? end - 1 : end;
    const newline = value.indexOf('\n', selectedEnd);
    const lineEnd = newline === -1 ? value.length : newline;
    const block = value.slice(lineStart, lineEnd).split('\n')
      .map(line => e.shiftKey ? line.replace(/^( {1,4}|\t)/, '') : '    ' + line).join('\n');
    replace(lineStart, lineEnd, block, lineStart, lineStart + block.length);
  });
}
