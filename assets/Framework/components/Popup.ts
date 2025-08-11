import { _decorator, Component, Node, tween, UIOpacity, v3 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('Popup')
export class Popup extends Component {
  public static readonly EventType = {
    BEFORE_SHOW: 'popup_before_show',
    SHOW: 'popup_show',
    HIDE: 'popup_hide',
  };

  // 弹窗内容节点
  @property(Node) popupNode: Node;
  // 遮罩节点
  @property(Node) maskNode: Node;
  @property showDuration: number = 0.2;
  @property hideDuration: number = 0.2;

  private _hideScale = v3(0, 0, 1);
  private _showScale = v3(1, 1, 1);
  private _isShowing: boolean = false;

  protected onLoad() {
    // 初始状态: 隐藏弹窗和遮罩
    this.popupNode.scale = this._hideScale;
    this.popupNode.active = false;

    this.maskNode.active = false;
    // 确保遮罩节点上有 UIOpacity 组件
    if (!this.maskNode.getComponent(UIOpacity)) {
      this.maskNode.addComponent(UIOpacity);
    }
    this.maskNode.getComponent(UIOpacity)!.opacity = 0;
  }

  public show(done?: () => void) {
    if (this._isShowing) {
      return;
    }

    this._isShowing = true;

    this.node.emit(Popup.EventType.BEFORE_SHOW);

    // 显示遮罩和弹窗
    this.maskNode.active = true;
    this.popupNode.active = true;

    // 遮罩淡入
    tween(this.maskNode.getComponent(UIOpacity)!).to(this.showDuration, { opacity: 255 }, { easing: 'linear' }).start();

    // 弹窗放大动画 (显示)
    tween(this.popupNode)
      .to(this.showDuration, { scale: this._showScale }, { easing: 'backOut' })
      .call(() => {
        this.node.emit(Popup.EventType.SHOW);
        done?.();
      })
      .start();
  }

  public hide(done?: () => void) {
    if (!this._isShowing) {
      return;
    }

    this._isShowing = false;

    // 弹窗缩小动画 (隐藏)
    tween(this.popupNode)
      .to(this.hideDuration, { scale: this._hideScale }, { easing: 'backIn' })
      .call(() => {
        this.popupNode.active = false;
      })
      .start();

    // 遮罩淡出并隐藏
    tween(this.maskNode.getComponent(UIOpacity)!)
      .to(this.hideDuration, { opacity: 0 }, { easing: 'linear' })
      .call(() => {
        // 动画结束后隐藏遮罩
        this.maskNode.active = false;
        this.node.emit(Popup.EventType.HIDE);
        done?.();
      })
      .start();
  }
}
