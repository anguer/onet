import { Rect, UITransform, view } from 'cc';
import {
  Callback,
  GameClubButton,
  GameClubData,
  Provider,
  Social,
  SocialError,
  SocialUserInfo,
  UserInfoButton,
} from 'db://assets/Framework/factories/social/Social';

export class ByteDanceSocial extends Social {
  async login(): Promise<{ code: string; provider: Provider }> {
    return new Promise((resolve, reject) => {
      tt.login({
        success: (res) => {
          if (!res.code) {
            return reject(new SocialError(-1, 'tt.login 未返回 code'));
          }

          resolve({ code: res.code, provider: Provider.BYTEDANCE_MINI_GAME });
        },
        fail: reject,
      });
    });
  }

  checkSession(): Promise<boolean> {
    return new Promise((resolve) => {
      tt.checkSession({
        success: () => resolve(true),
        fail: () => resolve(false),
      });
    });
  }

  isUserInfoAuthorized(): Promise<boolean> {
    return Promise.resolve(false);
  }

  renderUserInfoAuthButton(uiTransform: UITransform, callback: (userInfo: SocialUserInfo | null) => void): UserInfoButton {
    return { show: () => {}, hide: () => {} };
  }

  getUserInfo(): Promise<SocialUserInfo> {
    return Promise.resolve({ nick: '抖音用户', avatar: '' });
  }

  /**
   * 抖音暂不支持游戏圈
   */
  async isGameClubAuthorized(): Promise<boolean> {
    return false;
  }

  /**
   * 抖音暂不支持游戏圈
   */
  async requestGameClubAuthorize(): Promise<void> {}

  /**
   * 抖音暂不支持游戏圈
   */
  async getGameClubData(): Promise<GameClubData | null> {
    return null;
  }
  /**
   * 抖音暂不支持游戏圈
   */
  renderGameClubButton(uiTransform: UITransform, onTap: () => void, onBack: () => void): GameClubButton {
    return { show: () => {}, hide: () => {} };
  }

  updateLeaderboard(record: Record<string, number>): Promise<void> {
    return Promise.resolve(undefined);
  }

  getBoundingBoxWithTransform(uiTransform: UITransform): Rect {
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

  vibrateLong(): void {
    try {
      tt.vibrateLong({});
    } catch {}
  }

  vibrateShort(type: 'heavy' | 'medium' | 'light'): void {
    try {
      // 抖音短频震动不友好，暂时不开启
      // tt.vibrateShort({});
    } catch {}
  }

  setStatusBarStyle(style: 'black' | 'white') {
    try {
      // 抖音没有单独设置状态栏的接口
      // tt.setNavigationBarColor({});
    } catch {}
  }

  shareAppMessage(title?: string, imageUrl?: string, query?: string): void {}

  async openCustomerServiceConversation(): Promise<void> {}

  async openPrivacyContract(): Promise<void> {
    try {
      (tt as any).openPrivacyContract({});
    } catch {}
  }

  /**
   * 抖音暂不支持推荐
   */
  async showRecommend(): Promise<void> {}
  async loadRecommend(): Promise<void> {}
  unloadRecommend(): void {}

  onMemoryWarning(callback: () => void): void {}

  offMemoryWarning(callback: () => void): void {}

  triggerGC(): void {
    try {
      (tt as any).triggerGC({});
    } catch {}
  }

  onAppShow(callback: Callback): void {
    try {
      (tt as any).onShow(callback);
    } catch {}
  }

  offAppShow(callback: Callback): void {
    try {
      (tt as any).offShow(callback);
    } catch {}
  }

  onAppHide(callback: Callback): void {
    try {
      (tt as any).onHide(callback);
    } catch {}
  }

  offAppHide(callback: Callback): void {
    try {
      (tt as any).offHide(callback);
    } catch {}
  }
}
