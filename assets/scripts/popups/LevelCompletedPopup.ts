import { _decorator, Button, Label, Node, UIOpacity } from 'cc';
import { AudioManager } from 'db://assets/Framework/managers/AudioManager';
import { BasePopup } from 'db://assets/Framework/components/BasePopup';
import { Throttle } from 'db://assets/Framework/decorators/throttle';
import { TweenUtils } from 'db://assets/Framework/lib/TweenUtils';
const { ccclass, property } = _decorator;

export interface LevelCompletedOptions {
  clearTime: number;
}

export enum LevelCompletedResult {
  Home = 'Home',
  Next = 'Next',
}

@ccclass('LevelCompletedPopup')
export class LevelCompletedPopup extends BasePopup<LevelCompletedOptions, LevelCompletedResult> {
  @property(Label) private clearTime: Label;
  @property(Button) private homeButton: Button;
  @property(Button) private nextButton: Button;

  protected onInit(): void {
    const uiOpacity = this.node.getComponent(UIOpacity) || this.node.addComponent(UIOpacity);
    uiOpacity.opacity = 0;

    this.clearTime.string = `通关用时: 5分20秒`;
  }

  protected async playShowAnimation(): Promise<void> {
    return TweenUtils.fadeIn(this.node, 0.3);
  }

  protected async playHideAnimation(): Promise<void> {
    return TweenUtils.fadeOut(this.node, 0);
  }

  protected onEnable() {
    // 按钮
    this.nextButton.node.on(Button.EventType.CLICK, this._onNext, this);
    this.homeButton.node.on(Button.EventType.CLICK, this._onHome, this);
  }

  protected onDisable() {
    // 按钮
    this.nextButton.node.off(Button.EventType.CLICK, this._onNext, this);
    this.homeButton.node.off(Button.EventType.CLICK, this._onHome, this);
  }

  @Throttle()
  private async _onHome() {
    AudioManager.instance.playEffect('common/audio/click1');
    await this.success(LevelCompletedResult.Home);
  }

  @Throttle()
  private async _onNext() {
    AudioManager.instance.playEffect('common/audio/click1');
    await this.success(LevelCompletedResult.Next);
  }
}
