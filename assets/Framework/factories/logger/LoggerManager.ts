import { sys } from 'cc';
import { Logger } from 'db://assets/Framework/factories/logger/Logger';
import { WeChatLogger } from 'db://assets/Framework/factories/logger/WeChatLogger';
import { ByteDanceLogger } from 'db://assets/Framework/factories/logger/ByteDanceLogger';
import { InternalLogger } from 'db://assets/Framework/factories/logger/InternalLogger';

export class LoggerManager {
  private static readonly _platform = sys.platform;

  private static _instance: Logger;

  public static get instance(): Logger {
    if (!this._instance) {
      switch (this._platform) {
        case sys.Platform.WECHAT_GAME:
          this._instance = new WeChatLogger();
          break;
        case sys.Platform.BYTEDANCE_MINI_GAME:
          this._instance = new ByteDanceLogger();
          break;
        case sys.Platform.DESKTOP_BROWSER:
        default:
          this._instance = new InternalLogger();
          break;
      }
    }
    return this._instance;
  }
}
