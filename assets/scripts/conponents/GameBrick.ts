import { _decorator, Color, Component, Node, Sprite, SpriteFrame } from 'cc';
import { Throttle } from 'db://assets/Framework/decorators/throttle';

const { ccclass, property } = _decorator;

@ccclass('GameBrick')
export class GameBrick extends Component {
  @property(Sprite) private background: Sprite;
  @property(Sprite) private image: Sprite;

  @property private _isChecked: boolean = false;
  @property
  public get isChecked() {
    return this._isChecked;
  }
  public set isChecked(value: boolean) {
    this._isChecked = value;
    this._updateUI();
  }

  private _itemIdx: number = -1;
  public get itemIdx(): number {
    return this._itemIdx;
  }

  // protected onEnable() {
  //   this.node.on(Node.EventType.TOUCH_END, this._onTouchEnd, this);
  // }
  //
  // protected onDisable() {
  //   this.node.off(Node.EventType.TOUCH_END, this._onTouchEnd, this);
  // }

  public init(itemIdx: number, spriteFrame: SpriteFrame) {
    this._itemIdx = itemIdx;
    this.image.spriteFrame = spriteFrame;
    this._updateUI();
  }

  public toggle(checked: boolean) {
    this.isChecked = checked;
  }

  @Throttle()
  private _onTouchEnd() {
    this.isChecked = !this.isChecked;
  }

  private _updateUI() {
    // 橙色
    // this.background.color = this._isChecked ? new Color(255, 142, 38) : Color.WHITE;
    // 玫瑰色
    // this.background.color = this._isChecked ? new Color(253, 70, 103) : Color.WHITE;
    // 浅绿
    // this.background.color = this._isChecked ? new Color(172, 250, 240) : Color.WHITE;
    // 深绿
    // this.background.color = this._isChecked ? new Color(19, 191, 171) : Color.WHITE;
    // 深蓝
    this.background.color = this._isChecked ? new Color(100, 117, 254) : Color.WHITE;
  }
}
