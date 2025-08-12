import { _decorator, Button, Component, Node } from 'cc';
import { Throttle } from 'db://assets/Framework/decorators/throttle';

const { ccclass, property, executeInEditMode, requireComponent } = _decorator;

@ccclass('Switcher')
@executeInEditMode()
@requireComponent([Button])
export class Switcher extends Component {
  public static readonly EventType = {
    TOGGLE: '__Switcher_TOGGLE__',
  };

  @property(Node) private off: Node | null = null;
  @property(Node) private on: Node | null = null;
  @property private _isChecked: boolean = false;
  @property
  public get isChecked() {
    return this._isChecked;
  }
  public set isChecked(value: boolean) {
    this._isChecked = value;
    this._updateState();
  }

  protected onLoad(): void {
    this._updateState();
  }

  protected onEnable(): void {
    this.node.on(Button.EventType.CLICK, this._onClicked, this);
  }

  protected onDisable(): void {
    this.node.off(Button.EventType.CLICK, this._onClicked, this);
  }

  @Throttle()
  private _onClicked() {
    this._isChecked = !this._isChecked;
    this._updateState();
    this.node.emit(Switcher.EventType.TOGGLE, this);
  }

  private _updateState() {
    if (this.off) {
      this.off.active = !this._isChecked;
    }
    if (this.on) {
      this.on.active = this._isChecked;
    }
  }

  public setIsCheckedWithoutNotify(checked: boolean): void {
    this._isChecked = checked;
    this._updateState();
  }
}
