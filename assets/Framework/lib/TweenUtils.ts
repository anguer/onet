import { Node, Tween, tween, TweenEasing, UIOpacity, Vec3 } from 'cc';

export class TweenUtils {
  /**
   * 淡入效果
   * @param node 目标节点
   * @param duration 持续时间
   * @param opacity 目标透明度 (0-255)
   * @returns Promise<void> 动画完成
   */
  static async fadeIn(node: Node, duration: number, opacity: number = 255): Promise<void> {
    const uiOpacity = node.getComponent(UIOpacity) || node.addComponent(UIOpacity);
    Tween.stopAllByTarget(uiOpacity);
    await this.promisifyTween(tween(uiOpacity).set({ opacity: 0 }).to(duration, { opacity: opacity }));
  }

  /**
   * 淡出效果
   * @param node 目标节点
   * @param duration 持续时间
   * @param deactivateOnComplete 是否在淡出完成后将节点的 active 设为 false，默认值为 true
   * @returns Promise<void> 动画完成
   */
  static async fadeOut(node: Node, duration: number, deactivateOnComplete = true): Promise<void> {
    const uiOpacity = node.getComponent(UIOpacity) || node.addComponent(UIOpacity);
    Tween.stopAllByTarget(uiOpacity);
    await this.promisifyTween(tween(uiOpacity).to(duration, { opacity: 0 }));
    if (deactivateOnComplete) {
      node.active = false;
    }
  }

  /**
   * 缩放显示效果
   * @param node 目标节点
   * @param duration 持续时间
   * @param startScale 起始缩放
   * @param endScale 结束缩放
   * @param easing 缓动函数
   * @returns Promise<void> 动画完成
   */
  static async scaleIn(node: Node, duration: number, startScale: Vec3 = Vec3.ZERO, endScale: Vec3 = Vec3.ONE, easing: TweenEasing = 'backOut'): Promise<void> {
    Tween.stopAllByTarget(node);
    await this.promisifyTween(tween(node).set({ scale: startScale }).to(duration, { scale: endScale }, { easing }));
  }

  /**
   * 缩放隐藏效果
   * @param node 目标节点
   * @param duration 持续时间
   * @param endScale 结束缩放
   * @param easing 缓动函数
   * @returns Promise<void> 动画完成
   */
  static async scaleOut(node: Node, duration: number, endScale: Vec3 = Vec3.ZERO, easing: TweenEasing = 'backIn'): Promise<void> {
    Tween.stopAllByTarget(node);
    await this.promisifyTween(tween(node).to(duration, { scale: endScale }, { easing }));
  }

  /**
   * 移动动画
   * @param node 目标节点
   * @param duration 持续时间
   * @param startPos 起始位置
   * @param endPos 结束位置
   * @param easing 缓动函数
   * @returns Promise<void> 动画完成
   */
  static async move(node: Node, duration: number, startPos: Vec3, endPos: Vec3, easing: TweenEasing = 'sineOut'): Promise<void> {
    Tween.stopAllByTarget(node);
    await this.promisifyTween(tween(node).set({ position: startPos }).to(duration, { position: endPos }, { easing }));
  }

  static promisifyTween(action: Tween) {
    return new Promise<void>((resolve) => {
      action.call(() => resolve()).start();
    });
  }
}
