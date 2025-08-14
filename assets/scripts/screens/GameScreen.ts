import { _decorator, Button, EventTouch, Label, Node, Prefab, UIOpacity } from 'cc';
import { LogManager } from 'db://assets/Framework/managers/LogManager';
import { NonogramLevel } from 'db://assets/scripts/models/NonogramLevel';
import { TweenUtils } from 'db://assets/Framework/lib/TweenUtils';
import { BasePopup } from 'db://assets/Framework/components/BasePopup';
import { Chessboard, DropMode, LevelData } from 'db://assets/scripts/utils/Chessboard';
import { Throttle } from 'db://assets/Framework/decorators/throttle';
import { AudioManager } from 'db://assets/Framework/managers/AudioManager';
import { PopupManager } from 'db://assets/Framework/managers/PopupManager';
import { GameSettingResult } from 'db://assets/scripts/popups/GameSettingPopup';
import { LevelCompletedResult } from 'db://assets/scripts/popups/LevelCompletedPopup';
import EventManager from 'db://assets/scripts/managers/EventManager';
import { AdManager } from 'db://assets/Framework/factories/ad/AdManager';
import { NoMatchResult } from 'db://assets/scripts/popups/NoMatchPopup';

const { ccclass, property } = _decorator;

// 弹窗结果类型
export enum GameResult {
  Close = 'Close',
}

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

    const data: LevelData = {
      itemCount: 8,
      tiles: [
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
      ],
      dropMode: DropMode.HorizontalOutward,
    };

    this._chessboard = new Chessboard(this.chessboardNode, data, this.brickPrefab);
    this.displayName.string = level.displayName;
    LogManager.info('[GameScreen#onInit]', level);
  }

  protected async onBeforeShow() {}

  protected async onAfterShow() {
    this.pause();
    await this._chessboard.initTiles();
    this.settingBtn.node.on(Button.EventType.CLICK, this._onSetting, this);
    this.itemHint.node.on(Button.EventType.CLICK, this._onUseHint, this);
    this.itemRefresh.node.on(Button.EventType.CLICK, this._onUseRefresh, this);
    this.itemBomb.node.on(Button.EventType.CLICK, this._onUseBomb, this);
    this.chessboardNode.on(Node.EventType.TOUCH_END, this._onTouchEnd, this);
    this.resume();
  }

  protected async onBeforeHide() {
    this.settingBtn.node.off(Button.EventType.CLICK, this._onSetting, this);
    this.itemHint.node.off(Button.EventType.CLICK, this._onUseHint, this);
    this.itemRefresh.node.off(Button.EventType.CLICK, this._onUseRefresh, this);
    this.itemBomb.node.off(Button.EventType.CLICK, this._onUseBomb, this);
    this.chessboardNode.off(Node.EventType.TOUCH_END, this._onTouchEnd, this);
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
    this.pause();
    const result = await PopupManager.instance.show('GameSettingPopup', {});
    switch (result) {
      case GameSettingResult.Home:
        await this.success(GameResult.Close);
        break;
      case GameSettingResult.Restart:
        await this._chessboard.reset();
        break;
      case GameSettingResult.Close:
        break;
    }
    this.resume();
  }

  @Throttle()
  private async _onUseHint() {
    this.pause();

    const result = await AdManager.instance.showRewardedAd();
    console.log('显示激励视频广告', result);
    AudioManager.instance.playEffect('common/audio/click1');
    await this._chessboard.highlightHintPair();

    this.resume();
  }

  @Throttle()
  private async _onUseRefresh() {
    this.pause();

    AudioManager.instance.playEffect('common/audio/click1');
    this._chessboard.refresh();

    this.resume();
  }

  @Throttle()
  private async _onUseBomb() {
    this.pause();

    AudioManager.instance.playEffect('common/audio/click1');
    await this._chessboard.eliminateAnyPair();
    await this.checkState();

    this.resume();
  }

  @Throttle(50)
  private async _onTouchEnd(event: EventTouch) {
    this.pause();

    // 选择或消除
    await this._chessboard.selectTile(event);
    await this.checkState();

    this.resume();
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

  /**
   * 检查游戏状态
   * @private
   */
  private async checkState() {
    // 检查是否全部消除
    if (this._chessboard.isCleared) {
      await this.completeLevel();
      return;
    }

    // 检查是否仍有可消除
    if (this._chessboard.hasAnyMatch) {
      return;
    }

    // 提示玩家
    const result = await PopupManager.instance.show('NoMatchPopup', { progress: 70 });
    if (result === NoMatchResult.Refresh) {
      this._chessboard.refresh();
    }
  }

  /**
   * 完成关卡
   * @private
   */
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
