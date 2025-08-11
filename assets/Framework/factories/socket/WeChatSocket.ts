import { Socket, SocketCloseEvent, SocketEvent, SocketMessageEvent } from 'db://assets/Framework/factories/socket/Socket';
import { LogManager } from 'db://assets/Framework/managers/LogManager';

function toArrayBuffer(data: Buffer | Uint8Array): ArrayBuffer {
  // 所有 TypedArray (包括 Buffer) 都有 .buffer, .byteOffset, .byteLength
  return data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
}

export class WeChatSocket extends Socket {
  private socketTask: WechatMinigame.SocketTask;
  private _readyState = Socket.CONNECTING;

  constructor(url: string, protocols?: string | string[]) {
    super(url, protocols);
    this.socketTask = wx.connectSocket({
      url,
      success: (res) => {
        LogManager.info('[WeChatSocket#connect]', res);
      },
      fail: (res) => {
        LogManager.error('[WeChatSocket#connect]', res);
      },
    });

    this.socketTask.onOpen(() => {
      this._readyState = Socket.OPEN;
      const ev = new SocketEvent('open');
      this.onopen?.(ev);
    });

    this.socketTask.onMessage((res) => {
      const ev = new SocketMessageEvent('message', { data: res.data });
      this.onmessage?.(ev);
    });

    this.socketTask.onClose((res) => {
      this._readyState = Socket.CLOSED;
      const ev = new SocketCloseEvent('close', {
        code: res.code,
        reason: res.reason,
      });
      this.onclose?.(ev);
    });

    this.socketTask.onError((res) => {
      const ev = new SocketCloseEvent('error', { code: -1, reason: res.errMsg });
      this.onerror?.(ev);
    });
  }

  get readyState(): number {
    return this._readyState;
  }

  send(data: Buffer | Uint8Array): void {
    if (this._readyState !== Socket.OPEN) {
      LogManager.error('[WeChatSocket#send]', 'Socket not open');
      return;
    }

    this.socketTask.send({
      data: toArrayBuffer(data),
      fail: (res) => {
        LogManager.error('[WeChatSocket#send]', res, data);
      },
    });
  }

  close(code?: number, reason?: string): void {
    this._readyState = Socket.CLOSING;
    this.socketTask.close({ code, reason });
  }
}
