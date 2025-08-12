import { _decorator, Component, Node, sys } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('ShareController')
export class ShareController extends Component {
  private readonly _platform = sys.platform;

  protected onEnable() {
    switch (this._platform) {
      case sys.Platform.WECHAT_GAME:
        // 显示分享按钮（shareAppMessage转发，shareTimeline朋友圈）
        wx.showShareMenu({
          withShareTicket: true,
          menus: ['shareAppMessage', 'shareTimeline'],
          complete: () => {},
        });
        // 转发
        wx.onShareAppMessage(this._onShareAppMessageForWechat.bind(this));
        // 分享朋友圈
        wx.onShareTimeline(this._onShareTimelineForWechat.bind(this));
        // 监听用户截屏
        // wx.onUserCaptureScreen(this._userCaptureScreenForWechat.bind(this));
        break;
      case sys.Platform.BYTEDANCE_MINI_GAME:
        break;
      default:
        break;
    }
  }

  protected onDisable() {
    switch (this._platform) {
      case sys.Platform.WECHAT_GAME:
        // 隐藏分享按钮（shareAppMessage转发，shareTimeline朋友圈）
        wx.hideShareMenu({
          withShareTicket: true,
          menus: ['shareAppMessage', 'shareTimeline'],
        });
        // 转发
        wx.offShareAppMessage(this._onShareAppMessageForWechat.bind(this));
        // 分享朋友圈
        wx.offShareTimeline(this._onShareTimelineForWechat.bind(this));
        // 取消监听用户截屏
        // wx.offUserCaptureScreen(this._userCaptureScreenForWechat.bind(this));
        break;
      case sys.Platform.BYTEDANCE_MINI_GAME:
        break;
      default:
        break;
    }
  }

  private _onShareAppMessageForWechat(): WechatMinigame.OnShareAppMessageListenerResult {
    return {
      imageUrl: 'https://mmocgame.qpic.cn/wechatgame/eHTyYTTCjdl63q8icbfXqKKvzR4x4m1JuQxjZDEicQnWoTia1r7dcvdRNiaU91ib4aYibp/0',
      imageUrlId: 't3qnit2zT9+jQUbLD/D6Iw==',
      title: '这也太难了吧？快来帮帮我！',
      query: '',
    };
  }

  private _onShareTimelineForWechat(): WechatMinigame.OnShareTimelineListenerResult {
    return {
      imageUrl: 'https://mmocgame.qpic.cn/wechatgame/eHTyYTTCjdl63q8icbfXqKKvzR4x4m1JuQxjZDEicQnWoTia1r7dcvdRNiaU91ib4aYibp/0',
      imageUrlId: 't3qnit2zT9+jQUbLD/D6Iw==',
      title: '这也太难了吧？快来帮帮我！',
    };
  }
}
