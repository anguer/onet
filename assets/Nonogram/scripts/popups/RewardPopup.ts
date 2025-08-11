import { _decorator, Button, instantiate, Node, Prefab } from 'cc';
import { BasePopup } from 'db://assets/Framework/components/BasePopup';
import { AudioManager } from 'db://assets/Framework/managers/AudioManager';
import { Throttle } from 'db://assets/Framework/decorators/throttle';
import { IReward } from 'db://assets/Nonogram/scripts/NonogramInterface';
import { RewardItem } from 'db://assets/Nonogram/scripts/conponents/RewardItem';
const { ccclass, property } = _decorator;

// 弹窗参数类型
export interface RewardOptions {
  rewards: IReward[];
}

// 弹窗结果类型
export enum RewardResult {
  Close = 'Close',
  Ok = 'Ok',
}

@ccclass('RewardPopup')
export class RewardPopup extends BasePopup<RewardOptions, RewardResult> {
  @property(Node) private closeButton: Node;
  @property(Node) private okButton: Node;
  @property(Node) private rewards: Node;
  @property(Prefab) private rewardPrefab: Prefab;

  protected onInit(): void {
    this.node.setScale(0, 0);
    this.node.setPosition(0, 0);

    this._updateRewards(this.options.rewards);
  }

  protected onEnable() {
    this.closeButton.on(Button.EventType.CLICK, this._onClose, this);
    this.okButton.on(Button.EventType.CLICK, this._onOk, this);
  }

  protected onDisable() {
    this.closeButton.off(Button.EventType.CLICK, this._onClose, this);
    this.okButton.off(Button.EventType.CLICK, this._onOk, this);
  }

  @Throttle()
  private async _onClose() {
    AudioManager.instance.playEffect('common/audio/click1');

    await this.success(RewardResult.Close);
  }

  @Throttle()
  private async _onOk() {
    AudioManager.instance.playEffect('common/audio/click1');

    await this.success(RewardResult.Ok);
  }

  private _updateRewards(rewards: IReward[]) {
    this.rewards.removeAllChildren();

    for (const reward of rewards) {
      const node = instantiate(this.rewardPrefab);
      const item = node.getComponent(RewardItem);
      if (!item) {
        node.destroy();
        throw new Error('[RewardPopup#_updateRewards] RewardItem was not found');
      }

      item.updateUI(reward);
      this.rewards.addChild(node);
    }
  }
}
