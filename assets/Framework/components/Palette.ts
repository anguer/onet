import { Color, Component, Director, Node, UIRenderer, _decorator, director, isValid, warn } from 'cc';
import { DEV } from 'cc/env';

const { ccclass, property, executeInEditMode, requireComponent, menu } = _decorator;

@ccclass
@executeInEditMode
@requireComponent(UIRenderer)
@menu('Comp/Palette')
export class Palette extends Component {
  @property private _colorLB: Color = new Color(255, 255, 255, 255);
  @property({ displayName: DEV ? '↙ 左下' : '' })
  private get colorLB() {
    return this._colorLB;
  }
  private set colorLB(value: Color) {
    this._colorLB = value;
    this.updateColor();
  }

  @property private _colorRB: Color = new Color(255, 255, 255, 255);
  @property({ displayName: DEV ? '↘ 右下' : '' })
  private get colorRB() {
    return this._colorRB;
  }
  private set colorRB(value: Color) {
    this._colorRB = value;
    this.updateColor();
  }

  @property private _colorLT: Color = new Color(255, 255, 255, 255);
  @property({ displayName: DEV ? '↖ 左上' : '' })
  private get colorLT() {
    return this._colorLT;
  }
  private set colorLT(value: Color) {
    this._colorLT = value;
    this.updateColor();
  }

  @property private _colorRT: Color = new Color(255, 255, 255, 255);
  @property({ displayName: DEV ? '↗ 右上' : '' })
  private get colorRT() {
    return this._colorRT;
  }
  private set colorRT(value: Color) {
    this._colorRT = value;
    this.updateColor();
  }

  private ur: UIRenderer | null = null;
  private vb: Float32Array;

  protected onLoad() {
    this.ur = this.node.getComponent(UIRenderer);
    if (!this.ur || !this.ur['_renderData']) {
      return;
    }

    this.vb = this.ur['_renderData'].chunk.vb;
    if (this.vb.length !== 36) {
      warn('Palette只对Sprite和Label有效！');
      this.destroy();
      return;
    }

    director.once(Director.EVENT_AFTER_DRAW, this.updateColor, this);
  }

  private updateColor() {
    const vb = this.vb;
    const lb = this._colorLB,
      rb = this._colorRB,
      lt = this._colorLT,
      rt = this._colorRT;

    vb[5] = lb.r / 255;
    vb[6] = lb.g / 255;
    vb[7] = lb.b / 255;
    vb[8] = lb.a / 255;
    vb[14] = rb.r / 255;
    vb[15] = rb.g / 255;
    vb[16] = rb.b / 255;
    vb[17] = rb.a / 255;
    vb[23] = lt.r / 255;
    vb[24] = lt.g / 255;
    vb[25] = lt.b / 255;
    vb[26] = lt.a / 255;
    vb[32] = rt.r / 255;
    vb[33] = rt.g / 255;
    vb[34] = rt.b / 255;
    vb[35] = rt.a / 255;
  }

  protected onDestroy() {
    if (!this.ur || !isValid(this.ur)) {
      return;
    }

    const vb = this.vb;
    const color = this.ur.color;
    vb[5] = vb[14] = vb[23] = vb[32] = color.r / 255;
    vb[6] = vb[15] = vb[24] = vb[33] = color.g / 255;
    vb[7] = vb[16] = vb[25] = vb[34] = color.b / 255;
    vb[8] = vb[17] = vb[26] = vb[35] = color.a / 255;
  }
}
