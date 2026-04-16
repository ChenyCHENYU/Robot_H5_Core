import { ref, type Ref, onUnmounted } from "vue";
import { runBeforeExtensions, runAfterExtensions } from "../extend";

export interface UseAudioRecorderOptions {
  /** 采样率 */
  sampleRate?: number;
  /** MIME 类型 */
  mimeType?: string;
  /** 最大录音时长(ms)，0 = 不限 */
  maxDuration?: number;
}

export interface UseAudioRecorderReturn {
  /** 录音结果 */
  audioBlob: Ref<Blob | null>;
  /** 录音时长(ms) */
  duration: Ref<number>;
  /** 是否正在录音 */
  recording: Ref<boolean>;
  error: Ref<Error | null>;
  start: (options?: Partial<UseAudioRecorderOptions>) => Promise<boolean>;
  stop: () => Promise<Blob | null>;
  /** 暂停录音 */
  pause: () => void;
  /** 恢复录音 */
  resume: () => void;
}

const DEFAULTS: UseAudioRecorderOptions = {
  sampleRate: 44100,
  maxDuration: 0,
};

function getSupportedMimeType(): string {
  const types = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg;codecs=opus",
    "audio/mp4",
  ];
  for (const type of types) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }
  return "audio/webm";
}

export function useAudioRecorder(
  options?: UseAudioRecorderOptions,
): UseAudioRecorderReturn {
  const opts = { ...DEFAULTS, ...options };

  const audioBlob = ref<Blob | null>(null);
  const duration = ref(0);
  const recording = ref(false);
  const error = ref<Error | null>(null);

  let mediaRecorder: MediaRecorder | null = null;
  let mediaStream: MediaStream | null = null;
  let chunks: Blob[] = [];
  let startTime = 0;
  let durationTimer: ReturnType<typeof setInterval> | null = null;
  let maxTimer: ReturnType<typeof setTimeout> | null = null;

  async function start(
    overrides?: Partial<UseAudioRecorderOptions>,
  ): Promise<boolean> {
    const merged = { ...opts, ...overrides };
    error.value = null;
    audioBlob.value = null;
    chunks = [];

    try {
      const args = await runBeforeExtensions("useAudioRecorder", [merged]);
      mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: { sampleRate: merged.sampleRate },
      });

      const mimeType = merged.mimeType ?? getSupportedMimeType();
      mediaRecorder = new MediaRecorder(mediaStream, { mimeType });

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      mediaRecorder.start(100); // 每 100ms 一个 chunk
      recording.value = true;
      startTime = Date.now();

      // 时长计时
      durationTimer = setInterval(() => {
        duration.value = Date.now() - startTime;
      }, 100);

      // 最大时长限制
      if (merged.maxDuration && merged.maxDuration > 0) {
        maxTimer = setTimeout(() => {
          stop();
        }, merged.maxDuration);
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
        const processed = await runAfterExtensions("useAudioRecorder", blob);
        audioBlob.value = processed;

        // 释放麦克风
        mediaStream?.getTracks().forEach((t) => t.stop());
        mediaStream = null;
        mediaRecorder = null;

        resolve(processed);
      };

      mediaRecorder!.stop();
    });
  }

  function pause() {
    if (mediaRecorder?.state === "recording") {
      mediaRecorder.pause();
      if (durationTimer) clearInterval(durationTimer);
    }
  }

  function resume() {
    if (mediaRecorder?.state === "paused") {
      mediaRecorder.resume();
      durationTimer = setInterval(() => {
        duration.value = Date.now() - startTime;
      }, 100);
    }
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
  }

  onUnmounted(cleanup);

  return { audioBlob, duration, recording, error, start, stop, pause, resume };
}
