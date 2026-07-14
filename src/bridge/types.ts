/**
 * Bridge 抽象接口
 * 所有宿主适配器必须实现此接口（或部分实现，未实现部分自动降级到 BrowserBridge）
 */
export interface BridgeAdapter {
  readonly platform: string;

  camera: {
    capture(options?: CameraOptions): Promise<File>;
  };

  scanner: {
    scan(options?: ScanOptions): Promise<string>;
  };

  location: {
    getCurrent(options?: LocationQueryOptions): Promise<Coordinates>;
    watchPosition(
      callback: (pos: Coordinates) => void,
      options?: LocationQueryOptions,
    ): () => void;
  };

  nfc: {
    read(): Promise<NFCData>;
    write(data: NFCData): Promise<void>;
  };

  bluetooth: {
    connect(deviceId: string): Promise<BluetoothDeviceInfo>;
    disconnect(): Promise<void>;
  };

  file: {
    preview(url: string, name?: string): Promise<void>;
  };

  notification: {
    register(token: string): Promise<void>;
    onMessage(callback: (msg: PushMessage) => void): () => void;
  };
}

export interface CameraOptions {
  source?: "camera" | "album" | "both";
  maxSize?: number;
  quality?: number;
}

export interface ScanOptions {
  type?: "qrcode" | "barcode" | "all";
}

export interface LocationQueryOptions {
  timeout?: number;
  enableHighAccuracy?: boolean;
  coordinateSystem?: "gcj02" | "wgs84";
}

export interface Coordinates {
  longitude: number;
  latitude: number;
  altitude?: number;
  accuracy: number;
  timestamp: number;
  /** 对外返回坐标系；基座场景通常为 gcj02。 */
  coordinateSystem?: "gcj02" | "wgs84";
  /** 原生定位 SDK 实际返回的坐标系。 */
  rawCoordinateSystem?: "gcj02" | "wgs84";
  /** 定位服务来源，如 dingtalk、amap、tencent、system。 */
  provider?: string;
  /** 产生定位结果的平台，如 iOS、Android、H5。 */
  platform?: string;
  /** 为当前结果参与质量筛选的采样次数。 */
  sampleCount?: number;
}

export interface NFCData {
  id: string;
  type: string;
  records: Array<{ type: string; data: string }>;
}

export interface BluetoothDeviceInfo {
  id: string;
  name: string;
  connected: boolean;
}

export interface PushMessage {
  title: string;
  body: string;
  data?: Record<string, any>;
  timestamp: number;
}

/** 适配器能力覆盖类型 — 项目侧可部分覆盖某个适配器的能力实现 */
export type BridgeAdapterOverrides = {
  camera?: Partial<BridgeAdapter["camera"]>;
  scanner?: Partial<BridgeAdapter["scanner"]>;
  location?: Partial<BridgeAdapter["location"]>;
  nfc?: Partial<BridgeAdapter["nfc"]>;
  bluetooth?: Partial<BridgeAdapter["bluetooth"]>;
  file?: Partial<BridgeAdapter["file"]>;
  notification?: Partial<BridgeAdapter["notification"]>;
};
