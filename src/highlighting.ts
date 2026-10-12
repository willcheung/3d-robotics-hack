import hljs from 'highlight.js/lib/core';
import python from 'highlight.js/lib/languages/python';
import java from 'highlight.js/lib/languages/java';
import { LIMITS } from './protocol.ts';

// Color this lesson's robot calls too; tokens never participate in execution.
hljs.registerLanguage('python', api => {
  const grammar = python(api);
  grammar.contains!.push({ scope: 'title.function', match: /\b(?:motor|servo|wait|angle|scanner|clock)(?=\s*\()/ });
  return grammar;
});
hljs.registerLanguage('java', api => {
  const grammar = java(api);
  grammar.contains!.push({ scope: 'title.function', match: /\b(?:motor|servo|waitTicks|angle|scanner|clock)(?=\s*\()/ });
  return grammar;
});

/** Paint source without changing the native textarea, its selection, or undo history. */
export function attachHighlighting(code: HTMLTextAreaElement, tokens: HTMLElement) {
  const viewport = tokens.parentElement!;
  const surface = code.parentElement!;
  let previousSource: string | undefined, previousLanguage: string | undefined;
  function syncScroll() {
    // Clip to the actual text viewport, including platforms with non-overlay scrollbars.
    viewport.style.width = `${code.clientWidth}px`;
    viewport.style.height = `${code.clientHeight}px`;
    tokens.style.transform = `translate(${-code.scrollLeft}px, ${-code.scrollTop}px)`;
  }
  code.addEventListener('scroll', syncScroll);
  new ResizeObserver(syncScroll).observe(code);
  return (language: 'python' | 'java') => {
    const source = code.value;
    if (source !== previousSource || language !== previousLanguage) {
      previousSource = source; previousLanguage = language;
      surface.classList.remove('has-highlighting');
      tokens.replaceChildren();
      // Oversized drafts stay editable as plain text; Run gives the source-limit error.
      if (source.length <= LIMITS.source) {
        try {
          // highlight() escapes the source and returns only generated token markup.
          tokens.innerHTML = hljs.highlight(source, { language, ignoreIllegals: true }).value;
          surface.classList.add('has-highlighting');
        } catch { /* A coloring failure must never hide or destroy a student's draft. */ }
      }
    }
    syncScroll();
  };
}
