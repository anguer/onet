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

enum GameClubDataType {
  JoinTime = 1, // 加入该游戏圈时间，秒级Unix时间戳
  UserMuteStatus = 3, // 用户禁言状态，0：正常 1：禁言
  PostsLikeCount = 4, // 当天(自然日)点赞贴子数
  PostsCommentCount = 5, // 当天(自然日)评论贴子数
  PostsPublishCount = 6, // 当天(自然日)发表贴子数
  VideoPostsPublishCount = 7, // 当天(自然日)发表视频贴子数
  OfficialPostsLikeCount = 8, // 当天(自然日)赞官方贴子数
  OfficialPostsCommentCount = 9, // 当天(自然日)评论官方贴子数
  TopicPostsPublishCount = 10, // 当天(自然日)发表到本圈子话题的贴子数，传入话题id
}

export class WeChatSocial extends Social {
  private _recommendPageManager: WechatMinigame.PageManager | null = null;

  async login(): Promise<{ code: string; provider: Provider }> {
    return new Promise((resolve, reject) => {
      wx.login({
        success: (res) => {
          if (!res.code) {
            return reject(new SocialError(-1, 'wx.login 未返回 code'));
          }

          resolve({ code: res.code, provider: Provider.WECHAT_GAME });
        },
        fail: reject,
      });
    });
  }

  checkSession(): Promise<boolean> {
    return new Promise((resolve) => {
      wx.checkSession({
        success: () => resolve(true),
        fail: () => resolve(false),
      });
    });
  }

  isUserInfoAuthorized(): Promise<boolean> {
    return this._checkAuth('scope.userInfo');
  }

  renderUserInfoAuthButton(uiTransform: UITransform, callback: (userInfo: SocialUserInfo | null) => void): UserInfoButton {
    const rect = this.getBoundingBoxWithTransform(uiTransform);
    const button = wx.createUserInfoButton({
      type: 'image',
      text: '',
      style: {
        left: rect.x,
        top: rect.y,
        width: rect.width,
        height: rect.height,
        // backgroundColor: 'rgba(0, 0, 0, 0.5)',
        backgroundColor: 'transparent',
        borderRadius: Math.min(rect.width, rect.height),
      },
    });

    const onTapCallback: WechatMinigame.UserInfoButtonOnTapCallback = (res) => {
      if (res.userInfo) {
        button.offTap(onTapCallback);
        button.destroy();
        callback({ nick: res.userInfo.nickName || '', avatar: res.userInfo.avatarUrl || '' });
      } else {
        // 拒绝授权
        callback(null);
      }
    };

    button.onTap(onTapCallback);
    return button;
  }

  getUserInfo(): Promise<SocialUserInfo> {
    return new Promise((resolve, reject) => {
      wx.getUserInfo({
        success: (res) => resolve({ nick: res.userInfo.nickName || '', avatar: res.userInfo.avatarUrl || '' }),
        fail: (res) => reject(new SocialError(-1, res.errMsg)),
      });
    });
  }

  async isGameClubAuthorized(): Promise<boolean> {
    return this._checkAuth('scope.gameClubData');
  }

  async requestGameClubAuthorize(): Promise<void> {
    await this._authorize('scope.gameClubData', {
      title: '温馨提示',
      content: '开启"游戏圈数据"权限后才能领取福利',
      confirmText: '去开启',
      cancelText: '放弃',
    });
  }

  async getGameClubData(): Promise<GameClubData | null> {
    return new Promise<WechatMinigame.GetGameClubDataSuccessCallbackResult>((resolve, reject) => {
      wx.getGameClubData({
        dataTypeList: [
          {
            // 加入该游戏圈时间
            type: GameClubDataType.JoinTime,
          },
          {
            // 当天(自然日)点赞贴子数
            type: GameClubDataType.PostsLikeCount,
          },
          {
            // 当天(自然日)点赞贴子数
            type: GameClubDataType.PostsCommentCount,
          },
          {
            // 当天(自然日)发表贴子数
            type: GameClubDataType.PostsPublishCount,
          },
        ],
        success: (res) => resolve(res),
        fail: (res) => reject(new Error(res.errMsg)),
      });
    });
  }

  renderGameClubButton(uiTransform: UITransform, onTap: () => void, onBack: () => void): GameClubButton {
    const rect = this.getBoundingBoxWithTransform(uiTransform);
    const button = wx.createGameClubButton({
      type: 'text',
      text: '',
      icon: 'green',
      style: {
        left: rect.x,
        top: rect.y,
        width: rect.width,
        height: rect.height,
        backgroundColor: 'transparent',
        borderRadius: 0,
      },
      // openlink: 'Lv-XO1OgAuqztP4pRyKfZnY2aJKe9aE1'
    });

    const onShow = () => {
      onBack();
      wx.offShow(onShow);
    };

    const onTapCallback: WechatMinigame.GameClubButtonOnTapCallback = () => {
      onTap();
      wx.onShow(onShow);
    };

    button.onTap(onTapCallback);
    return button;
  }

  updateLeaderboard(record: Record<string, number>): Promise<void> {
    const time = Date.now();
    const data = Object.keys(record).map((key) => {
      return {
        key,
        value: JSON.stringify({
          wxgame: {
            score: record[key],
            update_time: time,
          },
        }),
      };
    });
    return this._setUserCloudStorage(data);
  }

  getBoundingBoxWithTransform(uiTransform: UITransform): Rect {
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

  vibrateLong(): void {
    if (!this.vibrateOn) {
      return;
    }

    wx.vibrateLong({
      success: () => {},
      fail: () => {},
    });
  }

  vibrateShort(type: 'heavy' | 'medium' | 'light'): void {
    if (!this.vibrateOn) {
      return;
    }

    wx.vibrateShort({
      type: type,
      success: () => {},
      fail: () => {},
    });
  }

  setStatusBarStyle(style: 'black' | 'white') {
    wx.setStatusBarStyle({ style, success: () => {} });
  }

  shareAppMessage(title?: string, imageUrl?: string, query?: string): void {
    wx.shareAppMessage({
      title: title,
      imageUrl: imageUrl,
      query: query,
    });
  }

  /**
   * 存储用户数据
   * @param data
   * @private
   */
  private _setUserCloudStorage(data: { key: string; value: string }[]): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      wx.setUserCloudStorage({
        KVDataList: data,
        complete: () => {
          resolve();
        },
        fail: (res) => {
          reject(new SocialError(-1, res.errMsg));
        },
      });
    });
  }

  /**
   * 检查是否授权
   * @param scope
   * @private
   */
  private _checkAuth(scope: keyof WechatMinigame.AuthSetting | `scope.${string}`) {
    return new Promise<boolean>((resolve) => {
      wx.getSetting({
        success: (res) => {
          resolve(res.authSetting[scope] === true);
        },
        fail: () => {
          resolve(false);
        },
      });
    });
  }

  /**
   * 授权
   * @param scope
   * @param option
   * @private
   */
  private async _authorize(scope: keyof WechatMinigame.AuthSetting | `scope.${string}`, option: Parameters<typeof this._showModal>[0]) {
    return new Promise<void>(async (resolve, reject) => {
      // // 如果已经授权，直接返回
      // const isAuth = await this._checkAuth(scope);
      // if (isAuth) {
      //   return resolve();
      // }

      wx.authorize({
        scope,
        success: () => resolve(),
        fail: async () => {
          // 如果用户未同意隐私政策，返回失败
          const isPrivacyAuthorized = await this._checkPrivacyAuthorized();
          if (!isPrivacyAuthorized) {
            return reject(new Error('用户未同意隐私政策'));
          }

          const result = await this._showModal(option);
          if (result.confirm) {
            const isAuthRetry = await this._openAuth(scope);
            if (isAuthRetry) {
              return resolve();
            } else {
              return reject(new Error(`用户放弃「${scope}」授权`));
            }
          } else {
            return reject(new Error(`用户取消「${scope}」授权`));
          }
        },
      });
    });
  }

  /**
   * 检查是否同意隐私政策
   * @private
   */
  private _checkPrivacyAuthorized() {
    return new Promise<boolean>((resolve) => {
      wx.getPrivacySetting({
        success: (res) => {
          resolve(!res.needAuthorization);
        },
        fail: () => {
          resolve(false);
        },
      });
    });
  }

  /**
   * 主动调起授权
   * @param scope
   * @private
   */
  private _openAuth(scope: keyof WechatMinigame.AuthSetting | `scope.${string}`) {
    return new Promise<boolean>((resolve) => {
      wx.openSetting({
        success: (data) => {
          resolve(data.authSetting[scope] === true);
        },
        fail: () => {
          resolve(false);
        },
      });
    });
  }

  /**
   * 显示系统弹窗
   * @param option
   * @private
   */
  private _showModal(option: Omit<WechatMinigame.ShowModalOption, 'success' | 'fail' | 'complete'>) {
    const { title = '温馨提示', content, confirmText = '去授权', cancelText = '拒绝', ...args } = option;
    return new Promise<WechatMinigame.ShowModalSuccessCallbackResult>((resolve) => {
      wx.showModal({
        title,
        content,
        confirmText,
        cancelText,
        ...args,
        success: (res) => resolve(res),
        fail: (res) => {
          resolve({ confirm: false, cancel: true, content: '', errMsg: res.errMsg });
        },
      });
    });
  }

  async openCustomerServiceConversation(): Promise<void> {
    await wx.openCustomerServiceConversation({});
  }

  async openPrivacyContract(): Promise<void> {
    wx.openPrivacyContract({});
  }

  async showRecommend(): Promise<void> {
    this.unloadRecommend();

    if (!this._recommendPageManager) {
      await this.loadRecommend();
    }

    if (!this._recommendPageManager) {
      return;
    }

    await this._recommendPageManager.show({
      openlink: 'TWFRCqV5WeM2AkMXhKwJ03MhfPOieJfAsvXKUbWvQFQtLyyA5etMPabBehga950uzfZcH3Vi3QeEh41xRGEVFw',
    });
  }

  async loadRecommend() {
    if (!wx.createPageManager) {
      // 当前基础库版本暂不支持
      return;
    }

    this._recommendPageManager = wx.createPageManager();
    await this._recommendPageManager.load({
      openlink: 'TWFRCqV5WeM2AkMXhKwJ03MhfPOieJfAsvXKUbWvQFQtLyyA5etMPabBehga950uzfZcH3Vi3QeEh41xRGEVFw',
    });
  }

  unloadRecommend() {
    if (this._recommendPageManager) {
      this._recommendPageManager.destroy();
      this._recommendPageManager = null;
    }
  }

  onMemoryWarning(callback: () => void): void {
    wx.onMemoryWarning(callback);
  }

  offMemoryWarning(callback: () => void): void {
    wx.offMemoryWarning(callback);
  }

  triggerGC(): void {
    wx.triggerGC();
  }

  onAppShow(callback: Callback): void {
    try {
      wx.onShow(callback);
    } catch {}
  }

  offAppShow(callback: Callback): void {
    try {
      wx.offShow(callback);
    } catch {}
  }

  onAppHide(callback: Callback): void {
    try {
      wx.onHide(callback);
    } catch {}
  }

  offAppHide(callback: Callback): void {
    try {
      wx.offHide(callback);
    } catch {}
  }
}
