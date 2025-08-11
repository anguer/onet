import { Component, Node, NodePool, Prefab, instantiate } from 'cc';
import { LogManager } from 'db://assets/Framework/managers/LogManager';

export interface NodePoolComponent extends Component {
  /**
   * 当回收对象时触发
   */
  unuse(): void;

  /**
   * 当复用对象时触发
   * @param args
   */
  reuse(args: never): void;
}

export interface NodePoolOptions<T extends NodePoolComponent> {
  name: string;
  handler?: new (...args: never[]) => T;
  initialSize?: number;
  incrementSize?: number;
  maxSize?: number;
}

export class ObjectPoolManager {
  private static _instance: ObjectPoolManager;

  public static get instance(): ObjectPoolManager {
    if (!this._instance) {
      this._instance = new ObjectPoolManager();
    }
    return this._instance;
  }

  private objectPools: Map<string, NodePool> = new Map<string, NodePool>();

  public get keys(): string[] {
    return [...this.objectPools.keys()];
  }

  /**
   * 创建对象池
   * @param prefab
   * @param options
   */
  public createPool<T extends NodePoolComponent>(prefab: Prefab, options: NodePoolOptions<T>): NodePool {
    const { name, handler, initialSize = 10, maxSize = 100 } = options;
    if (!this.objectPools.has(name)) {
      const pool = new NodePool(handler);
      this.objectPools.set(name, pool);

      const count = Math.min(initialSize, Math.max(initialSize, maxSize));
      for (let i = 0; i < count; i++) {
        const node = instantiate(prefab);
        pool.put(node);
      }

      return pool;
    } else {
      // ignore
      LogManager.warn('[ObjectPoolManager#createPool]', 'pool key is exist');
      return this.objectPools.get(name)!;
    }
  }

  public expandPool<T extends NodePoolComponent>(prefab: Prefab, options: NodePoolOptions<T>): NodePool {
    const { name, incrementSize = 10, maxSize = 100 } = options;
    const pool = this.objectPools.get(name);
    if (!pool) {
      return this.createPool(prefab, options);
    }

    const poolSize = pool.size();
    const count = Math.min(incrementSize, maxSize - poolSize);
    for (let i = 0; i < count; i++) {
      const node = instantiate(prefab);
      pool.put(node);
    }
    return pool;
  }

  /**
   * 从对象池中取出一个对象
   * @param key
   */
  public get(key: string): Node | null {
    const pool = this.objectPools.get(key);
    if (!pool) {
      return null;
    }

    const node = pool.get();
    if (!node) {
      return null;
    }

    node.active = true;
    return node;
  }

  /**
   * 将对象放回对象池
   * @param key
   * @param node
   */
  public put(key: string, node: Node): void {
    const pool = this.objectPools.get(key);
    if (!pool) {
      return;
    }

    node.active = false;
    pool.put(node);
  }

  /**
   * 清空对象池
   * @param key
   */
  public clear(key: string): void {
    const pool = this.objectPools.get(key);
    if (!pool) {
      return;
    }

    pool.clear();
  }

  public deletePool(key: string): void {
    const pool = this.objectPools.get(key);
    if (!pool) {
      return;
    }

    pool.clear();
    this.objectPools.delete(key);
  }

  /**
   * 对象池大小
   * @param key
   */
  public getSize(key: string): number {
    const pool = this.objectPools.get(key);
    if (!pool) {
      return 0;
    }

    return pool.size();
  }
}
