export interface CompressOptions {
  /** 最大文件大小 (KB) */
  maxSize?: number;
  /** 压缩质量 0-1 */
  quality?: number;
  /** 最大宽度 (px) */
  maxWidth?: number;
  /** 最大高度 (px) */
  maxHeight?: number;
  /** 输出格式 */
  outputType?: "image/jpeg" | "image/png" | "image/webp";
}

/** 计算等比缩放尺寸 */
function calculateSize(w: number, h: number, maxW: number, maxH: number) {
  if (w <= maxW && h <= maxH) return { width: w, height: h };
  const ratio = Math.min(maxW / w, maxH / h);
  return { width: Math.round(w * ratio), height: Math.round(h * ratio) };
}

/**
 * 图片压缩
 * 如果文件已小于 maxSize 直接返回，否则按配置压缩
 */
export async function compressImage(
  file: File,
  options?: CompressOptions,
): Promise<File> {
  const {
    maxSize = 1024,
    quality = 0.8,
    maxWidth = 1920,
    maxHeight = 1920,
    outputType = "image/jpeg",
  } = options || {};

  if (file.size / 1024 <= maxSize) return file;

  const bitmap = await createImageBitmap(file);
  const { width, height } = calculateSize(
    bitmap.width,
    bitmap.height,
    maxWidth,
    maxHeight,
  );

  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await canvas.convertToBlob({ type: outputType, quality });
  return new File([blob], file.name, { type: outputType });
}

/** File → Base64 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/** Base64 → Blob */
export function base64ToBlob(base64: string): Blob {
  const parts = base64.split(",");
  if (parts.length !== 2) throw new Error("无效的 Base64 字符串");
  const mimeMatch = parts[0].match(/:(.*?);/);
  if (!mimeMatch) throw new Error("无法解析 MIME 类型");

  const mime = mimeMatch[1];
  const binary = atob(parts[1]);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}
