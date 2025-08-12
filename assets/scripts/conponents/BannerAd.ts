import { _decorator, Component, UITransform } from 'cc';
import { AdManager } from 'db://assets/Framework/factories/ad/AdManager';
const { ccclass } = _decorator;

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
    this._hide = await AdManager.instance.showCustomAd({ uiTransform: this.transform });
  }

  public hide() {
    this._hide?.();
    this._hide = null;
  }
}
