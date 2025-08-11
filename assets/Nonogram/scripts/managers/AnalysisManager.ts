import { sys } from 'cc';
import { LogManager } from 'db://assets/Framework/managers/LogManager';
import { SDK as WeChatSdk } from '@dn-sdk/minigame';

abstract class Analysis {
  protected _playerId: string;
  protected _providerAccountId: string;
  protected _isRegistered: boolean;

  protected constructor() {}

  /**
   * 初始化SDK
   * @param playerId
   * @param providerAccountId
   * @param isRegistered
   */
  public init(playerId: string, providerAccountId: string, isRegistered: boolean) {
    if (!playerId || !providerAccountId) return;

    this._playerId = playerId;
    this._providerAccountId = providerAccountId;
    this._isRegistered = isRegistered;

    this.onInit();

    LogManager.trace('[Analysis#init]', '初始化广告分析SDK');
  }

  abstract onInit(): void;

  /**
   * 通用上报方法
   * @param type
   * @param param
   */
  abstract track(type: string, param?: Record<string, unknown>): void;

  /**
   * 完成新手指引
   */
  abstract onTutorialFinish(): void;

  /**
   * 付费
   * @param value
   */
  abstract onPurchase(value: number): void;

  /**
   * 小游戏进入前台
   */
  abstract onEnterForeground(): void;

  /**
   * 小游戏进入后台
   */
  abstract onEnterBackground(): void;

  /**
   * 小游戏启动
   */
  abstract onAppStart(): void;

  /**
   * 小游戏退出
   */
  abstract onAppQuit(): void;

  /**
   * 收藏小游戏
   */
  abstract onAddToWishlist(): void;
}

class WeChatAnalysis extends Analysis {
  private _sdk: WeChatSdk | null = null;

  constructor() {
    super();
  }

  private get enableDebug() {
    try {
      const info = wx.getAccountInfoSync();
      return info.miniProgram.envVersion == 'develop' || info.miniProgram.envVersion == 'trial';
    } catch {
      return false;
    }
  }

  onInit() {
    try {
      WeChatSdk.setDebug(this.enableDebug);

      this._sdk = new WeChatSdk({
        user_action_set_id: 1216318033,
        secret_key: '0c71eb84bb83663d5ac958118637fc6f',
        appid: 'wx1772f56f0c14c23e',
        auto_track: true,
        openid: this._providerAccountId,
        user_unique_id: this._playerId,
      });

      this._sdk.setUserUniqueId(this._playerId);
      this._sdk.setOpenId(this._providerAccountId);
      if (this._isRegistered) {
        this._sdk.onRegister();
      }
    } catch (e) {
      LogManager.error('[WeChatAnalysis#onInit]', e);
    }
  }

  track(type: string, param?: Record<string, unknown>): void {
    try {
      if (!this._sdk) return;

      this._sdk.track(type, param);
    } catch (e) {
      LogManager.error('[WeChatAnalysis#track]', e);
    }
  }

  onTutorialFinish(): void {
    try {
      if (!this._sdk) return;

      this._sdk.onTutorialFinish();
    } catch (e) {
      LogManager.error('[WeChatAnalysis#onTutorialFinish]', e);
    }
  }

  onPurchase(value: number): void {
    try {
      if (!this._sdk) return;

      this._sdk.onPurchase(value);
    } catch (e) {
      LogManager.error('[WeChatAnalysis#onPurchase]', e);
    }
  }

  onEnterForeground(): void {
    try {
      if (!this._sdk) return;

      this._sdk.onEnterForeground();
    } catch (e) {
      LogManager.error('[WeChatAnalysis#onEnterForeground]', e);
    }
  }

  onEnterBackground(): void {
    try {
      if (!this._sdk) return;

      this._sdk.onEnterBackground();
    } catch (e) {
      LogManager.error('[WeChatAnalysis#onEnterBackground]', e);
    }
  }

  onAppStart(): void {
    try {
      if (!this._sdk) return;

      this._sdk.onAppStart();
    } catch (e) {
      LogManager.error('[WeChatAnalysis#onAppStart]', e);
    }
  }

  onAppQuit(): void {
    try {
      if (!this._sdk) return;

      this._sdk.onAppQuit();
    } catch (e) {
      LogManager.error('[WeChatAnalysis#onAppQuit]', e);
    }
  }

  onAddToWishlist(): void {
    try {
      if (!this._sdk) return;

      this._sdk.onAddToWishlist();
    } catch (e) {
      LogManager.error('[WeChatAnalysis#onAddToWishlist]', e);
    }
  }
}

class InternalAnalysis extends Analysis {
  constructor() {
    super();
  }

  onInit() {}

  track(type: string, param?: Record<string, unknown>): void {}

  onAddToWishlist(): void {}

  onAppQuit(): void {}

  onAppStart(): void {}

  onEnterBackground(): void {}

  onEnterForeground(): void {}

  onPurchase(value: number): void {}

  onTutorialFinish(): void {}
}

export class AnalysisManager {
  private static readonly _platform = sys.platform;

  private static _instance: Analysis;

  public static get instance(): Analysis {
    if (!this._instance) {
      switch (this._platform) {
        case sys.Platform.WECHAT_GAME:
          this._instance = new WeChatAnalysis();
          break;
        case sys.Platform.BYTEDANCE_MINI_GAME:
        case sys.Platform.DESKTOP_BROWSER:
        default:
          this._instance = new InternalAnalysis();
          break;
      }
    }
    return this._instance;
  }
}
