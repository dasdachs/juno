import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { stripRemoteFonts } from '../../vite.beerFonts';

const beerCss = readFileSync(
  resolve(__dirname, '../../node_modules/beercss/dist/cdn/beer.min.css'),
  'utf8'
);

describe('stripRemoteFonts', () => {
  const stripped = stripRemoteFonts(beerCss);

  it('leaves no remote URL in the BeerCSS bundle', () => {
    expect(beerCss).toMatch(/https?:\/\//); // guards the test itself
    expect(stripped).not.toMatch(/https?:\/\//);
  });

  it('keeps only the locally bundled outlined icon font', () => {
    const faces = stripped.match(/@font-face\{[^}]*\}/g) ?? [];
    expect(faces).toHaveLength(1);
    expect(faces[0]).toContain('Material Symbols Outlined');
    expect(faces[0]).toContain('url(material-symbols-outlined.woff2)');
  });
});
