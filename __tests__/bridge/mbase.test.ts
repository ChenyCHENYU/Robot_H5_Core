import { describe, it, expect, vi, afterEach } from "vitest";
import mbaseAdapter from "../../src/bridge/adapters/mbase";

/**
 * 构造一个会自动回复的「基座」mock：
 * 子应用 postMessage 发起 invoke 后，下一个微任务里按 reply() 生成结果
 * 并通过 window 派发 message 事件，模拟基座完成 JSAPI 调用后的回传。
 */
function mockBase(reply: (msg: any) => any) {
  const postMessage = vi.fn((raw: any) => {
    queueMicrotask(() => {
      const res = reply(raw);
      if (res) {
        window.dispatchEvent(new MessageEvent("message", { data: res }));
      }
    });
  });
  Object.defineProperty(window, "parent", {
    value: { postMessage },
    writable: true,
    configurable: true,
  });
  return postMessage;
}

/** 还原为非嵌入态（顶层窗口） */
function setTopLevel() {
  Object.defineProperty(window, "parent", {
    value: window.self,
    writable: true,
    configurable: true,
  });
}

function ok(id: string, data: unknown) {
  return { source: "mbase-bridge", type: "capability:result", id, ok: true, data };
}

function fail(id: string, reason: string) {
  return { source: "mbase-bridge", type: "capability:result", id, ok: false, reason };
}

describe("mbase 桥接适配器", () => {
  afterEach(() => {
    setTopLevel();
    vi.restoreAllMocks();
  });

  it("camera.capture 经基座拍照并把 base64 转成 File", async () => {
    const base64 = btoa("hello-image-bytes");
    const post = mockBase((raw) =>
      ok(raw.id, { images: [`data:image/jpeg;base64,${base64}`] }),
    );

    const file = await mbaseAdapter.camera.capture();

    expect(file).toBeInstanceOf(File);
    expect(file.type).toBe("image/jpeg");
    expect(file.size).toBeGreaterThan(0);
    // 校验确实通过约定协议发起 takePhoto
    expect(post).toHaveBeenCalledTimes(1);
    const sent = post.mock.calls[0][0];
    expect(sent).toMatchObject({
      source: "mbase-bridge",
      type: "capability:invoke",
      api: "takePhoto",
      payload: { max: 1 },
    });
  });

  it("camera.capture 基座返回空图片时报错", async () => {
    mockBase((raw) => ok(raw.id, { images: [] }));
    await expect(mbaseAdapter.camera.capture()).rejects.toThrow(/未返回拍照结果/);
  });

  it("location.getCurrent 正确映射为 Coordinates", async () => {
    mockBase((raw) =>
      ok(raw.id, { latitude: 30.5, longitude: 114.3, accuracy: 12 }),
    );

    const coord = await mbaseAdapter.location.getCurrent();

    expect(coord.latitude).toBe(30.5);
    expect(coord.longitude).toBe(114.3);
    expect(coord.accuracy).toBe(12);
    expect(typeof coord.timestamp).toBe("number");
  });

  it("location.getCurrent 缺少 accuracy 时回退为 0", async () => {
    mockBase((raw) => ok(raw.id, { latitude: 1, longitude: 2 }));
    const coord = await mbaseAdapter.location.getCurrent();
    expect(coord.accuracy).toBe(0);
  });

  it("scanner.scan 透传 text 并映射扫码类型", async () => {
    const post = mockBase((raw) => ok(raw.id, { text: "SCAN-RESULT" }));

    const text = await mbaseAdapter.scanner.scan({ type: "barcode" });

    expect(text).toBe("SCAN-RESULT");
    expect(post.mock.calls[0][0]).toMatchObject({
      api: "scan",
      payload: { type: "barCode" },
    });
  });

  it("基座返回 ok:false 时 reject 并带上 reason", async () => {
    mockBase((raw) => fail(raw.id, "用户取消"));
    await expect(mbaseAdapter.scanner.scan()).rejects.toThrow(/用户取消/);
  });

  it("未嵌入基座（顶层窗口）时立即 reject", async () => {
    setTopLevel();
    await expect(mbaseAdapter.location.getCurrent()).rejects.toThrow(/未嵌入基座/);
  });

  it("location.watchPosition 取一次点后回调一次并返回取消函数", async () => {
    mockBase((raw) => ok(raw.id, { latitude: 10, longitude: 20, accuracy: 5 }));

    const positions: any[] = [];
    const stop = mbaseAdapter.location.watchPosition((p) => positions.push(p));
    expect(typeof stop).toBe("function");

    // 等待单次定位回调
    await new Promise((r) => setTimeout(r, 0));

    expect(positions).toHaveLength(1);
    expect(positions[0]).toMatchObject({ latitude: 10, longitude: 20 });
    stop();
  });

  it("回退能力：nfc/bluetooth/notification 沿用 browser 适配器（存在且可调用）", () => {
    expect(mbaseAdapter.platform).toBe("mbase");
    expect(typeof mbaseAdapter.nfc?.read).toBe("function");
    expect(typeof mbaseAdapter.bluetooth?.connect).toBe("function");
    expect(typeof mbaseAdapter.notification?.register).toBe("function");
  });
});
