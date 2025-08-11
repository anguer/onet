import { Component } from 'cc';
import { TweenUtils } from 'db://assets/Framework/lib/TweenUtils';
import { LogManager } from 'db://assets/Framework/managers/LogManager';

/**
 * 增强版弹窗基类（泛型）
 * @template Options 弹窗初始化参数类型
 * @template Result 弹窗返回结果类型
 */
export abstract class BasePopup<Options = any, Result = any> extends Component {
  protected options: Options; // 保存传入的选项
  private resolve: ((result: Result) => void) | null = null;

  /**
   * 初始化弹窗
   * @param options 初始化参数
   */
  init(options: Options): void {
    this.options = options;
    this.resolve = null;
    this.onInit(options);
  }

  private _pauseEvents() {
    try {
      this.node.pauseSystemEvents(true);
    } catch {}
  }

  private _resumeEvents() {
    try {
      this.node.resumeSystemEvents(true);
    } catch {}
  }

  /**
   * 显示弹窗并等待结果
   * @returns Promise<Result> 弹窗操作结果
   */
  async show(): Promise<Result> {
    try {
      this._pauseEvents();
      // 生命周期钩子
      await this.onBeforeShow();

      // 播放显示动画
      await this.playShowAnimation();

      // 生命周期钩子
      await this.onAfterShow();

      // 等待用户操作
      return new Promise((resolve) => {
        this.resolve = resolve;
      });
    } catch (e) {
      LogManager.error('[BasePopup#show]', e);
      throw new Error('弹窗显示失败');
    } finally {
      this._resumeEvents();
    }
  }

  /**
   * 隐藏弹窗
   * @returns Promise<void> 隐藏完成
   */
  async hide(): Promise<void> {
    try {
      this._pauseEvents();
      // 生命周期钩子
      await this.onBeforeHide();

      // 播放隐藏动画
      await this.playHideAnimation();

      // 生命周期钩子
      await this.onAfterHide();
    } catch (e) {
      LogManager.error('[BasePopup#hide]', e);
    } finally {
      // 销毁节点
      this.node.destroy();
      this._resumeEvents();
    }
  }

  /**
   * 等待用户操作（核心方法）
   */
  async success(result: Result): Promise<void> {
    this.resolve?.(result);

    this.resolve = null;

    await this.hide();
  }

  // ========== 抽象方法（子类必须实现） ==========

  /**
   * 弹窗初始化逻辑
   */
  protected abstract onInit(options: Options): void;

  /**
   * 播放显示动画
   * @returns Promise<void> 动画完成
   */
  protected async playShowAnimation(): Promise<void> {
    return TweenUtils.scaleIn(this.node, 0.3);
  }

  /**
   * 播放隐藏动画
   * @returns Promise<void> 动画完成
   */
  protected async playHideAnimation(): Promise<void> {
    return TweenUtils.scaleOut(this.node, 0.2);
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
