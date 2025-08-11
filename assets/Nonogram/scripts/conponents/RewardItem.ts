import { _decorator, Component, Label, Node, Sprite, SpriteFrame } from 'cc';
import { IReward, RewardType } from 'db://assets/Nonogram/scripts/NonogramInterface';

const { ccclass, property } = _decorator;

@ccclass('RewardItem')
export class RewardItem extends Component {
  @property(Sprite) private icon: Sprite;
  @property(Label) private count: Label;

  @property({ type: SpriteFrame, group: { name: 'Icon Sets', id: 'iconSets' } }) private iconBulb: SpriteFrame;
  @property({ type: SpriteFrame, group: { name: 'Icon Sets', id: 'iconSets' } }) private iconCoin: SpriteFrame;
  @property({ type: SpriteFrame, group: { name: 'Icon Sets', id: 'iconSets' } }) private iconEnergy: SpriteFrame;

  public updateUI(reward: IReward) {
    this.count.string = `x${reward.count}`;
    switch (reward.type) {
      case RewardType.Bulb:
        this.icon.spriteFrame = this.iconBulb;
        break;
      case RewardType.Coin:
        this.icon.spriteFrame = this.iconCoin;
        break;
      case RewardType.Energy:
        this.icon.spriteFrame = this.iconEnergy;
        break;
    }
  }
}
