// Downscale a photo in the browser before upload so stored images stay small:
// max 512px on the long edge, JPEG at 85%, usually 20 to 60 KB.
export async function resizeImage(file: File, maxSize = 512): Promise<Blob> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("That file couldn't be read as an image."));
      img.src = url;
    });

    const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
    const width = Math.max(1, Math.round(img.width * scale));
    const height = Math.max(1, Math.round(img.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("This browser can't resize images.");
    ctx.drawImage(img, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
    if (!blob) throw new Error("The image couldn't be processed.");
    return blob;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function itemImageUrl(id: string, version: string) {
  return `/api/items/${id}/image?v=${version}`;
}
