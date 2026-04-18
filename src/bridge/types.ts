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
    getCurrent(): Promise<Coordinates>;
    watchPosition(callback: (pos: Coordinates) => void): () => void;
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

export interface Coordinates {
  longitude: number;
  latitude: number;
  altitude?: number;
  accuracy: number;
  timestamp: number;
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
