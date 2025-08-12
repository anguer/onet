import { Rect, UITransform, view } from 'cc';
import { Ad, AdError, BannerAdOptions, CustomAdOptions, RewardedAdOptions } from 'db://assets/Framework/factories/ad/Ad';
import { LogManager } from 'db://assets/Framework/managers/LogManager';

export class ByteDanceAd extends Ad {
  // 全局广告对象缓存
  private readonly _rewardedAds: Map<string, any> = new Map();

  showRewardedAd(options?: RewardedAdOptions): Promise<{ isEnded: boolean }> {
    const { adUnitId = '3ehjd1n78191fnh9mf' } = Object.assign({}, options);
    return new Promise<{ isEnded: boolean }>(async (resolve) => {
      try {
        LogManager.trace('[ByteDanceAd#showRewardedAd]', adUnitId);
        const ad = await this._createRewardedAd(adUnitId);

        const onClose = (res: WechatMinigame.RewardedVideoAdOnCloseListenerResult) => {
          LogManager.trace('[ByteDanceAd#showRewardedAd]', { isEnded: res.isEnded });
          ad.offClose(onClose);
          resolve({ isEnded: res.isEnded });
        };
        ad.onClose(onClose);

        await ad.show();
      } catch (e) {
        LogManager.error('[ByteDanceAd#showRewardedAd]', new AdError(e.errCode || -1, e.errMsg || e.message));
        resolve({ isEnded: true });
      }
    });
  }

  showBannerAd(options?: BannerAdOptions): Promise<() => void> {
    const { adUnitId = 'kk9hbi94f876pji8qk', uiTransform } = Object.assign({}, options);
    return new Promise<() => void>(async (resolve) => {
      try {
        LogManager.trace('[ByteDanceAd#showBannerAd]', adUnitId);
        const ad = await this._createBannerAd(adUnitId, uiTransform);
        await ad.show();
        return resolve(() => {
          LogManager.trace('[ByteDanceAd#hideBannerAd]', adUnitId);
          ad.hide();
          ad.destroy();
        });
      } catch (e) {
        LogManager.error('[ByteDanceAd#showBannerAd]', new AdError(e.errCode || -1, e.errMsg || e.message));
        resolve(() => {});
      }
    });
  }

  showCustomAd(options?: CustomAdOptions): Promise<() => void> {
    const { adUnitId = 'kk9hbi94f876pji8qk', uiTransform } = Object.assign({}, options);
    return new Promise<() => void>(async (resolve) => {
      try {
        LogManager.trace('[ByteDanceAd#showCustomAd]', adUnitId);
        const ad = await this._createBannerAd(adUnitId, uiTransform);
        await ad.show();
        return resolve(() => {
          LogManager.trace('[ByteDanceAd#hideCustomAd]', adUnitId);
          ad.hide();
          ad.destroy();
        });
      } catch (e) {
        LogManager.error('[ByteDanceAd#showCustomAd]', new AdError(e.errCode || -1, e.errMsg || e.message));
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
      ad = (tt as any).createRewardedVideoAd({
        adUnitId: adUnitId,
        multiton: false,
      })!;
      this._rewardedAds.set(adUnitId, ad);

      const onLoad = () => {
        ad.offLoad(onLoad);
        LogManager.trace('[ByteDanceAd#_createRewardedAd]', '加载成功');
        resolve(ad);
      };

      const onError = (err: WechatMinigame.GridAdOnErrorListenerResult) => {
        ad.offError(onError);

        ad.destroy();
        this._rewardedAds.delete(adUnitId);
        LogManager.trace('[ByteDanceAd#_createRewardedAd]', '加载失败');
        reject(new AdError(err.errCode, err.errMsg));
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
      const ad = (tt as any).createBannerAd({
        adUnitId: adUnitId,
        adIntervals: 120,
        style: {
          left: rect.x,
          top: rect.y,
          width: rect.width,
        },
      });

      const timer = setTimeout(() => {
        ad.destroy();
        reject(new AdError(-1, 'Timeout'));
      }, 3000);

      const onLoad = () => {
        clearTimeout(timer);
        ad.offLoad(onLoad);

        LogManager.trace('[ByteDanceAd#_createBannerAd]', '加载成功');
        resolve(ad);
      };

      const onResize = (size: any) => {
        ad.offResize(onResize);

        LogManager.trace('[ByteDanceAd#_createBannerAd]', size);
        const windowInfo = tt.getSystemInfoSync();
        ad.style.top = windowInfo.windowHeight - size.height;
        ad.style.left = (windowInfo.windowWidth - size.width) / 2;
      };

      const onError = (err: WechatMinigame.GridAdOnErrorListenerResult) => {
        clearTimeout(timer);
        ad.offError(onError);

        ad.destroy();
        LogManager.trace('[ByteDanceAd#_createBannerAd]', '加载失败');
        reject(new AdError(err.errCode, err.errMsg));
      };

      ad.onLoad(onLoad);
      ad.onResize(onResize);
      ad.onError(onError);
    });
  }

  private _getBoundingBoxWithTransform(uiTransform: UITransform): Rect {
    const windowInfo = tt.getSystemInfoSync();
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
