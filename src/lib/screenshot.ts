import { File } from "expo-file-system";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import type { Screenshot } from "./checkout";

// Same limits as the website's src/lib/screenshot.ts, with native APIs.

/** Longest side after downscaling; phone screenshots stay legible at this size. */
const MAX_SIDE = 2000;
const QUALITY = 0.85;
/** Largest file we accept from the picker. */
const MAX_INPUT = 10 * 1024 * 1024;
/** Largest upload (the script accepts up to 4,200,000 base64 characters; base64 is 4/3 larger). */
const MAX_UPLOAD = 3 * 1024 * 1024;

export type PickedImage = {
  uri: string;
  width: number;
  height: number;
  fileSize?: number | null;
  fileName?: string | null;
  mimeType?: string | null;
};

/** A prepared upload plus a local file to preview it. */
export type PreparedScreenshot = Screenshot & { uri: string };

function sizeOf(image: PickedImage) {
  if (typeof image.fileSize === "number") return image.fileSize;
  try {
    return new File(image.uri).size ?? 0;
  } catch {
    return 0;
  }
}

/**
 * Turns a chosen payment screenshot into an upload: downscaled to MAX_SIDE (never upscaled),
 * re-encoded as a JPEG with base64 output. Throws for non-images, inputs over 10 MB and results over 3 MB.
 */
export async function prepareScreenshot(image: PickedImage): Promise<PreparedScreenshot> {
  if (image.mimeType && !image.mimeType.startsWith("image/")) throw new Error("Unsupported file");
  if (sizeOf(image) > MAX_INPUT) throw new Error("File too large");

  const context = ImageManipulator.manipulate(image.uri);
  const longest = Math.max(image.width, image.height);
  if (longest > MAX_SIDE) {
    const scale = MAX_SIDE / longest;
    context.resize(
      image.width >= image.height
        ? { width: Math.round(image.width * scale) }
        : { height: Math.round(image.height * scale) },
    );
  }
  const rendered = await context.renderAsync();
  const saved = await rendered.saveAsync({ format: SaveFormat.JPEG, compress: QUALITY, base64: true });
  const data = saved.base64 ?? "";
  const bytes = Math.floor((data.length * 3) / 4);
  if (!data || bytes > MAX_UPLOAD) throw new Error("File too large");

  const original = image.fileName?.trim() || "payment";
  return { name: `${original.replace(/\.[^.]+$/, "")}.jpg`, type: "image/jpeg", data, uri: saved.uri };
}
