// The avatar is stored inside the encrypted profile as a small embedded
// image. It is never a remote URL: loading one would tell a third-party
// server the user's IP address and every time they open the app.

const AVATAR_SIZE = 128;
const MAX_SOURCE_BYTES = 10 * 1024 * 1024;

/** Downscale a picked image file to a square JPEG data URL. */
export async function fileToAvatarDataUrl(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Please choose an image file');
  }
  if (file.size > MAX_SOURCE_BYTES) {
    throw new Error('Image is too large');
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Could not read that image'));
      img.src = objectUrl;
    });

    const canvas = document.createElement('canvas');
    canvas.width = AVATAR_SIZE;
    canvas.height = AVATAR_SIZE;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Could not process that image');

    // Centre-crop to a square, then scale down
    const side = Math.min(image.naturalWidth, image.naturalHeight);
    const sx = (image.naturalWidth - side) / 2;
    const sy = (image.naturalHeight - side) / 2;
    context.drawImage(image, sx, sy, side, side, 0, 0, AVATAR_SIZE, AVATAR_SIZE);

    // Re-encoding also drops any metadata (location, camera) from the original
    return canvas.toDataURL('image/jpeg', 0.85);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
