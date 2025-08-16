import { _decorator, Component, Node, tween, UIOpacity, Vec3 } from 'cc';

const { ccclass, property } = _decorator;

const RING_SCALE_START = new Vec3(0.6, 0.6, 1);
const RING_DURATION = 0.5;
const STAR_DURATION = 0.4;

@ccclass('StarExplosion')
export class StarExplosion extends Component {
  @property(Node) protected star1: Node;
  @property(Node) protected star2: Node;
  @property(Node) protected star3: Node;
  @property(Node) protected star4: Node;
  @property(Node) protected star5: Node;
  @property(Node) protected star6: Node;
  @property(Node) protected ring: Node;

  private get stars(): Array<Node> {
    return [this.star1, this.star2, this.star3, this.star4, this.star5, this.star6];
  }

  protected onLoad() {
    this.stars.forEach((star) => {
      const uiOpacity = star.getComponent(UIOpacity) || star.addComponent(UIOpacity);
      uiOpacity.opacity = 0;
    });

    const uiOpacity = this.ring.getComponent(UIOpacity) || this.ring.addComponent(UIOpacity);
    uiOpacity.opacity = 0;
  }

  // protected onEnable() {
  //   this.schedule(this.playExplosion, 2);
  // }
  //
  // protected onDisable() {
  //   this.unschedule(this.playExplosion);
  // }

  public async playExplosion() {
    const endRadius = 30; // 飞出半径

    // 1. 星星爆炸
    const stars = this.stars.map((star, i) => {
      const angle = (i * 60 * Math.PI) / 180; // 6个星星
      const toPos = new Vec3(Math.cos(angle) * endRadius, Math.sin(angle) * endRadius, 0);

      const uiOpacity = star.getComponent(UIOpacity) || star.addComponent(UIOpacity);

      // 初始状态
      star.setPosition(Vec3.ZERO);
      star.setScale(Vec3.ONE);
      star.angle = i * 60;
      uiOpacity.opacity = 255;

      return new Promise<void>((resolve) => {
        tween(star)
          .parallel(
            // 位移缩放
            tween(star).to(STAR_DURATION, { position: toPos }, { easing: 'quadOut' }),
            // 自旋转
            tween(star).by(STAR_DURATION, { angle: 60 }),
            tween(uiOpacity).to(STAR_DURATION, { opacity: 0 }, { easing: 'quadIn' }),
          )
          .call(() => resolve())
          .start();
      });
    });

    // 2. 圆环扩散
    const ring = new Promise<void>((resolve) => {
      const uiOpacity = this.ring.getComponent(UIOpacity) || this.ring.addComponent(UIOpacity);
      this.ring.setPosition(Vec3.ZERO);
      this.ring.setScale(RING_SCALE_START);
      uiOpacity.opacity = 180;

      tween(this.ring)
        .parallel(
          tween(this.ring).to(RING_DURATION, { scale: Vec3.ONE }, { easing: 'quadOut' }),
          tween(uiOpacity).to(RING_DURATION, { opacity: 0 }, { easing: 'quadOut' }),
        )
        .call(() => resolve())
        .start();
    });

    await Promise.all([stars, ring]);
  }
}
