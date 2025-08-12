import { _decorator, Button, Label, Node } from 'cc';
import { AudioManager } from 'db://assets/Framework/managers/AudioManager';
import { BasePopup } from 'db://assets/Framework/components/BasePopup';
import { Throttle } from 'db://assets/Framework/decorators/throttle';
const { ccclass, property } = _decorator;

export interface NoMatchOptions {
  progress: number;
}

export enum NoMatchResult {
  Close = 'Close',
  Refresh = 'Refresh',
}

@ccclass('NoMatchPopup')
export class NoMatchPopup extends BasePopup<NoMatchOptions, NoMatchResult> {
  @property(Button) private closeButton: Button;
  @property(Label) private gameProgress: Label;
  @property(Button) private refreshButton: Button;
  @property(Node) private iconAd: Node;

  protected onInit(): void {
    this.node.setScale(0, 0);
    this.node.setPosition(0, 0);

    this.gameProgress.string = `${this.options.progress}%`;
    // 如果刷新道具大于0，则不显示
    this.iconAd.active = true;
  }

  protected onEnable() {
    // 按钮
    this.refreshButton.node.on(Button.EventType.CLICK, this._onRefresh, this);
    this.closeButton.node.on(Button.EventType.CLICK, this._onClose, this);
  }

  protected onDisable() {
    // 按钮
    this.refreshButton.node.off(Button.EventType.CLICK, this._onRefresh, this);
    this.closeButton.node.off(Button.EventType.CLICK, this._onClose, this);
  }

  @Throttle()
  private async _onRefresh() {
    AudioManager.instance.playEffect('common/audio/click1');
    await this.success(NoMatchResult.Refresh);
  }

  @Throttle()
  private async _onClose() {
    AudioManager.instance.playEffect('common/audio/click1');
    await this.success(NoMatchResult.Close);
  }
}
