import { sys } from 'cc';

import { Ad } from 'db://assets/Framework/factories/ad/Ad';
import { InternalAd } from 'db://assets/Framework/factories/ad/InternalAd';
import { WeChatAd } from 'db://assets/Framework/factories/ad/WeChatAd';
import { ByteDanceAd } from 'db://assets/Framework/factories/ad/ByteDanceAd';

export class AdManager {
  private static readonly _platform = sys.platform;

  private static _instance: Ad;

  public static get instance(): Ad {
    if (!this._instance) {
      switch (this._platform) {
        case sys.Platform.WECHAT_GAME:
          this._instance = new WeChatAd();
          break;
        case sys.Platform.BYTEDANCE_MINI_GAME:
          this._instance = new ByteDanceAd();
          break;
        case sys.Platform.DESKTOP_BROWSER:
        default:
          this._instance = new InternalAd();
          break;
      }
    }
    return this._instance;
  }
}
