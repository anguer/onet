export class SocketEvent {
  readonly type: string;

  constructor(type: string) {
    this.type = type;
  }
}

interface MessageEventInit {
  data: string | ArrayBuffer;
}

export class SocketMessageEvent {
  readonly type: string;
  readonly data: string | ArrayBuffer;

  constructor(type: string, eventInitDict: MessageEventInit) {
    this.type = type;
    this.data = eventInitDict.data;
  }
}

interface CloseEventInit {
  code: number;
  reason: string;
}

export class SocketCloseEvent {
  readonly type: string;
  readonly code: number;
  readonly reason: string;

  constructor(type: string, eventInitDict: CloseEventInit) {
    this.type = type;
    this.code = eventInitDict.code;
    this.reason = eventInitDict.reason;
  }
}

export interface OnOpenCallback {
  (ev: SocketEvent): void;
}

export interface OnMessageCallback {
  (ev: SocketMessageEvent): void;
}

export interface OnCloseCallback {
  (ev: SocketCloseEvent): void;
}

export interface OnErrorCallback {
  (ev: SocketCloseEvent): void;
}

export abstract class Socket {
  // readyState 常量
  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSING = 2;
  static readonly CLOSED = 3;

  // URL 和 状态只读属性
  abstract get readyState(): number;

  // 事件回调属性
  onopen: OnOpenCallback | null = null;
  onmessage: OnMessageCallback | null = null;
  onclose: OnCloseCallback | null = null;
  onerror: OnErrorCallback | null = null;

  protected constructor(
    protected readonly url: string,
    protected readonly protocols?: string | string[],
  ) {}

  // 子类必须实现发送和关闭
  abstract send(data: string | ArrayBufferLike | Blob | ArrayBufferView): void;
  abstract close(code?: number, reason?: string): void;
}
