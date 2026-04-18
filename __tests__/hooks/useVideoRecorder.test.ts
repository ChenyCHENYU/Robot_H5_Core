import { describe, it, expect, vi, beforeEach } from "vitest";
import { withSetup } from "./_helpers";
import { useVideoRecorder } from "../../src/hooks/useVideoRecorder";

// Mock MediaRecorder
let mockState: RecordingState = "inactive";
let mockOnStop: (() => void) | null = null;

const MockMediaRecorder = vi.fn().mockImplementation(() => ({
  start: vi.fn().mockImplementation(() => {
    mockState = "recording";
  }),
  stop: vi.fn().mockImplementation(() => {
    mockState = "inactive";
    mockOnStop?.();
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
  set ondataavailable(_fn: any) {},
  mimeType: "video/webm",
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

describe("useVideoRecorder", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockState = "inactive";
    mockOnStop = null;
  });

  it("初始状态正确", () => {
    const {
      result: { isRecording, duration, stream, error },
    } = withSetup(() => useVideoRecorder());
    expect(isRecording.value).toBe(false);
    expect(duration.value).toBe(0);
    expect(stream.value).toBeNull();
    expect(error.value).toBeNull();
  });

  it("start 开始录制", async () => {
    const {
      result: { start, isRecording, stream },
    } = withSetup(() => useVideoRecorder());
    await start();
    expect(isRecording.value).toBe(true);
    expect(stream.value).toBeDefined();
    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalled();
  });

  it("start 失败时设置 error", async () => {
    (navigator.mediaDevices.getUserMedia as any).mockRejectedValueOnce(
      new Error("摄像头不可用"),
    );
    const {
      result: { start, error },
    } = withSetup(() => useVideoRecorder());
    await start();
    expect(error.value?.message).toBe("摄像头不可用");
  });

  it("stop 未开始时返回 null", async () => {
    const {
      result: { stop },
    } = withSetup(() => useVideoRecorder());
    const blob = await stop();
    expect(blob).toBeNull();
  });

  it("支持自定义选项", () => {
    const {
      result: { isRecording },
    } = withSetup(() =>
      useVideoRecorder({
        facingMode: "user",
        audio: false,
      }),
    );
    expect(isRecording.value).toBe(false);
  });
});
