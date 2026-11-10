import { describe, it, expect } from 'vitest';
import { fileToAvatarDataUrl } from './avatarImage';

describe('fileToAvatarDataUrl guards', () => {
  it('rejects a non-image file', async () => {
    const file = new File(['hello'], 'a.txt', { type: 'text/plain' });
    await expect(fileToAvatarDataUrl(file)).rejects.toThrow('Please choose an image file');
  });

  it('rejects an image over 10MB', async () => {
    const file = new File(['x'], 'big.png', { type: 'image/png' });
    Object.defineProperty(file, 'size', { value: 10 * 1024 * 1024 + 1 });
    await expect(fileToAvatarDataUrl(file)).rejects.toThrow('Image is too large');
  });
});
