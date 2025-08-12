import { Rect, UITransform, view } from 'cc';
import { AdError, Ad, RewardedAdOptions, BannerAdOptions, CustomAdOptions } from 'db://assets/Framework/factories/ad/Ad';
import { LogManager } from 'db://assets/Framework/managers/LogManager';

export class WeChatAd extends Ad {
  // 全局广告对象缓存
  private readonly _rewardedAds: Map<string, WechatMinigame.RewardedVideoAd> = new Map();

  showRewardedAd(options?: RewardedAdOptions): Promise<{ isEnded: boolean }> {
    const { adUnitId = 'adunit-0097d391683d7d0c' } = Object.assign({}, options);
    return new Promise<{ isEnded: boolean }>(async (resolve) => {
      try {
        LogManager.trace('[WeChatAd#showRewardedAd]', adUnitId);
        const ad = await this._createRewardedAd(adUnitId);

        const onClose = (res: WechatMinigame.RewardedVideoAdOnCloseListenerResult) => {
          LogManager.trace('[WeChatAd#showRewardedAd]', { isEnded: res.isEnded });
          ad.offClose(onClose);
          resolve({ isEnded: res.isEnded });
        };
        ad.onClose(onClose);

        await ad.show();
      } catch (e) {
        LogManager.error('[WeChatAd#showRewardedAd]', new AdError(e.errCode || -1, e.errMsg || e.message));
        resolve({ isEnded: true });
      }
    });
  }

  showBannerAd(options?: BannerAdOptions): Promise<() => void> {
    const { adUnitId = 'adunit-52492434df19737c', uiTransform } = Object.assign({}, options);
    return new Promise<() => void>(async (resolve) => {
      try {
        LogManager.trace('[WeChatAd#showBannerAd]', adUnitId);
        const ad = await this._createBannerAd(adUnitId, uiTransform);
        await ad.show();
        return resolve(() => {
          LogManager.trace('[WeChatAd#hideBannerAd]', adUnitId);
          ad.hide();
          ad.destroy();
        });
      } catch (e) {
        LogManager.error('[WeChatAd#showBannerAd]', new AdError(e.errCode || -1, e.errMsg || e.message));
        resolve(() => {});
      }
    });
  }

  showCustomAd(options?: CustomAdOptions): Promise<() => void> {
    const { adUnitId = 'adunit-52492434df19737c', uiTransform } = Object.assign({}, options);
    return new Promise<() => void>(async (resolve) => {
      try {
        LogManager.trace('[WeChatAd#showCustomAd]', adUnitId);
        const ad = await this._createCustomAd(adUnitId, uiTransform);
        await ad.show();
        return resolve(() => {
          LogManager.trace('[WeChatAd#hideCustomAd]', adUnitId);
          ad.hide();
          ad.destroy();
        });
      } catch (e) {
        LogManager.error('[WeChatAd#showCustomAd]', new AdError(e.errCode || -1, e.errMsg || e.message));
        resolve(() => {});
      }
    });
  }

  private async _createRewardedAd(adUnitId: string): Promise<WechatMinigame.RewardedVideoAd> {
    return new Promise<WechatMinigame.RewardedVideoAd>(async (resolve, reject) => {
      let ad = this._rewardedAds.get(adUnitId);
      if (ad) {
        // 已初始化，直接返回
        return resolve(ad);
      }

      // 初始化
      ad = wx.createRewardedVideoAd({
        adUnitId: adUnitId,
        multiton: false,
      })!;
      this._rewardedAds.set(adUnitId, ad);

      const onLoad = () => {
        ad?.offLoad(onLoad);
        LogManager.trace('[WeChatAd#_createRewardedAd]', '加载成功');
        resolve(ad);
      };

      const onError = (err: WechatMinigame.GridAdOnErrorListenerResult) => {
        try {
          ad?.offError(onError);
          ad?.destroy();
          this._rewardedAds.delete(adUnitId);
          LogManager.error('[WeChatAd#_createRewardedAd]', '加载失败');
          reject(new AdError(err.errCode, err.errMsg));
        } catch (e) {
          LogManager.error('[WeChatAd#_createRewardedAd]', '加载失败', e);
          reject(new AdError(-1, e.message));
        }
      };

      ad.onLoad(onLoad);
      ad.onError(onError);
      await ad.load();
    });
  }

  private async _createBannerAd(adUnitId: string, uiTransform: UITransform): Promise<WechatMinigame.BannerAd> {
    return new Promise<WechatMinigame.BannerAd>(async (resolve, reject) => {
      const rect = this._getBoundingBoxWithTransform(uiTransform);

      // 初始化
      const ad = wx.createBannerAd({
        adUnitId: adUnitId,
        // adIntervals: 120,
        style: {
          left: rect.x,
          top: rect.y,
          width: rect.width,
          height: rect.height,
        },
      });

      const timer = setTimeout(() => {
        ad.destroy();
        reject(new AdError(-1, 'Timeout'));
      }, 3000);

      const onLoad = () => {
        clearTimeout(timer);
        ad.offLoad(onLoad);

        LogManager.trace('[WeChatAd#_createBannerAd]', '加载成功');
        resolve(ad);
      };

      const onResize = () => {
        ad.offResize(onResize);

        LogManager.trace('[WeChatAd#_createBannerAd]', ad.style);
        const windowInfo = wx.getWindowInfo();
        ad.style.top = windowInfo.windowHeight - ad.style.realHeight;
      };

      const onError = (err: WechatMinigame.GridAdOnErrorListenerResult) => {
        clearTimeout(timer);
        ad.offError(onError);

        ad.destroy();
        LogManager.trace('[WeChatAd#_createBannerAd]', '加载失败');
        reject(new AdError(err.errCode, err.errMsg));
      };

      ad.onLoad(onLoad);
      ad.onResize(onResize);
      ad.onError(onError);
    });
  }

  private async _createCustomAd(adUnitId: string, uiTransform: UITransform): Promise<WechatMinigame.CustomAd> {
    return new Promise<WechatMinigame.CustomAd>(async (resolve, reject) => {
      const rect = this._getBoundingBoxWithTransform(uiTransform);

      // 初始化
      const ad = wx.createCustomAd({
        adUnitId: adUnitId,
        adIntervals: 120,
        style: {
          left: rect.x,
          top: rect.y,
          width: rect.width,
          fixed: true,
        },
      });

      const timer = setTimeout(() => {
        ad.destroy();
        reject(new AdError(-1, 'Timeout'));
      }, 2000);

      const onLoad = () => {
        clearTimeout(timer);
        ad.offLoad(onLoad);

        LogManager.trace('[WeChatAd#_createCustomAd]', '加载成功');
        resolve(ad);
      };

      const onResize = (res: WechatMinigame.OnResizeListenerResult) => {
        ad.offResize(onResize);

        LogManager.trace('[WeChatAd#_createCustomAd]', res);
        const windowInfo = wx.getWindowInfo();
        // 固定在底部
        ad.style.top = windowInfo.windowHeight - res.height;
        // ad.style.left = (windowInfo.windowWidth - res.width) / 2;
      };

      const onError = (err: WechatMinigame.GridAdOnErrorListenerResult) => {
        clearTimeout(timer);
        ad.offError(onError);

        ad.destroy();
        LogManager.trace('[WeChatAd#_createCustomAd]', '加载失败');
        reject(new AdError(err.errCode, err.errMsg));
      };

      ad.onLoad(onLoad);
      ad.onResize(onResize);
      ad.onError(onError);
    });
  }

  private _getBoundingBoxWithTransform(uiTransform: UITransform): Rect {
    const windowInfo = wx.getWindowInfo();
    const rect = uiTransform.getBoundingBoxToWorld();
    const ratio = window.devicePixelRatio;
    const scale = view.getScaleX();
    const factor = scale / ratio;
    const left = rect.x * factor;
    const top = windowInfo.windowHeight - (rect.y + rect.height) * factor;
    const width = rect.width * factor;
    const height = rect.height * factor;
    return new Rect(left, top, width, height);
  }
}
