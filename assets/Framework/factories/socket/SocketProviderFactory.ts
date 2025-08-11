import { sys } from 'cc';
import { Socket } from 'db://assets/Framework/factories/socket/Socket';
import { WeChatSocket } from 'db://assets/Framework/factories/socket/WeChatSocket';
import { InternalSocket } from 'db://assets/Framework/factories/socket/InternalSocket';

export class SocketProviderFactory {
  private static readonly _platform = sys.platform;

  static create(url: string, protocols?: string | string[]): Socket {
    switch (this._platform) {
      case sys.Platform.WECHAT_GAME:
        return new WeChatSocket(url, protocols);
      case sys.Platform.BYTEDANCE_MINI_GAME:
      case sys.Platform.DESKTOP_BROWSER:
      default:
        return new InternalSocket(url, protocols);
    }
  }
}
