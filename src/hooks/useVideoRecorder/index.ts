import { ref, type Ref, onUnmounted } from "vue";
import { runBeforeExtensions, runAfterExtensions } from "../extend";

export interface UseVideoRecorderOptions {
  mimeType?: string;
  videoBitsPerSecond?: number;
  audio?: boolean;
  facingMode?: "user" | "environment";
}

export interface UseVideoRecorderReturn {
  isRecording: Ref<boolean>;
  duration: Ref<number>;
  stream: Ref<MediaStream | null>;
  error: Ref<Error | null>;
  start: () => Promise<void>;
  stop: () => Promise<Blob | null>;
}

const DEFAULTS: UseVideoRecorderOptions = {
  audio: true,
  facingMode: "environment",
};

/**
 * 视频录制 Hook — 基于 MediaRecorder API
 * 返回 stream 可绑定到 video 元素实时预览
 */
export function useVideoRecorder(options?: UseVideoRecorderOptions): UseVideoRecorderReturn {
  const opts = { ...DEFAULTS, ...options };

  const isRecording = ref(false);
  const duration = ref(0);
  const streamRef = ref<MediaStream | null>(null);
  const error = ref<Error | null>(null);

  let mediaRecorder: MediaRecorder | null = null;
  let chunks: Blob[] = [];
  let timer: ReturnType<typeof setInterval> | null = null;
  let startTime = 0;

  function getVideoMimeType(): string {
    const types = [
      "video/webm;codecs=vp9,opus",
      "video/webm;codecs=vp8,opus",
      "video/webm",
      "video/mp4",
    ];
    for (const type of types) {
      if (
        typeof MediaRecorder !== "undefined" &&
        MediaRecorder.isTypeSupported(type)
      )
        return type;
    }
    return "video/webm";
  }

  async function start(): Promise<void> {
    error.value = null;
    try {
      await runBeforeExtensions("useVideoRecorder", []);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: opts.facingMode },
        audio: opts.audio,
      });
      streamRef.value = mediaStream;

      const mimeType = opts.mimeType || getVideoMimeType();
      mediaRecorder = new MediaRecorder(mediaStream, {
        mimeType,
        videoBitsPerSecond: opts.videoBitsPerSecond,
      });
      chunks = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      mediaRecorder.start(100);
      isRecording.value = true;
      duration.value = 0;
      startTime = Date.now();
      timer = setInterval(() => {
        duration.value = Date.now() - startTime;
      }, 100);
    } catch (e) {
      error.value = e as Error;
    }
  }

  async function stop(): Promise<Blob | null> {
    if (!mediaRecorder || mediaRecorder.state === "inactive") return null;

    return new Promise<Blob | null>((resolve) => {
      mediaRecorder!.onstop = async () => {
        if (timer) {
          clearInterval(timer);
          timer = null;
        }
        isRecording.value = false;

        streamRef.value?.getTracks().forEach((t) => t.stop());
        streamRef.value = null;

        const blob = new Blob(chunks, { type: mediaRecorder!.mimeType });
        const result = await runAfterExtensions("useVideoRecorder", blob);
        resolve(result);
      };
      mediaRecorder!.stop();
    });
  }

  function cleanup() {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop();
    }
    streamRef.value?.getTracks().forEach((t) => t.stop());
    if (timer) clearInterval(timer);
  }

  onUnmounted(cleanup);

  return { isRecording, duration, stream: streamRef, error, start, stop };
}
