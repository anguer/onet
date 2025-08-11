import { _decorator, Component, EventTouch, Node } from 'cc';
import { CommonEvent } from 'db://assets/Nonogram/scripts/utils/CommonEvent';
import { Throttle } from 'db://assets/Framework/decorators/throttle';

const { ccclass, property, executeInEditMode } = _decorator;

@ccclass('TabsTrigger')
@executeInEditMode()
export class TabsTrigger extends Component {
  public static readonly EventType = {
    TOUCH: '__TabsTrigger_TOUCH__',
  };

  @property(Node) private off: Node | null = null;
  @property(Node) private on: Node | null = null;
  @property private _isChecked: boolean = false;
  @property
  public get isChecked() {
    return this._isChecked;
  }

  protected onLoad(): void {
    this._updateUI();
  }

  protected onEnable(): void {
    this.node.on(Node.EventType.TOUCH_START, this._onTouch, this);
  }

  protected onDisable(): void {
    this.node.off(Node.EventType.TOUCH_START, this._onTouch, this);
  }

  @Throttle()
  private _onTouch(event: EventTouch): void {
    event.propagationStopped = true;
    if (this._isChecked) return;

    this.node.dispatchEvent(new CommonEvent<TabsTrigger>(TabsTrigger.EventType.TOUCH, true, this));
  }

  public setIsActiveWithoutNotify(boolean: boolean): void {
    this._isChecked = boolean;
    this._updateUI();
  }

  private _updateUI() {
    if (this.off) {
      this.off.active = !this._isChecked;
    }
    if (this.on) {
      this.on.active = this._isChecked;
    }
  }
}
