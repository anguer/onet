import { UITransform } from 'cc';

export class AdError extends Error {
  constructor(
    public readonly code: number,
    message: string,
  ) {
    super(message);
  }
}

export abstract class Ad {
  abstract showRewardedAd(adUnitId: string): Promise<{ isEnded: boolean }>;
  abstract showBannerAd(adUnitId: string, uiTransform: UITransform): Promise<() => void>;
  abstract showCustomAd(adUnitId: string, uiTransform: UITransform): Promise<() => void>;
}
