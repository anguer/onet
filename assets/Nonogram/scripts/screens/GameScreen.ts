import { _decorator, Node, UIOpacity } from 'cc';
import { LogManager } from 'db://assets/Framework/managers/LogManager';
import { NonogramLevel } from 'db://assets/Nonogram/scripts/models/NonogramLevel';
import { TweenUtils } from 'db://assets/Framework/lib/TweenUtils';
import { BasePopup } from 'db://assets/Framework/components/BasePopup';

const { ccclass, property } = _decorator;

// 弹窗结果类型
export enum GameResult {
  Close = 'Close',
  Complete = 'Complete',
}

@ccclass('GameScreen')
export class GameScreen extends BasePopup<NonogramLevel, GameResult> {
  private get level(): NonogramLevel {
    return this.options;
  }

  protected onInit(level: NonogramLevel): void {
    const uiOpacity = this.node.getComponent(UIOpacity) || this.node.addComponent(UIOpacity);
    uiOpacity.opacity = 0;

    LogManager.info('[GameScreen#onInit]', level);
  }

  protected async onBeforeShow() {}

  protected async onAfterShow() {}

  protected async onBeforeHide() {}

  protected async onAfterHide() {}

  protected async playShowAnimation(): Promise<void> {
    return TweenUtils.fadeIn(this.node, 0.3);
  }

  protected async playHideAnimation(): Promise<void> {
    return TweenUtils.fadeOut(this.node, 0);
  }
}
