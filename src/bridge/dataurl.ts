/**
 * dataURL / base64 转换工具（桥接层共享）
 *
 * 钉钉 iframe 沙箱可能拦截 fetch(data:)，故统一走 atob 手工解码。
 */

/**
 * 规范化钉钉返回的 base64：
 * 钉钉 biz.util.uploadImageFromCamera 返回的 base64 带 MIME 换行/空白，
 * 部分版本用 URL-safe 字符(-、_)或缺失 = 填充，标准 atob 会直接抛错，统一规范化。
 */
export function sanitizeBase64(raw: string): string {
  let b = raw
    .replace(/^data:[^;]+;base64,/, "")
    .replace(/\s/g, "")
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const pad = b.length % 4;
  if (pad) b += "=".repeat(4 - pad);
  return b;
}

/** base64 / dataURI → File（钉钉 iframe 沙箱可能拦截 fetch(data:)，故直接 atob） */
export function base64ToFile(src: string, filename: string): File {
  const mimeMatch = /^data:([^;]+);base64,/.exec(src);
  const mime = mimeMatch ? mimeMatch[1] : "image/jpeg";
  const rawB64 = mimeMatch ? src.slice(mimeMatch[0].length) : src;
  const b64 = sanitizeBase64(rawB64);
  try {
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new File([bytes], filename, { type: mime });
  } catch {
    throw new Error("[h5-core] 图片解码失败，请重试");
  }
}
