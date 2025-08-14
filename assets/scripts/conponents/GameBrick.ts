import { _decorator, Color, Component, Sprite, SpriteFrame } from 'cc';

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

  public updateUI(spriteFrame: SpriteFrame) {
    this.image.spriteFrame = spriteFrame;
    this._updateUI();
  }

  public toggle(checked: boolean) {
    this.isChecked = checked;
  }

  public highlight(highlight: boolean) {
    this.background.color = highlight ? new Color(253, 70, 103) : Color.WHITE;
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
