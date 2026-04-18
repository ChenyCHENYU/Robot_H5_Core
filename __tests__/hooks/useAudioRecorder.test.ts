import { describe, it, expect, vi, beforeEach } from "vitest";
import { withSetup } from "./_helpers";
import { useAudioRecorder } from "../../src/hooks/useAudioRecorder";

// Mock MediaRecorder
let mockState: RecordingState = "inactive";
let mockOnStop: (() => void) | null = null;
let mockOnDataAvailable: ((e: any) => void) | null = null;

const MockMediaRecorder = vi.fn().mockImplementation(() => ({
  start: vi.fn().mockImplementation(() => {
    mockState = "recording";
  }),
  stop: vi.fn().mockImplementation(() => {
    mockState = "inactive";
    mockOnStop?.();
  }),
  pause: vi.fn().mockImplementation(() => {
    mockState = "paused";
  }),
  resume: vi.fn().mockImplementation(() => {
    mockState = "recording";
  }),
  get state() {
    return mockState;
  },
  set onstop(fn: any) {
    mockOnStop = fn;
  },
  get onstop() {
    return mockOnStop;
  },
  set ondataavailable(fn: any) {
    mockOnDataAvailable = fn;
  },
  get ondataavailable() {
    return mockOnDataAvailable;
  },
  mimeType: "audio/webm",
}));

(MockMediaRecorder as any).isTypeSupported = vi.fn().mockReturnValue(true);
vi.stubGlobal("MediaRecorder", MockMediaRecorder);

const mockStream = {
  getTracks: () => [{ stop: vi.fn() }],
};
vi.stubGlobal("navigator", {
  ...navigator,
  mediaDevices: {
    getUserMedia: vi.fn().mockResolvedValue(mockStream),
  },
});

describe("useAudioRecorder", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockState = "inactive";
    mockOnStop = null;
    mockOnDataAvailable = null;
  });

  it("初始状态正确", () => {
    const {
      result: { isRecording, isPaused, duration, error },
    } = withSetup(() => useAudioRecorder());
    expect(isRecording.value).toBe(false);
    expect(isPaused.value).toBe(false);
    expect(duration.value).toBe(0);
    expect(error.value).toBeNull();
  });

  it("start 开始录音", async () => {
    const {
      result: { start, isRecording },
    } = withSetup(() => useAudioRecorder());
    await start();
    expect(isRecording.value).toBe(true);
    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({
      audio: true,
    });
  });

  it("start 失败时设置 error", async () => {
    (navigator.mediaDevices.getUserMedia as any).mockRejectedValueOnce(
      new Error("权限被拒"),
    );
    const {
      result: { start, error },
    } = withSetup(() => useAudioRecorder());
    await start();
    expect(error.value?.message).toBe("权限被拒");
  });

  it("stop 未开始时返回 null", async () => {
    const {
      result: { stop },
    } = withSetup(() => useAudioRecorder());
    const blob = await stop();
    expect(blob).toBeNull();
  });

  it("pause 和 resume", async () => {
    const {
      result: { start, pause, resume, isPaused },
    } = withSetup(() => useAudioRecorder());
    await start();

    pause();
    expect(isPaused.value).toBe(true);

    resume();
    expect(isPaused.value).toBe(false);
  });

  it("支持自定义选项", () => {
    const {
      result: { isRecording },
    } = withSetup(() =>
      useAudioRecorder({
        mimeType: "audio/ogg",
        audioBitsPerSecond: 128000,
      }),
    );
    expect(isRecording.value).toBe(false);
  });
});
