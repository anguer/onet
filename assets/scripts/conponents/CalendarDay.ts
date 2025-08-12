import { _decorator, Color, Component, EventTouch, Label, Node, Sprite } from 'cc';
import { AudioManager } from 'db://assets/Framework/managers/AudioManager';
import { CommonEvent } from 'db://assets/scripts/utils/CommonEvent';
import { NonogramLevel } from 'db://assets/scripts/models/NonogramLevel';
import { dayjs } from 'db://assets/scripts/utils/Dayjs';
import { LevelStatus } from 'db://assets/scripts/NonogramInterface';
import { Throttle } from 'db://assets/Framework/decorators/throttle';

const { ccclass, property } = _decorator;

@ccclass('CalendarDay')
export class CalendarDay extends Component {
  public static readonly EventType = {
    TOUCH_END: 'CalendarDay_TOUCH_END',
  };

  // ========== 未选中时颜色 ==========

  @property(Color) private _normalTextColor: Color = new Color(6, 13, 37);
  @property(Color)
  public get normalTextColor() {
    return this._normalTextColor;
  }
  public set normalTextColor(value: Color) {
    this._normalTextColor = value;
  }

  @property(Color) private _normalBgColor: Color = new Color(243, 250, 255);
  @property(Color)
  public get normalBgColor() {
    return this._normalBgColor;
  }
  public set normalBgColor(value: Color) {
    this._normalBgColor = value;
  }

  // ========== 已选中时颜色 ==========

  @property(Color) private _checkedTextColor: Color = new Color(255, 255, 255);
  @property(Color)
  public get checkedTextColor() {
    return this._checkedTextColor;
  }
  public set checkedTextColor(value: Color) {
    this._checkedTextColor = value;
  }

  @property(Color) private _checkedBgColor: Color = new Color(100, 117, 254);
  @property(Color)
  public get checkedBgColor() {
    return this._checkedBgColor;
  }
  public set checkedBgColor(value: Color) {
    this._checkedBgColor = value;
  }

  // ========== 被禁用时颜色 ==========

  @property(Color) private _disabledTextColor: Color = new Color(186, 193, 203);
  @property(Color)
  public get disabledTextColor() {
    return this._disabledTextColor;
  }
  public set disabledTextColor(value: Color) {
    this._disabledTextColor = value;
  }

  @property(Color) private _disableBgColor: Color = new Color(243, 250, 255);
  @property(Color)
  public get disableBgColor() {
    return this._disableBgColor;
  }
  public set disableBgColor(value: Color) {
    this._disableBgColor = value;
  }

  // ========== 已完成时颜色 ==========

  @property(Color) private _completedTextColor: Color = new Color(19, 191, 171);
  @property(Color)
  public get completedTextColor() {
    return this._completedTextColor;
  }
  public set completedTextColor(value: Color) {
    this._completedTextColor = value;
  }

  @property(Color) private _completedBgColor: Color = new Color(172, 250, 240);
  @property(Color)
  public get completedBgColor() {
    return this._completedBgColor;
  }
  public set completedBgColor(value: Color) {
    this._completedBgColor = value;
  }

  // ========== 其他属性 ==========

  @property(Label) private text: Label;
  @property(Sprite) private background: Sprite;
  @property(Sprite) private badgeForDone: Sprite;
  @property(Node) private badgeForAd: Node;

  private _current: NonogramLevel | null = null;

  protected onEnable() {
    this.node.on(Node.EventType.TOUCH_END, this._onTouchEnd, this);
  }

  protected onDisable() {
    this.node.off(Node.EventType.TOUCH_END, this._onTouchEnd, this);
  }

  @Throttle()
  private _onTouchEnd(event: EventTouch) {
    event.propagationStopped = true;

    if (!this._current || this._current.status !== LevelStatus.Uncompleted) return;

    AudioManager.instance.playEffect('common/audio/click1');
    this.node.dispatchEvent(new CommonEvent(CalendarDay.EventType.TOUCH_END, true, this._current));
  }

  public init(level: NonogramLevel): void {
    this._current = level;

    const date = dayjs(level.date);
    this.text.string = date.format('D');
    this.badgeForAd.active = level.status === LevelStatus.Uncompleted && date.isBefore(dayjs(), 'days');
    this._updateUI();
  }

  /**
   * 以静默形式切换Toggle组件状态
   * @param active
   */
  public setActive(active: boolean): void {
    if (!this._current) return;

    switch (this._current.status) {
      case LevelStatus.Locked:
        return;
      case LevelStatus.Completed:
        return;
      case LevelStatus.Uncompleted:
        this.text.color = active ? this.checkedTextColor : this.normalTextColor;
        this.background.color = active ? this.checkedBgColor : this.normalBgColor;
        break;
    }

    // reset ui
    // this._updateUI();
  }

  private _updateUI(): void {
    if (!this._current) return;

    switch (this._current.status) {
      case LevelStatus.Uncompleted:
        this.text.node.active = true;
        this.badgeForDone.node.active = false;
        this.text.color = this.badgeForDone.color = this.normalTextColor;
        this.background.color = this.normalBgColor;
        break;
      case LevelStatus.Locked:
        this.text.node.active = true;
        this.badgeForDone.node.active = false;
        this.text.color = this.badgeForDone.color = this.disabledTextColor;
        this.background.color = this.disableBgColor;
        break;
      case LevelStatus.Completed:
        this.text.node.active = false;
        this.badgeForDone.node.active = true;
        this.text.color = this.badgeForDone.color = this.completedTextColor;
        this.background.color = this.completedBgColor;
        break;
    }
  }
}
