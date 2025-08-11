import { OnOpenCallback, OnMessageCallback, OnCloseCallback, OnErrorCallback } from 'db://assets/Framework/factories/socket/Socket';

export interface ITransportEventMap {
  onopen?: OnOpenCallback | null;
  onmessage?: OnMessageCallback | null;
  onclose?: OnCloseCallback | null;
  onerror?: OnErrorCallback | null;
}

export abstract class ITransport {
  abstract isOpen: boolean;

  protected constructor(public events: ITransportEventMap) {}

  abstract send(data: Buffer | Uint8Array): void;
  abstract connect(url: string, options: any): void;
  abstract close(code?: number, reason?: string): void;
}
