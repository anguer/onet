import { _decorator, Component, Enum, Node, Prefab } from 'cc';
import { RewardManager, PointKey } from 'db://assets/scripts/managers/RewardManager';
const { ccclass, property } = _decorator;

@ccclass('RewardPoint')
export class RewardPoint extends Component {
  @property({ type: Enum(PointKey), tooltip: '唯一标识' }) private _point: PointKey = PointKey.ITEM_ENERGY;
  @property({ type: Enum(PointKey) })
  private get point(): PointKey {
    return this._point;
  }
  private set point(value: PointKey) {
    this._point = value;
  }

  @property({ type: Prefab, tooltip: '预制体' }) private prefab: Prefab;

  protected onEnable() {
    RewardManager.instance.register(this.point, this.node, this.prefab);
  }

  protected onDisable() {
    RewardManager.instance.unregister(this.point);
  }
}
