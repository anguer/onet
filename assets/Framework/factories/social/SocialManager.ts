import { sys } from 'cc';
import { Social } from 'db://assets/Framework/factories/social/Social';
import { WeChatSocial } from 'db://assets/Framework/factories/social/WeChatSocial';
import { ByteDanceSocial } from 'db://assets/Framework/factories/social/ByteDanceSocial';
import { InternalSocial } from 'db://assets/Framework/factories/social/InternalSocial';

export class SocialManager {
  private static readonly _platform = sys.platform;

  public static get isWechat(): boolean {
    return this._platform === sys.Platform.WECHAT_GAME;
  }

  public static get isBytedance(): boolean {
    return this._platform === sys.Platform.BYTEDANCE_MINI_GAME;
  }

  private static _instance: Social;

  public static get instance(): Social {
    if (!this._instance) {
      switch (this._platform) {
        case sys.Platform.WECHAT_GAME:
          this._instance = new WeChatSocial();
          break;
        case sys.Platform.BYTEDANCE_MINI_GAME:
          this._instance = new ByteDanceSocial();
          break;
        case sys.Platform.DESKTOP_BROWSER:
        default:
          this._instance = new InternalSocial();
          break;
      }
    }
    return this._instance;
  }
}
