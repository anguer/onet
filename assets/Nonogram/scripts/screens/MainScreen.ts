import { _decorator, Button, Label } from 'cc';
import { AudioManager } from 'db://assets/Framework/managers/AudioManager';
import { Throttle } from 'db://assets/Framework/decorators/throttle';
import EventManager from 'db://assets/Nonogram/scripts/managers/EventManager';
import { NonogramLevel } from 'db://assets/Nonogram/scripts/models/NonogramLevel';
import { LevelType } from 'db://assets/Nonogram/scripts/NonogramInterface';
import { GameManager } from 'db://assets/Nonogram/scripts/managers/GameManager';
import { ToastManager } from 'db://assets/Framework/managers/ToastManager';
import { BaseScreen } from 'db://assets/Nonogram/scripts/screens/BaseScreen';

const { ccclass, property } = _decorator;

@ccclass('MainScreen')
export class MainScreen extends BaseScreen {
  @property({ type: Button }) private startGameButton: Button;
  @property({ type: Label }) private startGameLabel: Label;

  protected onEnable() {
    this._updateUI();
    this.startGameButton.node.on(Button.EventType.CLICK, this._onStart, this);
    EventManager.on(EventManager.EventType.LEVEL_COMPLETED, this._onLevelCompleted, this);
  }

  protected onDisable() {
    this.startGameButton.node.off(Button.EventType.CLICK, this._onStart, this);
    EventManager.off(EventManager.EventType.LEVEL_COMPLETED, this._onLevelCompleted, this);
  }

  private async _onLevelCompleted(prevLevel: NonogramLevel) {
    if (prevLevel.type !== LevelType.Standard) return;

    this._updateUI();
  }

  private _updateUI() {
    if (GameManager.instance.standard) {
      this.startGameLabel.string = GameManager.instance.standard.displayName;
    } else {
      this.startGameLabel.string = '开始游戏';
    }
  }

  /**
   * 开始游戏
   * @private
   */
  @Throttle()
  private _onStart() {
    AudioManager.instance.playEffect('nonogram/audio/click1');
    if (!GameManager.instance.standard) {
      ToastManager.instance.show('你已完成所有关卡');
      return;
    }

    EventManager.emit(EventManager.EventType.START_GAME, GameManager.instance.standard);
  }
}
