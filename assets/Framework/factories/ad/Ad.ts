import { UITransform } from 'cc';

export class AdError extends Error {
  constructor(
    public readonly code: number,
    message: string,
  ) {
    super(message);
  }
}

export interface RewardedAdOptions {
  adUnitId?: string;
}

export interface BannerAdOptions {
  adUnitId?: string;
  uiTransform: UITransform;
}

export interface CustomAdOptions {
  adUnitId?: string;
  uiTransform: UITransform;
}

export abstract class Ad {
  /**
   * 激励视频广告
   * @param options
   */
  abstract showRewardedAd(options?: RewardedAdOptions): Promise<{ isEnded: boolean }>;

  /**
   * 横幅广告
   * @deprecated 过时，请改用`showCustomAd`
   * @param options
   */
  abstract showBannerAd(options?: BannerAdOptions): Promise<() => void>;

  /**
   * 自定义原生模板广告
   * @param options
   */
  abstract showCustomAd(options?: CustomAdOptions): Promise<() => void>;
}
