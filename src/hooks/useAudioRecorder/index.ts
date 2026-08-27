import { ref, type Ref, onUnmounted } from "vue";
import { runBeforeExtensions, runAfterExtensions } from "../extend";
import { detectMbaseHost } from "../../bridge/detector";
import { invokeMbaseCapability } from "../../bridge/mbase";
import { base64ToFile } from "../../bridge/dataurl";

export interface UseAudioRecorderOptions {
  mimeType?: string;
  audioBitsPerSecond?: number;
  /**
   * 优先使用基座录音（wl-mbase App 容器，三段式 start/stop）。
   * 开启后 pause/resume 在基座模式下为 no-op；stop() 返回 mp3/aac Blob。
   * 非基座环境自动回退 MediaRecorder，行为不变。默认 false。
   */
  preferHostBridge?: boolean;
  /** 基座录音最长时长（秒），默认 60，范围 5-300；到达后自动停止。 */
  maxDuration?: number;
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
  const opts = { preferHostBridge: false, maxDuration: 60, ...options };
  const isRecording = ref(false);
  const isPaused = ref(false);
  const duration = ref(0);
  const error = ref<Error | null>(null);

  let mediaRecorder: MediaRecorder | null = null;
  let chunks: Blob[] = [];
  let timer: ReturnType<typeof setInterval> | null = null;
  let stream: MediaStream | null = null;
  let startTime = 0;

  function hostMode(): boolean {
    return opts.preferHostBridge === true && detectMbaseHost() === "app";
  }

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
      if (hostMode()) {
        await invokeMbaseCapability("audioRecord", {
          action: "start",
          maxDuration: opts.maxDuration ?? 60,
        });
        isRecording.value = true;
        isPaused.value = false;
        duration.value = 0;
        startTime = Date.now();
        timer = setInterval(() => {
          duration.value = Date.now() - startTime;
        }, 100);
        return;
      }
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
    if (hostMode()) {
      if (!isRecording.value) return null;
      try {
        const data = await invokeMbaseCapability<{
          audio?: string;
          duration?: number;
        }>("audioRecord", { action: "stop" });
        if (timer) {
          clearInterval(timer);
          timer = null;
        }
        isRecording.value = false;
        isPaused.value = false;
        if (!data?.audio) return null;
        const blob = base64ToFile(data.audio, `audio-${Date.now()}.mp3`);
        const result = await runAfterExtensions("useAudioRecorder", blob);
        return result;
      } catch (e) {
        error.value = e as Error;
        if (timer) {
          clearInterval(timer);
          timer = null;
        }
        isRecording.value = false;
        return null;
      }
    }
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
    if (hostMode()) {
      if (isRecording.value) {
        void invokeMbaseCapability("audioRecord", { action: "cancel" }).catch(
          () => {
            /* 静默 */
          },
        );
      }
      if (timer) clearInterval(timer);
      isRecording.value = false;
      return;
    }
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop();
    }
    stream?.getTracks().forEach((t) => t.stop());
    if (timer) clearInterval(timer);
  }

  onUnmounted(cleanup);

  return { isRecording, isPaused, duration, error, start, stop, pause, resume };
}
