import { _decorator, Button, Component } from 'cc';
import { AudioManager } from 'db://assets/Framework/managers/AudioManager';
import { PopupManager } from 'db://assets/Framework/managers/PopupManager';
import { Throttle } from 'db://assets/Framework/decorators/throttle';
const { ccclass } = _decorator;

@ccclass('SettingsButton')
export class SettingsButton extends Component {
  protected onEnable() {
    this.node.on(Button.EventType.CLICK, this._onClicked, this);
  }

  protected onDisable() {
    this.node.off(Button.EventType.CLICK, this._onClicked, this);
  }

  @Throttle()
  private async _onClicked() {
    AudioManager.instance.playEffect('common/audio/click1');
    await PopupManager.instance.show('SettingsPopup', {});
  }
}
