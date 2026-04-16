import { ref, type Ref, onUnmounted } from "vue";
import { runBeforeExtensions, runAfterExtensions } from "../extend";

export interface UseAudioRecorderOptions {
  mimeType?: string;
  audioBitsPerSecond?: number;
}

export interface UseAudioRecorderReturn {
  isRecording: Ref<boolean>;
  isPaused: Ref<boolean>;
  duration: Ref<number>;
  error: Ref<Error | null>;
  start: () => Promise<void>;
  stop: () => Promise<Blob | null>;
  pause: () => void;
  resume: () => void;
}

/**
 * 录音 Hook — 基于 MediaRecorder API
 * 支持开始/暂停/恢复/停止，返回音频 Blob
 */
export function useAudioRecorder(options?: UseAudioRecorderOptions): UseAudioRecorderReturn {
  const isRecording = ref(false);
  const isPaused = ref(false);
  const duration = ref(0);
  const error = ref<Error | null>(null);

  let mediaRecorder: MediaRecorder | null = null;
  let chunks: Blob[] = [];
  let timer: ReturnType<typeof setInterval> | null = null;
  let stream: MediaStream | null = null;
  let startTime = 0;

  function getAudioMimeType(): string {
    const types = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/ogg;codecs=opus",
      "audio/mp4",
    ];
    for (const type of types) {
      if (
        typeof MediaRecorder !== "undefined" &&
        MediaRecorder.isTypeSupported(type)
      )
        return type;
    }
    return "audio/webm";
  }

  async function start(): Promise<void> {
    error.value = null;
    try {
      await runBeforeExtensions("useAudioRecorder", []);
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const mimeType = options?.mimeType || getAudioMimeType();
      mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: options?.audioBitsPerSecond,
      });
      chunks = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      mediaRecorder.start(100);
      isRecording.value = true;
      isPaused.value = false;
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
        isPaused.value = false;

        stream?.getTracks().forEach((t) => t.stop());
        stream = null;

        const blob = new Blob(chunks, { type: mediaRecorder!.mimeType });
        const result = await runAfterExtensions("useAudioRecorder", blob);
        resolve(result);
      };
      mediaRecorder!.stop();
    });
  }

  function pause() {
    if (mediaRecorder?.state === "recording") {
      mediaRecorder.pause();
      isPaused.value = true;
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    }
  }

  function resume() {
    if (mediaRecorder?.state === "paused") {
      mediaRecorder.resume();
      isPaused.value = false;
      startTime = Date.now() - duration.value;
      timer = setInterval(() => {
        duration.value = Date.now() - startTime;
      }, 100);
    }
  }

  function cleanup() {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop();
    }
    stream?.getTracks().forEach((t) => t.stop());
    if (timer) clearInterval(timer);
  }

  onUnmounted(cleanup);

  return { isRecording, isPaused, duration, error, start, stop, pause, resume };
}
