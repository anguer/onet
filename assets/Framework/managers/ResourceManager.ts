import { Asset, assetManager, ImageAsset, resources, SpriteFrame, Texture2D } from 'cc';
import { isRemoteUrl } from 'db://assets/Framework/lib/Share';
// import { AssetBundleManager } from 'db://assets/Framework/managers/AssetBundleManager';

interface State {
  count: number;
  complete: boolean;
  // bundle?: AssetManager.Bundle;
  on: Array<(args: unknown) => void>;
}

export class ResourceManager {
  private static _instance: ResourceManager;

  public static get instance(): ResourceManager {
    if (!this._instance) {
      this._instance = new ResourceManager();
    }
    return this._instance;
  }

  private states: Map<string, State> = new Map();

  private spriteCache: Map<string, SpriteFrame> = new Map();

  public load<T extends Asset>(path: string, type: new (...args: never[]) => T): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const state = this.getState(path, true);
      if (!state) {
        return reject(new Error(`一般不会出现空的情况，出现的话再说`));
      }

      if (state.complete) {
        resolve(resources.get(path, type)!);
      } else {
        state.on.push(resolve);
        if (state.count === 0) {
          resources.load(path, type, (err, res) => {
            if (err) {
              return reject(err);
            }

            state.complete = true;
            if (state.count === 0) {
              state.on.forEach((func) => {
                func(null);
              });
              this._release(path);
            } else {
              state.on.forEach((func) => {
                func(res);
              });
              state.on = [];
            }
          });
        }
      }
      state.count++;
    });
  }

  public loadImage(imagePath: string, defaultValue?: SpriteFrame | null): Promise<SpriteFrame | null> {
    if (isRemoteUrl(imagePath)) {
      return new Promise<SpriteFrame>((resolve, reject) => {
        if (this.spriteCache.has(imagePath)) {
          return resolve(this.spriteCache.get(imagePath)!);
        }

        assetManager.loadRemote<ImageAsset>(imagePath, { ext: '.png' }, (err, image) => {
          if (err) {
            return reject(err);
          }

          const spriteFrame = SpriteFrame.createWithImage(image);
          this.spriteCache.set(imagePath, spriteFrame);
          resolve(SpriteFrame.createWithImage(image));
        });
      });
    } else if (imagePath.endsWith('/spriteFrame')) {
      return this.load(imagePath, SpriteFrame);
    } else {
      return Promise.resolve(defaultValue || null);
    }
  }

  public loadPixelImage(imagePath: string) {
    if (isRemoteUrl(imagePath)) {
      return new Promise<SpriteFrame>((resolve, reject) => {
        if (this.spriteCache.has(imagePath)) {
          return resolve(this.spriteCache.get(imagePath)!);
        }

        assetManager.loadRemote<ImageAsset>(imagePath, { ext: '.png' }, (err, image) => {
          if (err) {
            return reject(err);
          }

          const texture = new Texture2D();
          texture.image = image;
          texture.setFilters(Texture2D.Filter.NEAREST, Texture2D.Filter.NEAREST);
          const spriteFrame = new SpriteFrame();
          spriteFrame.texture = texture;

          this.spriteCache.set(imagePath, spriteFrame);
          resolve(spriteFrame);
        });
      });
    } else if (imagePath.endsWith('/spriteFrame')) {
      return this.load(imagePath, SpriteFrame);
    } else {
      return Promise.reject(new Error('imagePath is invalid'));
    }
  }

  // public loadFromAB<T extends Asset>(path: string, type: new (...args: never[]) => T) {
  //   return new Promise<T>(async (resolve, reject) => {
  //     const state = this.getState(path, true);
  //     if (state.complete) {
  //       resolve(state.bundle.get(path, type));
  //     } else {
  //       state.on.push(resolve);
  //       if (state.count === 0) {
  //         const bundleName = this.dirname(path);
  //         const bundle = await AssetBundleManager.instance.loadAssetBundle(bundleName);
  //         if (bundle) {
  //           bundle.load(this.basename(path), type, (err, res) => {
  //             if (err) {
  //               return reject(err);
  //             }
  //
  //             state.complete = true;
  //             state.bundle = bundle;
  //             if (state.count === 0) {
  //               state.on.forEach((func) => {
  //                 func(null);
  //               });
  //               this._release(path);
  //             } else {
  //               state.on.forEach((func) => {
  //                 func(res);
  //               });
  //               state.on = [];
  //             }
  //           });
  //         }
  //       }
  //     }
  //     state.count++;
  //   });
  // }

  public release(path: string) {
    const state = this.getState(path);
    if (state && state.count > 0) {
      if (--state.count === 0 && state.complete) {
        this._release(path);
      }
    }
  }

  public existFile(path: string): boolean {
    let assetWith = false;
    const dirname = this.dirname(path);
    const basename = this.basename(path);
    const dirWith = resources.getDirWithPath(dirname);
    for (let i = 0; i < dirWith.length; i++) {
      if (basename === this.basename(dirWith[i].path)) {
        assetWith = true;
        break;
      }
    }

    return assetWith;
  }

  public dirname(_path: string) {
    const path = _path.split('?').shift() || '';
    const reg = /([\/\\])([^\/\\]+)$/g;
    const result = reg.exec(path.replace(/([\/\\])$/, ''));
    if (!result) {
      return path;
    }
    return result[2];
  }

  public basename(path: string) {
    const temp = /((.*)(\/|\\|\\\\))?(.*?\..*$)?/.exec(path);
    return temp ? temp[2] : '';
  }

  private _release(path: string) {
    const state = this.getState(path);
    if (state && state.complete) {
      if (this.existFile(path)) {
        resources.release(path);
      } else {
        // AssetBundleManager.instance.unloadAssetBundle(this.dirname(path));
      }
      this.states.delete(path);
    }
  }

  private getState(key: string, create = false): State | null {
    if (this.states.has(key)) {
      return this.states.get(key)!;
    }

    if (create) {
      const newState: State = { count: 0, complete: false, on: [] };
      this.states.set(key, newState);
      return newState;
    }

    return null;
  }
}
