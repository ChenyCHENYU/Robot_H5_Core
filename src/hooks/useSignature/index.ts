import { ref, type Ref, onUnmounted } from "vue";
import { runBeforeExtensions, runAfterExtensions } from "../extend";

export interface UseSignatureOptions {
  /** 画布宽度 */
  width?: number;
  /** 画布高度 */
  height?: number;
  /** 线条颜色 */
  penColor?: string;
  /** 线条宽度 */
  penWidth?: number;
  /** 背景色 */
  backgroundColor?: string;
  /** 导出格式 */
  outputType?: "image/png" | "image/jpeg" | "image/webp";
  /** 导出质量 0-1（仅 jpeg/webp） */
  quality?: number;
}

export interface UseSignatureReturn {
  /** 签名图片 base64 */
  signature: Ref<string>;
  /** 是否为空画布 */
  isEmpty: Ref<boolean>;
  /** 绑定到 canvas 元素 */
  bindCanvas: (canvas: HTMLCanvasElement) => void;
  /** 清除画布 */
  clear: () => void;
  /** 撤销上一笔 */
  undo: () => void;
  /** 导出为 base64 */
  toDataURL: () => string;
  /** 导出为 File */
  toFile: (fileName?: string) => Promise<File>;
}

const DEFAULTS: UseSignatureOptions = {
  width: 600,
  height: 300,
  penColor: "#000000",
  penWidth: 2,
  backgroundColor: "#ffffff",
  outputType: "image/png",
  quality: 0.92,
};

export function useSignature(
  options?: UseSignatureOptions,
): UseSignatureReturn {
  const opts = { ...DEFAULTS, ...options };

  const signature = ref("");
  const isEmpty = ref(true);

  let canvas: HTMLCanvasElement | null = null;
  let ctx: CanvasRenderingContext2D | null = null;
  let isDrawing = false;
  /** 存储历史路径，用于撤销 */
  let paths: ImageData[] = [];

  function getPoint(e: MouseEvent | TouchEvent): { x: number; y: number } {
    const rect = canvas!.getBoundingClientRect();
    if ("touches" in e) {
      const touch = e.touches[0];
      return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function onStart(e: MouseEvent | TouchEvent) {
    e.preventDefault();
    if (!ctx || !canvas) return;
    isDrawing = true;
    // 保存当前状态用于撤销
    paths.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
    const { x, y } = getPoint(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  }

  function onMove(e: MouseEvent | TouchEvent) {
    e.preventDefault();
    if (!isDrawing || !ctx) return;
    const { x, y } = getPoint(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  }

  function onEnd() {
    if (!isDrawing) return;
    isDrawing = false;
    isEmpty.value = false;
  }

  function bindCanvas(el: HTMLCanvasElement) {
    canvas = el;
    ctx = el.getContext("2d");
    if (!ctx) return;

    el.width = opts.width!;
    el.height = opts.height!;

    // 初始化画布
    ctx.fillStyle = opts.backgroundColor!;
    ctx.fillRect(0, 0, el.width, el.height);
    ctx.strokeStyle = opts.penColor!;
    ctx.lineWidth = opts.penWidth!;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // 绑定事件
    el.addEventListener("mousedown", onStart);
    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseup", onEnd);
    el.addEventListener("mouseleave", onEnd);
    el.addEventListener("touchstart", onStart, { passive: false });
    el.addEventListener("touchmove", onMove, { passive: false });
    el.addEventListener("touchend", onEnd);
  }

  function clear() {
    if (!ctx || !canvas) return;
    ctx.fillStyle = opts.backgroundColor!;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = opts.penColor!;
    ctx.lineWidth = opts.penWidth!;
    paths = [];
    isEmpty.value = true;
    signature.value = "";
  }

  function undo() {
    if (!ctx || !canvas || paths.length === 0) return;
    const prev = paths.pop()!;
    ctx.putImageData(prev, 0, 0);
    isEmpty.value = paths.length === 0;
  }

  function toDataURL(): string {
    if (!canvas) return "";
    const data = canvas.toDataURL(opts.outputType, opts.quality);
    signature.value = data;
    return data;
  }

  async function toFile(fileName = "signature.png"): Promise<File> {
    if (!canvas) throw new Error("[h5-core] useSignature: canvas 未绑定");

    const args = await runBeforeExtensions("useSignature", [opts]);

    return new Promise((resolve, reject) => {
      canvas!.toBlob(
        async (blob) => {
          if (!blob) return reject(new Error("导出签名失败"));
          const file = new File([blob], fileName, { type: opts.outputType });
          const processed = await runAfterExtensions("useSignature", file);
          resolve(processed);
        },
        opts.outputType,
        opts.quality,
      );
    });
  }

  function cleanup() {
    if (!canvas) return;
    canvas.removeEventListener("mousedown", onStart);
    canvas.removeEventListener("mousemove", onMove);
    canvas.removeEventListener("mouseup", onEnd);
    canvas.removeEventListener("mouseleave", onEnd);
    canvas.removeEventListener("touchstart", onStart);
    canvas.removeEventListener("touchmove", onMove);
    canvas.removeEventListener("touchend", onEnd);
  }

  onUnmounted(cleanup);

  return { signature, isEmpty, bindCanvas, clear, undo, toDataURL, toFile };
}
