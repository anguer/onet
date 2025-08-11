import { ITransport, ITransportEventMap } from './ITransport';
import { Socket } from 'db://assets/Framework/factories/socket/Socket';
import { SocketProviderFactory } from 'db://assets/Framework/factories/socket/SocketProviderFactory';

export class WebSocketTransport extends ITransport {
  ws: Socket;
  protocols?: string | string[];

  constructor(events: ITransportEventMap) {
    super(events);
  }

  public send(data: Buffer | Uint8Array): void {
    this.ws.send(data);
  }

  /**
   * @param url URL to connect to
   * @param headers custom headers to send with the connection (only supported in WeChat. Web Browsers do not allow setting custom headers)
   */
  public connect(url: string, headers?: any): void {
    this.ws = SocketProviderFactory.create(url, this.protocols);

    this.ws.onopen = this.events.onopen ?? null;
    this.ws.onmessage = this.events.onmessage ?? null;
    this.ws.onclose = this.events.onclose ?? null;
    this.ws.onerror = this.events.onerror ?? null;
  }

  public close(code?: number, reason?: string) {
    this.ws.close(code, reason);
  }

  get isOpen() {
    return this.ws.readyState === WebSocket.OPEN;
  }
}
