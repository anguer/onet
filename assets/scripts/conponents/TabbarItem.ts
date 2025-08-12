import { _decorator, CCFloat, Component, EventTouch, Node, Sprite, Tween, tween, UIOpacity, Vec3 } from 'cc';
import { AudioManager } from 'db://assets/Framework/managers/AudioManager';
import { CommonEvent } from 'db://assets/scripts/utils/CommonEvent';
import { Throttle } from 'db://assets/Framework/decorators/throttle';
import { Colors } from 'db://assets/scripts/utils/Constants';
import { EDITOR } from 'cc/env';

const { ccclass, property, executeInEditMode } = _decorator;

@ccclass('TabbarItem')
@executeInEditMode()
export class TabbarItem extends Component {
  public static readonly EventType = {
    SELECT: 'TabbarItem_CLICK',
  };

  @property(UIOpacity) private text: UIOpacity;
  @property(Sprite) private icon: Sprite;
  @property(Node) private content: Node;
  @property(Vec3) private defaultPosition: Vec3 = new Vec3(0, -16, 0);
  @property(Vec3) private activeScale: Vec3 = new Vec3(1.1, 1.1, 1);

  @property private _active: boolean = false;
  @property
  public get active() {
    return this._active;
  }
  public set active(value: boolean) {
    if (this._active === value) return;
    this._active = value;
    this._updateUI();
  }

  @property(CCFloat) private _duration: number = 0.18;
  @property(CCFloat)
  private get duration() {
    return this._duration;
  }

  protected onLoad() {
    this._updateUI();
  }

  protected onEnable() {
    this._updateUI();
    this.node.on(Node.EventType.TOUCH_END, this._onTouchEnd, this);
  }

  protected onDisable() {
    this.node.off(Node.EventType.TOUCH_END, this._onTouchEnd, this);
  }

  @Throttle()
  private _onTouchEnd(event: EventTouch) {
    event.propagationStopped = true;
    if (this.active) return;
    AudioManager.instance.playEffect('common/audio/click1');
    this.node.dispatchEvent(new CommonEvent(TabbarItem.EventType.SELECT, true, this));
  }

  private _updateUI() {
    if (EDITOR) {
      this.content.setPosition(this.active ? Vec3.ZERO : this.defaultPosition);
      this.content.setScale(this.active ? this.activeScale : Vec3.ONE);
      this.text.opacity = this.active ? 255 : 0;
      this.icon.color = this.active ? Colors.white : Colors.black25;
      return;
    }

    Tween.stopAllByTarget(this.icon);
    Tween.stopAllByTarget(this.text);
    Tween.stopAllByTarget(this.content);

    if (this.active) {
      tween(this.content)
        .parallel(
          tween(this.content).to(this.duration, { position: Vec3.ZERO, scale: this.activeScale }),
          tween(this.text).to(this.duration, { opacity: 255 }),
          tween(this.icon).to(this.duration, { color: Colors.white }),
        )
        .start();
    } else {
      tween(this.content)
        .parallel(
          tween(this.content).to(this.duration, { position: this.defaultPosition, scale: Vec3.ONE }),
          tween(this.text).to(this.duration, { opacity: 0 }),
          tween(this.icon).to(this.duration, { color: Colors.black25 }),
        )
        .start();
    }
  }
}
