import { UITransform } from 'cc';
import { Ad } from 'db://assets/Framework/factories/ad/Ad';

export class InternalAd extends Ad {
  showRewardedAd(adUnitId: string): Promise<{ isEnded: boolean }> {
    return Promise.resolve({ isEnded: true });
  }

  showBannerAd(adUnitId: string, uiTransform: UITransform): Promise<() => void> {
    return Promise.resolve(() => {});
  }

  showCustomAd(adUnitId: string, uiTransform: UITransform): Promise<() => void> {
    return Promise.resolve(() => {});
  }
}
