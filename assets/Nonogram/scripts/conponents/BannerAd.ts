import { _decorator, Component, UITransform } from 'cc';
import { AdManager } from 'db://assets/Framework/factories/ad/AdManager';
import { ad_banner_unit_id } from 'db://assets/Nonogram/scripts/utils/Constants';
import { LogManager } from 'db://assets/Framework/managers/LogManager';
const { ccclass, property } = _decorator;

interface Func {
  (): void;
}

@ccclass('BannerAd')
export class BannerAd extends Component {
  private _hide: Func | null = null;

  private get transform(): UITransform {
    return this.node.getComponent(UITransform) || this.node.addComponent(UITransform);
  }

  public async show() {
    try {
      this._hide = await AdManager.instance.showCustomAd(ad_banner_unit_id, this.transform);
    } catch (e) {
      LogManager.warn('[BannerAd#show]', e);
    }
  }

  public hide() {
    this._hide?.();
    this._hide = null;
  }
}
