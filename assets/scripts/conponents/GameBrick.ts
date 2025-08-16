import { _decorator, Color, Component, Node, Sprite, SpriteFrame, tween, UIOpacity, Vec3 } from 'cc';
import { StarExplosion } from 'db://assets/scripts/conponents/StarExplosion';

const { ccclass, property } = _decorator;

@ccclass('GameBrick')
export class GameBrick extends Component {
  @property(Node) private content: Node;
  @property(Sprite) private background: Sprite;
  @property(Sprite) private image: Sprite;
  @property(StarExplosion) private explosion: StarExplosion;
  // @property(sp.Skeleton) private spine: sp.Skeleton;

  @property private _isChecked: boolean = false;
  @property
  public get isChecked() {
    return this._isChecked;
  }
  public set isChecked(value: boolean) {
    this._isChecked = value;
    this._updateUI();
  }

  public updateUI(spriteFrame: SpriteFrame) {
    this.image.spriteFrame = spriteFrame;
    this._updateUI();
  }

  public toggle(checked: boolean) {
    this.isChecked = checked;
  }

  public highlight(highlight: boolean) {
    this.background.color = highlight ? new Color(253, 70, 103) : Color.WHITE;
  }

  public async destroySelf(): Promise<void> {
    // if (!this.spine.skeletonData) {
    //   return;
    // }
    //
    // const anim = this.spine.findAnimation(this.spine.animation);
    // if (anim) {
    //   this.spine.setAnimation(0, this.spine.animation, false);
    //   await sleep(anim.duration);
    // }

    await Promise.all([this.clear(), this.explosion.playExplosion()]);
    this.node.destroy();
  }

  private async clear(): Promise<void> {
    return new Promise<void>((resolve) => {
      const content = this.content;
      const uiOpacity = content.getComponent(UIOpacity) || content.addComponent(UIOpacity);
      tween(content)
        .parallel(
          // 缩放
          tween(content).to(0.4, { scale: Vec3.ZERO }, { easing: 'quadOut' }),
          // 透明
          tween(uiOpacity).to(0.4, { opacity: 0 }, { easing: 'quadIn' }),
        )
        // .to(0.3, { scale: Vec3.ZERO }, { easing: 'backIn' })
        .call(() => resolve())
        .start();
    });
  }

  private _updateUI() {
    // 橙色
    // this.background.color = this._isChecked ? new Color(255, 142, 38) : Color.WHITE;
    // 玫瑰色
    // this.background.color = this._isChecked ? new Color(253, 70, 103) : Color.WHITE;
    // 浅绿
    // this.background.color = this._isChecked ? new Color(172, 250, 240) : Color.WHITE;
    // 深绿
    // this.background.color = this._isChecked ? new Color(19, 191, 171) : Color.WHITE;
    // 深蓝
    this.background.color = this._isChecked ? new Color(100, 117, 254) : Color.WHITE;
  }
}
