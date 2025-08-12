import { Canvas, director, instantiate, Node, Prefab, randomRange, tween, UITransform, Vec3 } from 'cc';
import { createFullscreenNode } from 'db://assets/Framework/lib/Node';
import { LogManager } from 'db://assets/Framework/managers/LogManager';

export enum PointKey {
  ITEM_ENERGY = 'ITEM_ENERGY',
  ITEM_TIP = 'ITEM_TIP',
  ITEM_COIN = 'ITEM_COIN',
  ENERGY_SLOT_FROM_STANDARD = 'ENERGY_SLOT_FROM_STANDARD',
  ENERGY_SLOT_FROM_CALENDAR = 'ENERGY_SLOT_FROM_CALENDAR',
  ENERGY_SLOT_FROM_CHAPTER = 'ENERGY_SLOT_FROM_CHAPTER',
}

export class RewardManager {
  private static _instance: RewardManager;

  public static get instance(): RewardManager {
    if (!this._instance) {
      this._instance = new RewardManager();
    }
    return this._instance;
  }

  private readonly _manager: Node;
  private readonly _content: Node;
  private readonly _points: Map<PointKey, Node> = new Map();
  private readonly _prefabs: Map<PointKey, Prefab> = new Map();

  private readonly _minRadius: number = 20;
  private readonly _maxRadius: number = 50;
  private readonly _startDuration: number = 0.4;
  private readonly _endDuration: number = 0.8;
  private readonly _scaleLarge: Vec3 = new Vec3(2, 2, 2);

  constructor() {
    this._manager = createFullscreenNode(`__${this.constructor.name}__`);
    this._manager.addComponent(Canvas);

    this._content = createFullscreenNode(`__${this.constructor.name}_Content__`);
    this._manager.addChild(this._content);

    // 添加节点到场景
    director.getScene()?.addChild(this._manager);

    // 标记为常驻节点，这样场景切换的时候就不会被销毁了
    director.addPersistRootNode(this._manager);
  }

  public register(key: PointKey, node: Node, prefab: Prefab) {
    this._points.set(key, node);
    this._prefabs.set(key, prefab);
  }

  public unregister(key: PointKey) {
    this._points.delete(key);
    this._prefabs.delete(key);
  }

  public fromTo(fromKey: PointKey, toKey: PointKey): Promise<void> {
    return new Promise<void>(async (resolve) => {
      try {
        if (!this._points.has(fromKey) || !this._points.has(toKey) || !this._prefabs.has(toKey)) {
          return resolve();
        }

        const prefab = this._prefabs.get(toKey)!;
        const node = this._createItem(prefab);

        const uiTransform = this._content.getComponent(UITransform) || this._content.addComponent(UITransform);
        const fromPos = uiTransform.convertToNodeSpaceAR(this._points.get(fromKey)!.worldPosition.clone());
        const toPos = uiTransform.convertToNodeSpaceAR(this._points.get(toKey)!.worldPosition.clone());

        // 执行动画
        await this._move(node, fromPos, toPos);

        resolve();
      } catch (e) {
        LogManager.error('[RewardManager#fromTo]', e);
        resolve();
      }
    });
  }

  public playDrop(key: PointKey, increaseCount: number): Promise<void> {
    return new Promise<void>(async (resolve) => {
      try {
        if (!this._points.has(key) || !this._prefabs.has(key)) {
          return resolve();
        }

        const prefab = this._prefabs.get(key)!;
        const items: Node[] = [];
        const itemCount = Math.min(10, increaseCount);
        for (let i = 0; i < itemCount; i++) {
          const node = this._createItem(prefab);
          items.push(node);
        }

        const uiTransform = this._content.getComponent(UITransform) || this._content.addComponent(UITransform);
        const targetPos = uiTransform.convertToNodeSpaceAR(this._points.get(key)!.worldPosition.clone());

        const tasks: Promise<void>[] = [];
        for (let i = 0; i < itemCount; i++) {
          // 计算随机角度，确保道具在圆周上均匀分布
          const angle = randomRange((i * 360) / itemCount, ((i + 1) * 360) / itemCount);
          // 计算随机半径
          const radius = randomRange(this._minRadius, this._maxRadius);
          // 根据角度和半径计算X坐标
          const randomX = radius * Math.cos(angle);
          // 根据角度和半径计算Y坐标
          const randomY = radius * Math.sin(angle);
          // 执行动画
          tasks.push(this._runAnimation(items[i], new Vec3(randomX, randomY), targetPos));
        }
        await Promise.all(tasks);

        resolve();
      } catch (e) {
        LogManager.error('[RewardManager#playDrop]', e);
        resolve();
      }
    });
  }

  private _move(node: Node, from: Vec3, to: Vec3) {
    return new Promise<void>((resolve) => {
      try {
        tween(node)
          .set({ position: from })
          .to(this._endDuration, { position: to }, { easing: 'quadIn' })
          .delay(0.18)
          .call(() => resolve())
          .destroySelf()
          .start();
      } catch (e) {
        LogManager.error('[RewardManager#_move]', e);
        resolve();
      }
    });
  }

  private _runAnimation(node: Node, from: Vec3, to: Vec3) {
    return new Promise<void>((resolve) => {
      try {
        tween(node)
          .set({ scale: this._scaleLarge })
          .to(this._startDuration, { position: from }, { easing: 'quadOut' })
          .to(this._endDuration, { position: to, scale: Vec3.ONE }, { easing: 'quadIn' })
          .delay(0.18)
          .call(() => resolve())
          .destroySelf()
          .start();
      } catch (e) {
        LogManager.error('[RewardManager#_runAnimation]', e);
        resolve();
      }
    });
  }

  private _createItem(prefab: Prefab): Node {
    const node = instantiate(prefab);
    node.setPosition(0, 0, 0);
    this._content.addChild(node);
    return node;
  }
}
