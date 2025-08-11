import { BlockInputEvents, Canvas, Color, director, Graphics, instantiate, Node, Prefab, UIOpacity, UITransform } from 'cc';
import { createFullscreenNode } from 'db://assets/Framework/lib/Node';
import { BasePopup } from 'db://assets/Framework/components/BasePopup';
import { TweenUtils } from 'db://assets/Framework/lib/TweenUtils';
import { LogManager } from 'db://assets/Framework/managers/LogManager';

export interface PopupMap {
  [key: string]: new () => BasePopup;
}

// 弹窗配置项
interface PopupConfig<C extends new () => BasePopup> {
  prefab: Prefab;
  ctor: C;
  priority: number;
  modal: boolean;
}

export class PopupManager {
  public static readonly EventType = {
    STATE_CHANGE: '__PopupManager_STATE_CHANGE__',
  };

  private static _instance: PopupManager;

  public static get instance(): PopupManager {
    if (!this._instance) {
      this._instance = new PopupManager();
    }
    return this._instance;
  }

  // UI节点
  private readonly _manager: Node;
  private readonly _mask: Node;

  // 弹窗配置映射 (类名 -> 配置)
  private popupConfigs: Map<keyof PopupMap, PopupConfig<PopupMap[keyof PopupMap]>> = new Map();

  // 活动弹窗映射 (类名 -> 节点)
  private activePopups: Map<keyof PopupMap, Node> = new Map();

  constructor() {
    this._manager = createFullscreenNode(`__${this.constructor.name}__`);
    this._manager.addComponent(Canvas);

    // 添加节点到场景
    director.getScene()?.addChild(this._manager);

    // 标记为常驻节点，这样场景切换的时候就不会被销毁了
    director.addPersistRootNode(this._manager);

    // 创建遮罩
    this._mask = this._createMask();
  }

  private _createMask(): Node {
    // 创建遮罩
    const mask = createFullscreenNode('__Mask__', this._manager);
    // 阻止穿透
    mask.addComponent(BlockInputEvents);
    // 绘制背景
    const transform = mask.getComponent(UITransform) || mask.addComponent(UITransform);
    const graphics = mask.getComponent(Graphics) || mask.addComponent(Graphics);
    graphics.clear();
    graphics.fillColor = new Color(0, 0, 0, 100);
    graphics.fillRect(-transform.width / 2, -transform.height / 2, transform.width, transform.height);
    // 添加半透明背景
    const modalBgOpacity = mask.addComponent(UIOpacity);
    modalBgOpacity.opacity = 0;
    // 默认禁用
    mask.active = false;
    return mask;
  }

  public on(...options: Parameters<typeof this._manager.on>) {
    this._manager.on(...options);
  }

  public off(...options: Parameters<typeof this._manager.off>) {
    this._manager.off(...options);
  }

  public emit(...options: Parameters<typeof this._manager.emit>) {
    this._manager.emit(...options);
  }

  /**
   * 注册弹窗
   * @param name
   * @param prefab 弹窗预制体
   * @param ctor
   * @param priority 显示优先级（默认0）
   * @param modal 是否模态弹窗（默认true）
   */
  public registerPopup<K extends keyof PopupMap>(name: K, prefab: Prefab, ctor: PopupMap[K], priority: number = 0, modal: boolean = true): void {
    this.popupConfigs.set(name, { prefab, ctor, priority, modal });
  }

  /**
   * 显示弹窗
   * @param name
   * @param options 弹窗参数
   * @returns Promise<Result> 弹窗结果
   */
  public async show<K extends keyof PopupMap>(
    name: K,
    options: PopupMap[K] extends new () => BasePopup<infer O> ? O : never,
  ): Promise<PopupMap[K] extends new () => BasePopup<any, infer R> ? R : never> {
    if (!this.popupConfigs.has(name)) {
      throw new Error(`Popup "${name}" not registered!`);
    }

    if (this.activePopups.has(name)) {
      throw new Error(`Popup "${name}" is already active!`);
    }

    return this.executeShowPopup(name, options);
  }

  /**
   * 隐藏指定弹窗
   * @param name
   */
  public async hide<K extends keyof PopupMap>(name: K): Promise<void> {
    if (!this.activePopups.has(name)) return;

    const popupNode = this.activePopups.get(name)!;
    const config = this.popupConfigs.get(name);
    const popup = popupNode.getComponent(config?.ctor ?? BasePopup);

    if (popup) {
      await popup.hide();
    } else {
      popupNode.destroy();
    }

    await this.cleanupPopup(name);
  }

  /**
   * 隐藏所有弹窗
   */
  public async hideAll(): Promise<void> {
    for (const name of this.activePopups.keys()) {
      await this.hide(name);
    }

    // 隐藏遮罩
    await this.hideMask();
  }

  private async executeShowPopup<K extends keyof PopupMap>(
    name: K,
    options: PopupMap[K] extends new () => BasePopup<infer O> ? O : never,
  ): Promise<PopupMap[K] extends new () => BasePopup<any, infer R> ? R : never> {
    const config = this.popupConfigs.get(name);
    if (!config) {
      throw new Error(`Popup config for key "${name}" not found`);
    }

    // 创建弹窗节点和获取弹窗组件
    const popupNode = instantiate(config.prefab);
    const popup = popupNode.getComponent(config.ctor);
    if (!popup) {
      popupNode.destroy();
      throw new Error(`Popup ${name} missing BasePopup component!`);
    }

    try {
      // 初始化弹窗
      popup.init(options);

      // 添加节点至Canvas
      this._manager.addChild(popupNode);

      // 添加到活动弹窗列表
      this.activePopups.set(name, popupNode);

      // 显示遮罩
      this.showMask(config.modal);

      // 通知状态变更
      this.emit(PopupManager.EventType.STATE_CHANGE, this.activePopups.size);

      // 显示弹窗并等待结果
      return await popup.show();
    } catch (err) {
      LogManager.error('[PopupManager#executeShowPopup]', err);
      throw new Error(`Error showing popup ${name}`);
    } finally {
      // 清理弹窗
      await this.cleanupPopup(name);
    }
  }

  private async cleanupPopup<K extends keyof PopupMap>(name: K) {
    const popupNode = this.activePopups.get(name);
    if (popupNode) {
      const config = this.popupConfigs.get(name);
      const popup = popupNode.getComponent(config?.ctor ?? BasePopup);
      if (popup) {
        await popup.hide();
      } else {
        popupNode.destroy();
      }
    }

    // 从活动弹窗中移除
    this.activePopups.delete(name);

    // 通知状态变更
    this.emit(PopupManager.EventType.STATE_CHANGE, this.activePopups.size);

    // 隐藏遮罩
    await this.hideMask();
  }

  private showMask(modal: boolean) {
    this._mask.active = true;
    this._mask.setSiblingIndex(Math.max(0, this._manager.children.length - 2));
    if (modal) {
      TweenUtils.fadeIn(this._mask, 0.3).then().catch();
    }
  }

  private async hideMask() {
    this._mask.setSiblingIndex(Math.max(0, this._manager.children.length - 2));
    // 如果没有模态弹窗了，透明遮罩
    if (!this.hasModalPopup()) {
      await TweenUtils.fadeOut(this._mask, 0.2);
      // 如果没有弹窗了，隐藏遮罩
      if (this.activePopups.size === 0) {
        this._mask.active = false;
      }
    }
  }

  private hasModalPopup(): boolean {
    for (const className of this.activePopups.keys()) {
      const config = this.popupConfigs.get(className);
      if (config?.modal) return true;
    }
    return false;
  }
}
