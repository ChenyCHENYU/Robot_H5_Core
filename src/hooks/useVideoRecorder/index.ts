import { ref, type Ref, onUnmounted } from "vue";
import { runBeforeExtensions, runAfterExtensions } from "../extend";

export interface UseVideoRecorderOptions {
  /** 视频宽度 */
  width?: number;
  /** 视频高度 */
  height?: number;
  /** 使用前置/后置摄像头 */
  facingMode?: "user" | "environment";
  /** MIME 类型 */
  mimeType?: string;
  /** 最大录制时长(ms)，0 = 不限 */
  maxDuration?: number;
  /** 是否同时录音 */
  audio?: boolean;
}

export interface UseVideoRecorderReturn {
  videoBlob: Ref<Blob | null>;
  /** 预览 URL（录制完成后可用） */
  videoUrl: Ref<string>;
  duration: Ref<number>;
  recording: Ref<boolean>;
  error: Ref<Error | null>;
  /** 获取媒体流（用于绑定到 video 元素实时预览） */
  getStream: (
    options?: Partial<UseVideoRecorderOptions>,
  ) => Promise<MediaStream | null>;
  start: () => Promise<boolean>;
  stop: () => Promise<Blob | null>;
  clear: () => void;
}

const DEFAULTS: UseVideoRecorderOptions = {
  width: 1280,
  height: 720,
  facingMode: "environment",
  maxDuration: 0,
  audio: true,
};

function getSupportedMimeType(): string {
  const types = [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
    "video/mp4",
  ];
  for (const type of types) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }
  return "video/webm";
}

export function useVideoRecorder(
  options?: UseVideoRecorderOptions,
): UseVideoRecorderReturn {
  const opts = { ...DEFAULTS, ...options };

  const videoBlob = ref<Blob | null>(null);
  const videoUrl = ref("");
  const duration = ref(0);
  const recording = ref(false);
  const error = ref<Error | null>(null);

  let mediaRecorder: MediaRecorder | null = null;
  let mediaStream: MediaStream | null = null;
  let chunks: Blob[] = [];
  let startTime = 0;
  let durationTimer: ReturnType<typeof setInterval> | null = null;
  let maxTimer: ReturnType<typeof setTimeout> | null = null;

  async function getStream(
    overrides?: Partial<UseVideoRecorderOptions>,
  ): Promise<MediaStream | null> {
    const merged = { ...opts, ...overrides };
    error.value = null;

    try {
      const args = await runBeforeExtensions("useVideoRecorder", [merged]);
      mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: merged.width },
          height: { ideal: merged.height },
          facingMode: merged.facingMode,
        },
        audio: merged.audio,
      });
      return mediaStream;
    } catch (e) {
      error.value = e as Error;
      return null;
    }
  }

  async function start(): Promise<boolean> {
    if (!mediaStream) {
      error.value = new Error(
        "[h5-core] useVideoRecorder: 请先调用 getStream() 获取媒体流",
      );
      return false;
    }

    error.value = null;
    videoBlob.value = null;
    videoUrl.value = "";
    chunks = [];

    try {
      const mimeType = opts.mimeType ?? getSupportedMimeType();
      mediaRecorder = new MediaRecorder(mediaStream, { mimeType });

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      mediaRecorder.start(100);
      recording.value = true;
      startTime = Date.now();

      durationTimer = setInterval(() => {
        duration.value = Date.now() - startTime;
      }, 100);

      if (opts.maxDuration && opts.maxDuration > 0) {
        maxTimer = setTimeout(() => stop(), opts.maxDuration);
      }

      return true;
    } catch (e) {
      error.value = e as Error;
      return false;
    }
  }

  async function stop(): Promise<Blob | null> {
    if (!mediaRecorder || mediaRecorder.state === "inactive") return null;

    return new Promise((resolve) => {
      mediaRecorder!.onstop = async () => {
        clearTimers();
        duration.value = Date.now() - startTime;
        recording.value = false;

        const mimeType = mediaRecorder!.mimeType;
        const blob = new Blob(chunks, { type: mimeType });
        const processed = await runAfterExtensions("useVideoRecorder", blob);
        videoBlob.value = processed;
        videoUrl.value = URL.createObjectURL(processed);

        mediaRecorder = null;
        resolve(processed);
      };

      mediaRecorder!.stop();
    });
  }

  function clear() {
    if (videoUrl.value) URL.revokeObjectURL(videoUrl.value);
    videoBlob.value = null;
    videoUrl.value = "";
    duration.value = 0;
  }

  function clearTimers() {
    if (durationTimer) clearInterval(durationTimer);
    if (maxTimer) clearTimeout(maxTimer);
    durationTimer = null;
    maxTimer = null;
  }

  function cleanup() {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop();
    }
    mediaStream?.getTracks().forEach((t) => t.stop());
    clearTimers();
    if (videoUrl.value) URL.revokeObjectURL(videoUrl.value);
  }

  onUnmounted(cleanup);

  return {
    videoBlob,
    videoUrl,
    duration,
    recording,
    error,
    getStream,
    start,
    stop,
    clear,
  };
}
