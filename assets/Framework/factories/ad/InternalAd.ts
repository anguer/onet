import { Ad, BannerAdOptions, CustomAdOptions, RewardedAdOptions } from 'db://assets/Framework/factories/ad/Ad';

export class InternalAd extends Ad {
  showRewardedAd(options?: RewardedAdOptions): Promise<{ isEnded: boolean }> {
    return Promise.resolve({ isEnded: true });
  }

  showBannerAd(options?: BannerAdOptions): Promise<() => void> {
    return Promise.resolve(() => {});
  }

  showCustomAd(options?: CustomAdOptions): Promise<() => void> {
    return Promise.resolve(() => {});
  }
}
