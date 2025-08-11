import { _decorator, Component } from 'cc';
import { TabsTrigger } from 'db://assets/Nonogram/scripts/conponents/TabsTrigger';
import { CommonEvent } from 'db://assets/Nonogram/scripts/utils/CommonEvent';
import { Throttle } from 'db://assets/Framework/decorators/throttle';
import { AudioManager } from 'db://assets/Framework/managers/AudioManager';

const { ccclass, property, executeInEditMode } = _decorator;

@ccclass('Tabs')
@executeInEditMode()
export class Tabs extends Component {
  public static readonly EventType = {
    CHANGED: '__Tabs_CHANGED__',
  };

  @property private _currentIndex: number = -1;
  @property
  public get currentIndex() {
    return this._currentIndex;
  }

  public get triggers(): TabsTrigger[] {
    return this.node.getComponentsInChildren(TabsTrigger);
  }

  protected onLoad(): void {
    if (this.triggers.length > 0) {
      this._toggle(this.triggers[0]);
    }
  }

  protected onEnable(): void {
    this.node.on(TabsTrigger.EventType.TOUCH, this._onTriggerTouch, this);
  }

  protected onDisable(): void {
    this.node.off(TabsTrigger.EventType.TOUCH, this._onTriggerTouch, this);
  }

  @Throttle()
  private _onTriggerTouch(event: CommonEvent<TabsTrigger>) {
    event.propagationStopped = true;
    AudioManager.instance.playEffect('common/audio/click1');
    this._toggle(event.detail);
  }

  private _toggle(current: TabsTrigger): void {
    const currentIndex = this.triggers.indexOf(current);

    for (const trigger of this.triggers) {
      trigger.setIsActiveWithoutNotify(trigger === current);
    }

    this._currentIndex = currentIndex;
    this.node.emit(Tabs.EventType.CHANGED, this._currentIndex);
  }
}
