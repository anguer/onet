import { sys } from 'cc';
import { Http, HttpOptions } from 'db://assets/Framework/factories/http/Http';
import { WeChatHttp } from 'db://assets/Framework/factories/http/WeChatHttp';
import { ByteDanceHttp } from 'db://assets/Framework/factories/http/ByteDanceHttp';
import { InternalHttp } from 'db://assets/Framework/factories/http/InternalHttp';

export class HttpProviderFactory {
  private static readonly _platform = sys.platform;

  static create(options?: HttpOptions): Http {
    switch (this._platform) {
      case sys.Platform.WECHAT_GAME:
        return new WeChatHttp(options);
      case sys.Platform.BYTEDANCE_MINI_GAME:
        return new ByteDanceHttp(options);
      case sys.Platform.DESKTOP_BROWSER:
      default:
        return new InternalHttp(options);
    }
  }
}
