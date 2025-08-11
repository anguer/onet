import { Rect, sys, UITransform } from 'cc';

export class SocialError extends Error {
  constructor(
    public readonly code: number,
    message: string,
  ) {
    super(message);
  }
}

export enum Provider {
  INTERNAL = 'INTERNAL',
  WECHAT_GAME = 'WECHAT_GAME',
  BYTEDANCE_MINI_GAME = 'BYTEDANCE_MINI_GAME',
  TAPTAP_MINI_GAME = 'TAPTAP_MINI_GAME',
}

export interface SocialUserInfo {
  nick: string;
  avatar: string;
}

export interface UserInfoButton {
  show: () => void;
  hide: () => void;
}

export interface GameClubButton {
  show: () => void;
  hide: () => void;
}

export interface GameClubData {
  signature: string;
  encryptedData: string;
  iv: string;
}

export interface Callback {
  (args: any): void;
}

export abstract class Social {
  private readonly LS_VIBRATE_KEY = '__SOCIAL_VIBRATE__';

  private _vibrateOn: boolean = true;

  public set vibrateOn(isOn: boolean) {
    this._vibrateOn = isOn;
    sys.localStorage.setItem(this.LS_VIBRATE_KEY, isOn ? 'on' : 'off');
  }

  public get vibrateOn() {
    const vibrateFlag = sys.localStorage.getItem(this.LS_VIBRATE_KEY);
    if (!vibrateFlag) {
      this._vibrateOn = true;
    } else {
      this._vibrateOn = vibrateFlag === 'on';
    }
    return this._vibrateOn;
  }

  /**
   * 在各平台环境下调用 SDK，只返回 code 和平台标识，
   * 不做任何网络请求
   */
  abstract login(): Promise<{ code: string; provider: Provider }>;

  abstract checkSession(): Promise<boolean>;

  /**
   * 是否授权用户信息
   */
  abstract isUserInfoAuthorized(): Promise<boolean>;

  /**
   * 渲染并显示“获取用户信息授权”按钮
   */
  abstract renderUserInfoAuthButton(uiTransform: UITransform, callback: (userInfo: SocialUserInfo | null) => void): UserInfoButton;

  /**
   * 获取用户信息（前提：用户已授权）
   */
  abstract getUserInfo(): Promise<SocialUserInfo>;

  abstract isGameClubAuthorized(): Promise<boolean>;
  abstract requestGameClubAuthorize(): Promise<void>;

  /**
   * 获取游戏圈数据
   */
  abstract getGameClubData(): Promise<GameClubData | null>;

  /**
   * 渲染并显示“进入游戏圈”按钮
   * @param uiTransform
   * @param onTap
   * @param onBack
   */
  abstract renderGameClubButton(uiTransform: UITransform, onTap: () => void, onBack: () => void): GameClubButton;

  /**
   * 提交或更新排行榜数据
   * @param record
   */
  abstract updateLeaderboard(record: Record<string, number>): Promise<void>;

  /**
   * 获取某个节点的包围盒信息，由其左上角的 x、y 坐标以及宽度和高度组成
   * @param uiTransform
   */
  abstract getBoundingBoxWithTransform(uiTransform: UITransform): Rect;

  /**
   * 较短时间的振动
   * @param type
   */
  abstract vibrateShort(type: 'heavy' | 'medium' | 'light'): void;

  /**
   * 较长时间的振动
   */
  abstract vibrateLong(): void;

  /**
   * 设置状态栏颜色
   * @param style
   */
  abstract setStatusBarStyle(style: 'black' | 'white'): void;

  abstract shareAppMessage(title?: string, imageUrl?: string, query?: string): void;

  /**
   * 打开客户会话
   */
  abstract openCustomerServiceConversation(): Promise<void>;

  /**
   * 打开隐私政策
   */
  abstract openPrivacyContract(): Promise<void>;

  /**
   * 游戏推荐相关
   */
  abstract loadRecommend(): Promise<void>;
  abstract showRecommend(): Promise<void>;
  abstract unloadRecommend(): void;

  /**
   * 监听内存报警
   */
  abstract onMemoryWarning(callback: () => void): void;
  abstract offMemoryWarning(callback: () => void): void;

  /**
   * 释放内存
   */
  abstract triggerGC(): void;

  /**
   * 监听小程序显示隐藏
   * @param callback
   */
  abstract onAppShow(callback: Callback): void;
  abstract offAppShow(callback: Callback): void;
  abstract onAppHide(callback: Callback): void;
  abstract offAppHide(callback: Callback): void;
}
