import { _decorator, Button, Label, Node, Prefab, UIOpacity } from 'cc';
import { LogManager } from 'db://assets/Framework/managers/LogManager';
import { NonogramLevel } from 'db://assets/Nonogram/scripts/models/NonogramLevel';
import { TweenUtils } from 'db://assets/Framework/lib/TweenUtils';
import { BasePopup } from 'db://assets/Framework/components/BasePopup';
import { Chessboard } from 'db://assets/Nonogram/scripts/utils/Chessboard';
import { Throttle } from 'db://assets/Framework/decorators/throttle';
import { AudioManager } from 'db://assets/Framework/managers/AudioManager';
import { PopupManager } from 'db://assets/Framework/managers/PopupManager';
import { GameSettingResult } from 'db://assets/Nonogram/scripts/popups/GameSettingPopup';
import { LevelCompletedResult } from 'db://assets/Nonogram/scripts/popups/LevelCompletedPopup';
import EventManager from 'db://assets/Nonogram/scripts/managers/EventManager';

const { ccclass, property } = _decorator;

// 弹窗结果类型
export enum GameResult {
  Close = 'Close',
}

const cells = [
  [0, 0, 0, 0, 0, 0, 1, 1],
  [1, 0, 0, 0, 0, 0, 1, 1],
  [1, 1, 0, 0, 0, 0, 1, 1],
  [0, 1, 1, 0, 0, 0, 1, 1],
  [1, 1, 1, 0, 0, 0, 0, 1],
  [0, 1, 1, 0, 0, 0, 0, 1],
  [1, 1, 1, 0, 0, 0, 0, 1],
  [1, 1, 1, 0, 0, 0, 0, 1],
  [0, 1, 0, 0, 0, 1, 1, 1],
  [1, 1, 1, 1, 0, 0, 1, 1],
  [0, 0, 1, 0, 0, 0, 1, 1],
  [1, 1, 1, 0, 0, 0, 0, 1],
  [1, 1, 1, 1, 1, 1, 0, 1],
  [1, 1, 1, 1, 1, 1, 1, 1],
];

@ccclass('GameScreen')
export class GameScreen extends BasePopup<NonogramLevel, GameResult> {
  @property({ type: Button }) private settingBtn: Button;
  @property({ type: Label }) private displayName: Label;
  @property({ type: Node }) private chessboardNode: Node;
  @property({ type: Prefab }) private brickPrefab: Prefab;
  @property({ type: Button, group: { id: 'items', name: '道具' } }) private itemHint: Button;
  @property({ type: Button, group: { id: 'items', name: '道具' } }) private itemRefresh: Button;
  @property({ type: Button, group: { id: 'items', name: '道具' } }) private itemBomb: Button;

  private _chessboard: Chessboard;

  private get level(): NonogramLevel {
    return this.options;
  }

  protected onInit(level: NonogramLevel): void {
    const uiOpacity = this.node.getComponent(UIOpacity) || this.node.addComponent(UIOpacity);
    uiOpacity.opacity = 0;

    this._chessboard = new Chessboard(this.chessboardNode, cells, this.brickPrefab);
    this.displayName.string = level.displayName;
    LogManager.info('[GameScreen#onInit]', level);
  }

  protected async onBeforeShow() {
    this.settingBtn.node.on(Button.EventType.CLICK, this._onSetting, this);
    this.itemHint.node.on(Button.EventType.CLICK, this._onUseHint, this);
    this.itemRefresh.node.on(Button.EventType.CLICK, this._onUseRefresh, this);
    this.itemBomb.node.on(Button.EventType.CLICK, this._onUseBomb, this);
  }

  protected async onAfterShow() {
    this.pause();
    await this._chessboard.initBricks();
    this.resume();
  }

  protected async onBeforeHide() {
    this.settingBtn.node.off(Button.EventType.CLICK, this._onSetting, this);
    this.itemHint.node.on(Button.EventType.CLICK, this._onUseHint, this);
    this.itemRefresh.node.on(Button.EventType.CLICK, this._onUseRefresh, this);
    this.itemBomb.node.on(Button.EventType.CLICK, this._onUseBomb, this);
  }

  protected async onAfterHide() {}

  protected async playShowAnimation(): Promise<void> {
    return TweenUtils.fadeIn(this.node, 0.3);
  }

  protected async playHideAnimation(): Promise<void> {
    return TweenUtils.fadeOut(this.node, 0);
  }

  // ========== 事件相关 ==========

  @Throttle()
  private async _onSetting() {
    AudioManager.instance.playEffect('common/audio/click1');
    const result = await PopupManager.instance.show('GameSettingPopup', {});
    switch (result) {
      case GameSettingResult.Home:
        await this.success(GameResult.Close);
        break;
      case GameSettingResult.Restart:
        this.pause();
        await this._chessboard.reset();
        this.resume();
        break;
      case GameSettingResult.Close:
        break;
    }
  }

  @Throttle()
  private async _onUseHint() {
    AudioManager.instance.playEffect('common/audio/click1');
  }

  @Throttle()
  private async _onUseRefresh() {
    AudioManager.instance.playEffect('common/audio/click1');
    const result = await PopupManager.instance.show('NoMatchPopup', { progress: 70 });
  }

  @Throttle()
  private async _onUseBomb() {
    AudioManager.instance.playEffect('common/audio/click1');
    await this.completeLevel();
  }

  // ========== 游戏逻辑 ==========

  private pause() {
    this.settingBtn.interactable = false;
    this.itemHint.interactable = false;
    this.itemRefresh.interactable = false;
    this.itemBomb.interactable = false;
  }

  private resume() {
    this.settingBtn.interactable = true;
    this.itemHint.interactable = true;
    this.itemRefresh.interactable = true;
    this.itemBomb.interactable = true;
  }

  private async completeLevel() {
    EventManager.emit(EventManager.EventType.LEVEL_COMPLETED, this.level);
    const result = await PopupManager.instance.show('LevelCompletedPopup', { clearTime: 345 });
    switch (result) {
      case LevelCompletedResult.Home:
        await this.success(GameResult.Close);
        break;
      case LevelCompletedResult.Next:
        this.pause();
        await this._chessboard.reset();
        this.resume();
        break;
    }
  }
}
