import { ref, type Ref, onUnmounted } from "vue";
import { runBeforeExtensions, runAfterExtensions } from "../extend";

export interface UseSignatureOptions {
  lineWidth?: number;
  strokeColor?: string;
  backgroundColor?: string;
}

export interface UseSignatureReturn {
  isEmpty: Ref<boolean>;
  bindCanvas: (canvas: HTMLCanvasElement) => void;
  clear: () => void;
  save: (type?: string, quality?: number) => Promise<File | null>;
  undo: () => void;
}

const DEFAULTS: UseSignatureOptions = {
  lineWidth: 2,
  strokeColor: "#000000",
  backgroundColor: "#ffffff",
};

/**
 * Canvas 手写签名 Hook
 * 支持触屏和鼠标绘制，提供撤销/清除/保存能力
 */
export function useSignature(options?: UseSignatureOptions): UseSignatureReturn {
  const opts = { ...DEFAULTS, ...options };

  const isEmpty = ref(true);
  let canvas: HTMLCanvasElement | null = null;
  let ctx: CanvasRenderingContext2D | null = null;
  let isDrawing = false;
  let paths: Array<Array<{ x: number; y: number }>> = [];
  let currentPath: Array<{ x: number; y: number }> = [];

  function getPos(e: MouseEvent | TouchEvent): { x: number; y: number } {
    const rect = canvas!.getBoundingClientRect();
    if ("touches" in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function onStart(e: MouseEvent | TouchEvent) {
    e.preventDefault();
    isDrawing = true;
    currentPath = [];
    const pos = getPos(e);
    currentPath.push(pos);
    ctx!.beginPath();
    ctx!.moveTo(pos.x, pos.y);
  }

  function onMove(e: MouseEvent | TouchEvent) {
    if (!isDrawing) return;
    e.preventDefault();
    const pos = getPos(e);
    currentPath.push(pos);
    ctx!.lineTo(pos.x, pos.y);
    ctx!.stroke();
  }

  function onEnd() {
    if (!isDrawing) return;
    isDrawing = false;
    if (currentPath.length > 0) {
      paths.push([...currentPath]);
      isEmpty.value = false;
    }
    currentPath = [];
  }

  function redraw() {
    if (!ctx || !canvas) return;
    ctx.fillStyle = opts.backgroundColor!;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = opts.strokeColor!;
    ctx.lineWidth = opts.lineWidth!;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    for (const path of paths) {
      if (path.length === 0) continue;
      ctx.beginPath();
      ctx.moveTo(path[0].x, path[0].y);
      for (let i = 1; i < path.length; i++) {
        ctx.lineTo(path[i].x, path[i].y);
      }
      ctx.stroke();
    }
  }

  function bindCanvas(el: HTMLCanvasElement) {
    canvas = el;
    ctx = el.getContext("2d");
    if (!ctx) return;

    ctx.strokeStyle = opts.strokeColor!;
    ctx.lineWidth = opts.lineWidth!;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.fillStyle = opts.backgroundColor!;
    ctx.fillRect(0, 0, el.width, el.height);

    el.addEventListener("mousedown", onStart);
    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseup", onEnd);
    el.addEventListener("mouseleave", onEnd);
    el.addEventListener("touchstart", onStart, { passive: false });
    el.addEventListener("touchmove", onMove, { passive: false });
    el.addEventListener("touchend", onEnd);
  }

  function unbindCanvas() {
    if (!canvas) return;
    canvas.removeEventListener("mousedown", onStart);
    canvas.removeEventListener("mousemove", onMove);
    canvas.removeEventListener("mouseup", onEnd);
    canvas.removeEventListener("mouseleave", onEnd);
    canvas.removeEventListener("touchstart", onStart);
    canvas.removeEventListener("touchmove", onMove);
    canvas.removeEventListener("touchend", onEnd);
  }

  function clear() {
    paths = [];
    currentPath = [];
    isEmpty.value = true;
    if (ctx && canvas) {
      ctx.fillStyle = opts.backgroundColor!;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }

  function undo() {
    paths.pop();
    isEmpty.value = paths.length === 0;
    redraw();
  }

  async function save(
    type = "image/png",
    quality = 0.92,
  ): Promise<File | null> {
    if (!canvas || isEmpty.value) return null;
    try {
      await runBeforeExtensions("useSignature", []);
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas!.toBlob(resolve, type, quality),
      );
      if (!blob) return null;
      const file = new File([blob], `signature-${Date.now()}.png`, { type });
      const result = await runAfterExtensions("useSignature", file);
      return result;
    } catch {
      return null;
    }
  }

  onUnmounted(unbindCanvas);

  return { isEmpty, bindCanvas, clear, save, undo };
}
