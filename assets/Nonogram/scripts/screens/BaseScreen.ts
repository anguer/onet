import { Component, UIOpacity } from 'cc';
import { TweenUtils } from 'db://assets/Framework/lib/TweenUtils';
import { LogManager } from 'db://assets/Framework/managers/LogManager';

/**
 * 增强版界面基类（泛型）
 * @template Options 界面初始化参数类型
 */
export abstract class BaseScreen extends Component {
  public static readonly EventType = {
    VISIBLE: '__BaseScreen_VISIBLE__',
  };

  private _visible = false;

  protected async onLoad() {
    const uiOpacity = this.node.getComponent(UIOpacity) || this.node.addComponent(UIOpacity);
    uiOpacity.opacity = 0;
    this._visible = false;

    this.node.on(BaseScreen.EventType.VISIBLE, this.onVisible, this);
  }

  protected onDestroy() {
    this.node.on(BaseScreen.EventType.VISIBLE, this.onVisible, this);
  }

  private async onVisible(visible: boolean) {
    if (this._visible === visible) return;

    this._visible = visible;
    if (visible) {
      await this.show();
    } else {
      await this.hide();
    }
  }

  /**
   * 显示界面并等待结果
   * @returns Promise<Result> 界面操作结果
   */
  async show(): Promise<void> {
    try {
      // 生命周期钩子
      await this.onBeforeShow();

      // 播放显示动画
      await this.playShowAnimation();

      // 生命周期钩子
      await this.onAfterShow();
    } catch (error) {
      LogManager.error('界面显示失败:', error);
    }
  }

  /**
   * 隐藏界面
   * @returns Promise<void> 隐藏完成
   */
  async hide(): Promise<void> {
    try {
      // 生命周期钩子
      await this.onBeforeHide();

      // 播放隐藏动画
      await this.playHideAnimation();

      // 生命周期钩子
      await this.onAfterHide();
    } catch (error) {
      LogManager.error('界面隐藏失败:', error);
    }
  }

  // ========== 抽象方法（子类必须实现） ==========

  /**
   * 播放显示动画
   * @returns Promise<void> 动画完成
   */
  protected async playShowAnimation(): Promise<void> {
    return TweenUtils.fadeIn(this.node, 0);
  }

  /**
   * 播放隐藏动画
   * @returns Promise<void> 动画完成
   */
  protected async playHideAnimation(): Promise<void> {
    return TweenUtils.fadeOut(this.node, 0, false);
  }

  // ========== 可选钩子方法（子类可覆盖） ==========

  /**
   * 显示前处理
   */
  protected async onBeforeShow(): Promise<void> {
    // 默认空实现
  }

  /**
   * 显示后处理
   */
  protected async onAfterShow(): Promise<void> {
    // 默认空实现
  }

  /**
   * 隐藏前处理
   */
  protected async onBeforeHide(): Promise<void> {
    // 默认空实现
  }

  /**
   * 隐藏后处理
   */
  protected async onAfterHide(): Promise<void> {
    // 默认空实现
  }
}
