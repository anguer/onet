import { Socket, SocketCloseEvent, SocketEvent, SocketMessageEvent } from 'db://assets/Framework/factories/socket/Socket';
import { LogManager } from 'db://assets/Framework/managers/LogManager';

export class InternalSocket extends Socket {
  private ws: WebSocket;

  constructor(url: string, protocols?: string | string[]) {
    super(url, protocols);
    this.ws = new WebSocket(url, protocols);
    this.ws.binaryType = 'arraybuffer';

    // 绑定事件，立即发起连接
    this.ws.onopen = (ev) => {
      this.onopen?.(new SocketEvent(ev.type));
    };
    this.ws.onmessage = (ev) => {
      this.onmessage?.(new SocketMessageEvent(ev.type, { data: ev.data }));
    };
    this.ws.onclose = (ev) => {
      this.onclose?.(new SocketCloseEvent(ev.type, { code: ev.code, reason: ev.reason }));
    };
    this.ws.onerror = (ev) => {
      this.onerror?.(new SocketCloseEvent(ev.type, { code: -1, reason: 'Unknown error occurred' }));
    };
  }

  get readyState() {
    return this.ws.readyState;
  }

  send(data: Buffer | Uint8Array): void {
    if (this.ws.readyState !== Socket.OPEN) {
      LogManager.error('[InternalSocket#send]', 'Socket not open');
      return;
    }

    this.ws.send(data);
  }

  close(code?: number, reason?: string): void {
    this.ws.close(code, reason);
  }
}
