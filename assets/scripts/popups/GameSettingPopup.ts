import { _decorator, Button, Node } from 'cc';
import { AudioManager } from 'db://assets/Framework/managers/AudioManager';
import { BasePopup } from 'db://assets/Framework/components/BasePopup';
import { Switcher } from 'db://assets/scripts/conponents/Switcher';
import { Throttle } from 'db://assets/Framework/decorators/throttle';
import { SocialManager } from 'db://assets/Framework/factories/social/SocialManager';
const { ccclass, property } = _decorator;

export interface GameSettingOptions {}

export enum GameSettingResult {
  Close = 'Close',
  Home = 'Home',
  Restart = 'Restart',
}

@ccclass('GameSettingPopup')
export class GameSettingPopup extends BasePopup<GameSettingOptions, GameSettingResult> {
  @property(Button) private closeButton: Button;
  @property(Switcher) private musicToggle: Switcher;
  @property(Switcher) private soundEffectToggle: Switcher;
  @property(Switcher) private vibrationToggle: Switcher;
  @property(Button) private homeButton: Button;
  @property(Button) private restartButton: Button;

  protected onInit(): void {
    this.node.setScale(0, 0);
    this.node.setPosition(0, 0);
  }

  protected start() {
    this.musicToggle.setIsCheckedWithoutNotify(AudioManager.instance.bgmOn);
    this.soundEffectToggle.setIsCheckedWithoutNotify(AudioManager.instance.effectOn);
    this.vibrationToggle.setIsCheckedWithoutNotify(SocialManager.instance.vibrateOn);
  }

  protected onEnable() {
    // 按钮
    this.closeButton.node.on(Button.EventType.CLICK, this._onClose, this);
    this.homeButton.node.on(Button.EventType.CLICK, this._onHome, this);
    this.restartButton.node.on(Button.EventType.CLICK, this._onRestart, this);
    // 开关
    this.musicToggle.node.on(Switcher.EventType.TOGGLE, this._onMusicToggle, this);
    this.soundEffectToggle.node.on(Switcher.EventType.TOGGLE, this._onSoundEffectToggle, this);
    this.vibrationToggle.node.on(Switcher.EventType.TOGGLE, this._onVibrationToggle, this);
  }

  protected onDisable() {
    // 按钮
    this.closeButton.node.off(Button.EventType.CLICK, this._onClose, this);
    this.homeButton.node.off(Button.EventType.CLICK, this._onHome, this);
    this.restartButton.node.off(Button.EventType.CLICK, this._onRestart, this);
    // 开关
    this.musicToggle.node.off(Switcher.EventType.TOGGLE, this._onMusicToggle, this);
    this.soundEffectToggle.node.off(Switcher.EventType.TOGGLE, this._onSoundEffectToggle, this);
    this.vibrationToggle.node.off(Switcher.EventType.TOGGLE, this._onVibrationToggle, this);
  }

  @Throttle()
  private async _onHome() {
    AudioManager.instance.playEffect('common/audio/click1');
    await this.success(GameSettingResult.Home);
  }

  @Throttle()
  private async _onRestart() {
    AudioManager.instance.playEffect('common/audio/click1');
    await this.success(GameSettingResult.Restart);
  }

  @Throttle()
  private async _onClose() {
    AudioManager.instance.playEffect('common/audio/click1');
    await this.success(GameSettingResult.Close);
  }

  private async _onMusicToggle(toggle: Switcher) {
    AudioManager.instance.playEffect('common/audio/click1');
    AudioManager.instance.toggleBgm(toggle.isChecked);
  }

  private async _onSoundEffectToggle(toggle: Switcher) {
    AudioManager.instance.playEffect('common/audio/click1');
    AudioManager.instance.toggleEffect(toggle.isChecked);
  }

  private async _onVibrationToggle(toggle: Switcher) {
    AudioManager.instance.playEffect('common/audio/click1');
    SocialManager.instance.vibrateOn = toggle.isChecked;
  }
}
