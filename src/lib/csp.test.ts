import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(__dirname, '../..');

function directive(csp: string, name: string): string {
  const found = csp
    .split(';')
    .map((d) => d.trim())
    .find((d) => d.startsWith(name + ' ') || d === name);
  expect(found, `${name} directive present`).toBeDefined();
  return found!.slice(name.length).trim();
}

const sources: Array<[string, () => string]> = [
  [
    'index.html',
    () => {
      const html = readFileSync(resolve(root, 'index.html'), 'utf8');
      const m = html.match(/http-equiv="Content-Security-Policy"\s+content="([^"]+)"/);
      expect(m, 'CSP meta tag').not.toBeNull();
      return m![1];
    },
  ],
  [
    'public/_headers',
    () => {
      const line = readFileSync(resolve(root, 'public/_headers'), 'utf8')
        .split('\n')
        .find((l) => l.trim().startsWith('Content-Security-Policy:'));
      expect(line, 'CSP header line').toBeDefined();
      return line!.split(':').slice(1).join(':').trim();
    },
  ],
];

describe.each(sources)('CSP in %s', (_name, load) => {
  it('img-src allows no remote origins', () => {
    const tokens = directive(load(), 'img-src').split(/\s+/);
    expect(tokens).not.toContain('https:');
    expect(tokens).not.toContain('http:');
    expect(tokens).not.toContain('*');
    expect(tokens.some((t) => t.startsWith('http'))).toBe(false);
  });

  it("connect-src is exactly 'self'", () => {
    expect(directive(load(), 'connect-src')).toBe("'self'");
  });
});
