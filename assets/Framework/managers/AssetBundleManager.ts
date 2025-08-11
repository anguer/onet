import { Asset, AssetManager, assetManager } from 'cc';
import { LogManager } from 'db://assets/Framework/managers/LogManager';

export class AssetBundleManager {
  private static _instance: AssetBundleManager;

  public static get instance(): AssetBundleManager {
    if (!this._instance) {
      this._instance = new AssetBundleManager();
    }
    return this._instance;
  }

  private loadedAssetBundles: Map<string, AssetManager.Bundle> = new Map();

  public async loadAssetBundle(id: string): Promise<AssetManager.Bundle> {
    if (this.loadedAssetBundles.has(id)) {
      return this.loadedAssetBundles.get(id)!;
    }

    return new Promise<AssetManager.Bundle>((resolve, reject) => {
      assetManager.loadBundle(id, (err, bundle) => {
        if (err) {
          LogManager.error('[AssetBundleManager#loadAssetBundle]', err);
          return reject(err);
        } else {
          this.loadedAssetBundles.set(id, bundle);
          resolve(bundle);
        }
      });
    });
  }

  public unloadAssetBundle(id: string): void {
    if (this.loadedAssetBundles.has(id)) {
      const bundle = this.loadedAssetBundles.get(id)!;
      bundle.releaseAll();
      this.loadedAssetBundles.delete(id);
    }
  }

  public async preload<T extends Asset>(id: string, paths: string | string[], type: new (...args: never[]) => T): Promise<AssetManager.RequestItem[]> {
    if (!this.loadedAssetBundles.has(id)) {
      throw new Error(`[AssetBundleManager#preload] ${id} is not loaded`);
    }

    const bundle = this.loadedAssetBundles.get(id)!;
    return new Promise((resolve, reject) => {
      bundle.preload(paths, type, (err, assets) => {
        if (err) {
          return reject(err);
        }

        resolve(assets);
      });
    });
  }

  public async load<T extends Asset>(id: string, path: string, type: new (...args: never[]) => T): Promise<T> {
    if (!this.loadedAssetBundles.has(id)) {
      throw new Error(`[AssetBundleManager#load] ${id} is not loaded`);
    }

    const bundle = this.loadedAssetBundles.get(id)!;
    return new Promise<T>((resolve, reject) => {
      bundle.load(path, type, (err, assets) => {
        if (err) {
          return reject(err);
        }

        resolve(assets);
      });
    });
  }

  public async preloadDir<T extends Asset>(id: string, path: string, type: new (...args: never[]) => T): Promise<AssetManager.RequestItem[]> {
    if (!this.loadedAssetBundles.has(id)) {
      throw new Error(`[AssetBundleManager#preloadDir] ${id} is not loaded`);
    }

    const bundle = this.loadedAssetBundles.get(id)!;
    return new Promise((resolve, reject) => {
      bundle.preloadDir(path, type, (err, assets) => {
        if (err) {
          return reject(err);
        }

        resolve(assets);
      });
    });
  }

  public async loadDir<T extends Asset>(id: string, path: string, type: new (...args: never[]) => T): Promise<T[]> {
    if (!this.loadedAssetBundles.has(id)) {
      throw new Error(`[AssetBundleManager#loadDir] ${id} is not loaded`);
    }

    const bundle = this.loadedAssetBundles.get(id)!;
    return new Promise<T[]>((resolve, reject) => {
      bundle.loadDir(path, type, (err, assets) => {
        if (err) {
          return reject(err);
        }

        resolve(assets);
      });
    });
  }

  public release<T extends Asset>(id: string, path: string, type?: new (...args: never[]) => T): void {
    if (!this.loadedAssetBundles.has(id)) {
      throw new Error(`[AssetBundleManager#release] ${id} is not loaded`);
    }

    const bundle = this.loadedAssetBundles.get(id)!;
    bundle.release(path, type);
  }

  public releaseAll(id: string): void {
    if (!this.loadedAssetBundles.has(id)) {
      throw new Error(`[AssetBundleManager#releaseAll] ${id} is not loaded`);
    }

    const bundle = this.loadedAssetBundles.get(id)!;
    bundle.releaseAll();
  }
}
