import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => { await page.goto('/'); });

test('both languages show readable tokens, preserve exact source and treat pasted HTML as text', async ({ page }) => {
  const editor = page.locator('#code'), mirror = page.locator('#highlighted-code');
  const cases = [
    { language: 'python', source: '# await 12 is a comment\ntext = """<img src=x onerror=alert(1)>\nawait 12 stays in this string\n"""\nawait motor(0.5)\nprint(text)\n', keyword: 'await', call: 'motor', comment: '# await 12 is a comment' },
    { language: 'java', source: '/* public 12 is a comment\n   until here */\npublic class Main {\n  String text = "<img src=x onerror=alert(1)>";\n  double power = 0.5;\n  Robot.motor(power);\n}\n', keyword: 'public', call: 'motor', comment: '/* public 12 is a comment\n   until here */' },
  ];
  for (const item of cases) {
    await page.getByLabel('Programming language').selectOption(item.language);
    await editor.fill(item.source);
    expect(await mirror.textContent()).toBe(item.source);
    await expect(mirror.locator('.hljs-keyword').filter({ hasText: item.keyword }).first()).toHaveText(item.keyword);
    await expect(mirror.locator('.hljs-comment')).toHaveText(item.comment);
    await expect(mirror.locator('.hljs-number')).toHaveText('0.5');
    await expect(mirror.locator('.hljs-title.function_')).toContainText(item.call);
    await expect(mirror.locator('img, script, iframe')).toHaveCount(0);
    await expect(mirror.locator('.hljs-string')).toContainText('<img src=x onerror=alert(1)>');
    // Actual token colors must differ from the neutral source; all meet 4.5:1 on the editor.
    const colors = await mirror.locator('.hljs-comment, .hljs-keyword, .hljs-number, .hljs-string, .hljs-title').evaluateAll(nodes => nodes.map(node => getComputedStyle(node).color));
    expect(new Set(colors).size).toBeGreaterThanOrEqual(5);
    for (const color of colors) {
      const luminance = (rgb: number[]) => rgb.map(n => { const v = n / 255; return v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; }).reduce((sum, v, i) => sum + v * [.2126, .7152, .0722][i], 0);
      expect((luminance(color.match(/\d+/g)!.map(Number)) + .05) / (luminance([16, 33, 39]) + .05)).toBeGreaterThanOrEqual(4.5);
    }
    await expect(page.locator('.code-highlight')).toHaveAttribute('aria-hidden', 'true');
    await expect(page.getByRole('textbox')).toHaveCount(1);
    // Selecting/copying still reads the original plain source, not the token markup.
    await editor.selectText();
    expect(await editor.evaluate((node: HTMLTextAreaElement) => node.value.slice(node.selectionStart, node.selectionEnd))).toBe(item.source);
  }
});

test('live typing, undo, language drafts, reload and Restore refresh coloring without replacing source', async ({ page }) => {
  const editor = page.locator('#code'), mirror = page.locator('#highlighted-code');
  await editor.fill(''); await editor.pressSequentially('await motor(0.5)');
  await expect(mirror.locator('.hljs-keyword')).toHaveText('await');
  await editor.press('ControlOrMeta+z');
  expect(await mirror.textContent()).toBe(await editor.inputValue());
  await editor.press('ControlOrMeta+Shift+z');
  expect(await mirror.textContent()).toBe('await motor(0.5)');
  await page.getByLabel('Programming language').selectOption('java');
  await editor.fill('double power = 0.5;');
  await expect(mirror.locator('.hljs-type')).toHaveText('double');
  await page.reload();
  expect(await mirror.textContent()).toBe('double power = 0.5;');
  await page.getByLabel('Programming language').selectOption('python');
  expect(await mirror.textContent()).toBe('await motor(0.5)');
  await page.getByRole('button', { name: 'Restore example' }).click();
  await expect(editor).toHaveValue(/turn_ticks = 50/);
  expect(await mirror.textContent()).toBe(await editor.inputValue());
});

test('colors and line numbers stay aligned when scrolling, resizing, and clicking to edit', async ({ page }) => {
  const editor = page.locator('#code'), mirror = page.locator('#highlighted-code');
  const source = Array.from({ length: 55 }, (_, i) => `# line ${i + 1}\t${'a long explanation '.repeat(10)}`).join('\n') + '\n';
  await editor.fill(source);
  for (const width of [1440, 390, 1700]) {
    await page.setViewportSize({ width, height: 1000 });
    await editor.evaluate((node: HTMLTextAreaElement) => { node.scrollTop = 200; node.scrollLeft = 190; });
    await expect.poll(() => editor.evaluate((node: HTMLTextAreaElement) => {
      const mirror = document.querySelector<HTMLElement>('#highlighted-code')!;
      const pre = mirror.parentElement!;
      const a = node.getBoundingClientRect(), b = mirror.getBoundingClientRect();
      return Math.abs(b.x - a.x + node.scrollLeft) < 1 && Math.abs(b.y - a.y + node.scrollTop) < 1 && pre.clientWidth === node.clientWidth && pre.clientHeight === node.clientHeight;
    })).toBe(true);
    const typography = await editor.evaluate(node => {
      const a = getComputedStyle(node), b = getComputedStyle(document.querySelector('#highlighted-code')!);
      return ['fontFamily', 'fontSize', 'fontWeight', 'lineHeight', 'tabSize', 'letterSpacing', 'whiteSpace'].every(key => a[key as keyof CSSStyleDeclaration] === b[key as keyof CSSStyleDeclaration]);
    });
    expect(typography).toBe(true);
    await expect.poll(() => editor.evaluate(node => document.querySelector('#line-numbers')!.scrollTop - node.scrollTop)).toBe(0);
    expect(await mirror.textContent()).toBe(source);
  }
  await editor.evaluate((node: HTMLTextAreaElement) => { node.scrollTop = node.scrollHeight; node.scrollLeft = node.scrollWidth; });
  await expect.poll(() => editor.evaluate(node => document.querySelector('#line-numbers')!.scrollTop - node.scrollTop)).toBe(0);
  await editor.press('ControlOrMeta+End'); await editor.pressSequentially('print(50)');
  expect(await mirror.textContent()).toBe(source + 'print(50)');
  await expect(mirror.locator('.hljs-number')).toHaveText('50');
  // The visual layer must not intercept pointer placement in the textarea.
  await editor.click({ position: { x: 30, y: 25 } }); await expect(editor).toBeFocused();
});

test('oversized drafts and forced colors keep a readable native editor', async ({ page }) => {
  const editor = page.locator('#code');
  const oversized = '# ' + 'x'.repeat(16000);
  await editor.fill(oversized);
  await expect(page.locator('.code-highlight')).toBeHidden();
  expect(await editor.evaluate(node => getComputedStyle(node).color)).not.toBe('rgba(0, 0, 0, 0)');
  await expect(editor).toHaveValue(oversized);
  await editor.fill('print(50)');
  await expect(page.locator('.code-highlight')).toBeVisible();
  await page.emulateMedia({ forcedColors: 'active' });
  await expect(page.locator('.code-highlight')).toBeHidden();
  expect(await editor.evaluate(node => getComputedStyle(node).webkitTextFillColor)).not.toBe('rgba(0, 0, 0, 0)');
  await editor.press('End'); await editor.pressSequentially(' # still editable');
  await expect(editor).toHaveValue('print(50) # still editable');
});

test('capture the colored Python and Java starters at desktop and narrow sizes', async ({ page }) => {
  await expect(page.locator('#highlighted-code .hljs-keyword').first()).toBeVisible();
  await page.locator('.code-panel').screenshot({ path: 'test-results/s02-syntax-python.png' });
  await page.getByLabel('Programming language').selectOption('java');
  await expect(page.locator('#highlighted-code .hljs-keyword').first()).toBeVisible();
  await page.locator('.code-panel').screenshot({ path: 'test-results/s02-syntax-java.png' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('.code-panel').screenshot({ path: 'test-results/s02-syntax-narrow.png' });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});
