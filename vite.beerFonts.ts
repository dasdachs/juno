import type { Plugin } from 'vite';

const UNUSED_FACES = /@font-face\{[^}]*Material Symbols (Rounded|Sharp|Subset)[^}]*\}/g;
const CDN_FALLBACK = /,\s*url\(https?:\/\/[^)]*\)\s*format\("woff2"\)/g;

/**
 * BeerCSS ships its icon font with a jsDelivr fallback URL and three icon
 * styles Juno never uses. Juno loads no remote resources, so drop both: only
 * the locally bundled "Material Symbols Outlined" face survives.
 */
export function stripRemoteFonts(css: string): string {
  return css.replace(UNUSED_FACES, '').replace(CDN_FALLBACK, '');
}

export function beerLocalFonts(): Plugin {
  return {
    name: 'beer-local-fonts',
    enforce: 'pre',
    transform(code, id) {
      if (!/beercss[\\/].*\.css/.test(id)) return null;
      return { code: stripRemoteFonts(code), map: null };
    },
  };
}
