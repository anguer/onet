import { Rect, UITransform, view } from 'cc';
import { Callback, GameClubButton, GameClubData, Provider, Social, SocialUserInfo, UserInfoButton } from 'db://assets/Framework/factories/social/Social';

export class InternalSocial extends Social {
  async login(): Promise<{ code: string; provider: Provider }> {
    return new Promise((resolve) => {
      resolve({ code: 'dev', provider: Provider.INTERNAL });
    });
  }

  async checkSession(): Promise<boolean> {
    return true;
  }

  isUserInfoAuthorized(): Promise<boolean> {
    return Promise.resolve(true);
  }

  renderUserInfoAuthButton(uiTransform: UITransform, callback: (userInfo: SocialUserInfo | null) => void): UserInfoButton {
    return { show: () => {}, hide: () => {} };
  }

  getUserInfo(): Promise<SocialUserInfo> {
    return Promise.resolve({ nick: '测试用户', avatar: '' });
  }

  async isGameClubAuthorized(): Promise<boolean> {
    return false;
  }

  async requestGameClubAuthorize(): Promise<void> {}

  async getGameClubData(): Promise<GameClubData | null> {
    return null;
  }

  renderGameClubButton(uiTransform: UITransform, onTap: () => void, onBack: () => void): GameClubButton {
    return { show: () => {}, hide: () => {} };
  }

  updateLeaderboard(record: Record<string, number>): Promise<void> {
    return Promise.resolve(undefined);
  }

  getBoundingBoxWithTransform(uiTransform: UITransform): Rect {
    const windowInfo = view.getVisibleSize();
    const rect = uiTransform.getBoundingBoxToWorld();
    const ratio = window.devicePixelRatio;
    const scale = view.getScaleX();
    const factor = scale / ratio;
    const left = rect.x * factor;
    const top = windowInfo.height - (rect.y + rect.height) * factor;
    const width = rect.width * factor;
    const height = rect.height * factor;
    return new Rect(left, top, width, height);
  }

  vibrateLong(): void {}

  vibrateShort(type: 'heavy' | 'medium' | 'light'): void {}

  setStatusBarStyle(style: 'black' | 'white') {}

  shareAppMessage(title?: string, imageUrl?: string, query?: string): void {}

  async openCustomerServiceConversation(): Promise<void> {}

  async openPrivacyContract(): Promise<void> {}

  async showRecommend(): Promise<void> {}
  async loadRecommend(): Promise<void> {}
  unloadRecommend(): void {}

  onMemoryWarning(callback: () => void): void {}

  offMemoryWarning(callback: () => void): void {}

  triggerGC(): void {}

  onAppShow(callback: Callback): void {}

  offAppShow(callback: Callback): void {}

  onAppHide(callback: Callback): void {}

  offAppHide(callback: Callback): void {}
}
