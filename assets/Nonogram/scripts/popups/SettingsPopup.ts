import { _decorator, Button, Node } from 'cc';
import { AudioManager } from 'db://assets/Framework/managers/AudioManager';
import { BasePopup } from 'db://assets/Framework/components/BasePopup';
import { Switcher } from 'db://assets/Nonogram/scripts/conponents/Switcher';
import { Throttle } from 'db://assets/Framework/decorators/throttle';
import { SocialManager } from 'db://assets/Framework/factories/social/SocialManager';
import { UserManager } from 'db://assets/Nonogram/scripts/managers/UserManager';
const { ccclass, property } = _decorator;

export interface SettingsOptions {}

export enum SettingsResult {
  Close = 'Close',
}

@ccclass('SettingsPopup')
export class SettingsPopup extends BasePopup<SettingsOptions, SettingsResult> {
  @property(Button) private closeButton: Button;
  @property(Switcher) private musicToggle: Switcher;
  @property(Switcher) private soundEffectToggle: Switcher;
  @property(Switcher) private vibrationToggle: Switcher;
  @property(Node) private buttons: Node;
  @property(Button) private customerServiceButton: Button;
  @property(Button) private rateUsButton: Button;
  @property(Button) private privacyContractButton: Button;
  @property(Button) private aboutUsButton: Button;

  protected onInit(): void {
    this.node.setScale(0, 0);
    this.node.setPosition(0, 0);

    if (SocialManager.isBytedance) {
      this.buttons.active = false;
    }
  }

  protected start() {
    this.musicToggle.setIsCheckedWithoutNotify(AudioManager.instance.bgmOn);
    this.soundEffectToggle.setIsCheckedWithoutNotify(AudioManager.instance.effectOn);
    this.vibrationToggle.setIsCheckedWithoutNotify(SocialManager.instance.vibrateOn);
  }

  protected onEnable() {
    // 按钮
    this.rateUsButton.node.on(Button.EventType.CLICK, this._onOpenRating, this);
    this.customerServiceButton.node.on(Button.EventType.CLICK, this._onOpenCustomerService, this);
    this.privacyContractButton.node.on(Button.EventType.CLICK, this._onOpenPrivacyContract, this);
    this.aboutUsButton.node.on(Button.EventType.CLICK, this._onOpenAboutUs, this);
    this.closeButton.node.on(Button.EventType.CLICK, this._onClose, this);
    // 开关
    this.musicToggle.node.on(Switcher.EventType.TOGGLE, this._onMusicToggle, this);
    this.soundEffectToggle.node.on(Switcher.EventType.TOGGLE, this._onSoundEffectToggle, this);
    this.vibrationToggle.node.on(Switcher.EventType.TOGGLE, this._onVibrationToggle, this);
  }

  protected onDisable() {
    // 按钮
    this.rateUsButton.node.off(Button.EventType.CLICK, this._onOpenRating, this);
    this.customerServiceButton.node.off(Button.EventType.CLICK, this._onOpenCustomerService, this);
    this.privacyContractButton.node.off(Button.EventType.CLICK, this._onOpenPrivacyContract, this);
    this.aboutUsButton.node.off(Button.EventType.CLICK, this._onOpenAboutUs, this);
    this.closeButton.node.off(Button.EventType.CLICK, this._onClose, this);
    // 开关
    this.musicToggle.node.off(Switcher.EventType.TOGGLE, this._onMusicToggle, this);
    this.soundEffectToggle.node.off(Switcher.EventType.TOGGLE, this._onSoundEffectToggle, this);
    this.vibrationToggle.node.off(Switcher.EventType.TOGGLE, this._onVibrationToggle, this);
    SocialManager.instance.unloadRecommend();
  }

  @Throttle()
  private async _onOpenRating() {
    AudioManager.instance.playEffect('nonogram/audio/click1');
    await SocialManager.instance.showRecommend();
  }

  @Throttle()
  private async _onOpenCustomerService() {
    AudioManager.instance.playEffect('nonogram/audio/click1');
    await SocialManager.instance.openCustomerServiceConversation();
  }

  @Throttle()
  private async _onOpenPrivacyContract() {
    AudioManager.instance.playEffect('nonogram/audio/click1');
    await SocialManager.instance.openPrivacyContract();
  }

  @Throttle()
  private async _onOpenAboutUs() {
    AudioManager.instance.playEffect('nonogram/audio/click1');
  }

  @Throttle()
  private async _onClose() {
    AudioManager.instance.playEffect('nonogram/audio/click1');
    await this.success(SettingsResult.Close);
  }

  private async _onMusicToggle(toggle: Switcher) {
    AudioManager.instance.playEffect('nonogram/audio/click1');
    AudioManager.instance.toggleBgm(toggle.isChecked);
  }

  private async _onSoundEffectToggle(toggle: Switcher) {
    AudioManager.instance.playEffect('nonogram/audio/click1');
    AudioManager.instance.toggleEffect(toggle.isChecked);
  }

  private async _onVibrationToggle(toggle: Switcher) {
    AudioManager.instance.playEffect('nonogram/audio/click1');
    SocialManager.instance.vibrateOn = toggle.isChecked;
  }
}
