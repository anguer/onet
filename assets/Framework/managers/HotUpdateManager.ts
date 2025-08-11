import { Asset, native, sys } from 'cc';
import { ResourceManager } from 'db://assets/Framework/managers/ResourceManager';
import { LogManager } from 'db://assets/Framework/managers/LogManager';
import { createProxy } from 'db://assets/Framework/lib/Share';

export enum HotUpdateStatus {
  PROGRESS,
  FAILED,
  SUCCESS,
}

export class HotUpdateManager {
  private static _instance: HotUpdateManager;

  public static get instance(): HotUpdateManager {
    if (!this._instance) {
      this._instance = createProxy(new HotUpdateManager());
    }
    return this._instance;
  }

  private initialized: boolean = false;

  // 本地 manifest 在 resource 中的路径，不包括拓展名。默认为 "project"
  private _localManifestPath: string;

  // 热更资源存储路径
  private _storagePath: string;

  // 热更新管理器
  private _assetsManager: native.AssetsManager;

  async init(options: { storagePath?: string; localManifestPath?: string }) {
    try {
      if (this.initialized) {
        return;
      }

      this.initialized = true;

      // 非原生平台，不支持
      if (!sys.isNative) {
        return;
      }

      this._localManifestPath = options.localManifestPath ?? 'project';

      // 获取存储路径
      const baseStoragePath = native.fileUtils ? native.fileUtils.getWritablePath() : '/';
      this._storagePath = baseStoragePath + (options.storagePath ?? 'remote-assets');

      // 创建 AssetManager 实例
      this._assetsManager = new native.AssetsManager('', this._storagePath, this.versionCompareHandle.bind(this));

      // 加载本地manifest文件
      const manifest = await ResourceManager.instance.load(this._localManifestPath, Asset);
      this._assetsManager.loadLocalManifest(manifest.nativeUrl);

      // 设置事件回调
      // this._assetsManager.setEventCallback(this.onAssetsManagerEvent.bind(this));

      // 如果是Android平台，设置最大并发下载任务数
      // if (sys.os === sys.OS.ANDROID) {
      //   this.assetsManager.setMaxConcurrentTask(2);
      // }
    } catch (e) {
      LogManager.error('[HotUpdateManager#init]', e);
      throw e;
    }
  }

  /**
   * 版本比较
   * @param versionA
   * @param versionB
   * @private
   */
  private versionCompareHandle(versionA: string, versionB: string) {
    const vA = versionA.split('.');
    const vB = versionB.split('.');
    for (let i = 0; i < vA.length; i++) {
      const a = parseInt(vA[i]);
      const b = parseInt(vB[i]);
      if (a !== b) {
        return a - b;
      }
    }
    if (vB.length > vA.length) {
      return -1;
    } else {
      return 0;
    }
  }

  /**
   * 检查更新
   * @private
   */
  public checkUpdate(): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      // 非原生平台，不支持
      if (!sys.isNative) {
        return resolve(false);
      }

      if (!this._assetsManager.getLocalManifest().isLoaded()) {
        LogManager.error('[HotUpdateManager#checkForUpdate]', 'Failed to load local manifest');
        return reject(new Error('Failed to load local manifest'));
      }

      this._assetsManager.setEventCallback(this.onCheckUpdateCallback(resolve).bind(this));

      // 执行检查
      this._assetsManager.checkUpdate();
    });
  }

  /**
   * 检查更新的回调函数
   * @param cb
   * @private
   */
  private onCheckUpdateCallback(cb?: (needUpdate: boolean) => void) {
    return function (event: native.EventAssetsManager) {
      switch (event.getEventCode()) {
        case native.EventAssetsManager.ERROR_NO_LOCAL_MANIFEST:
          LogManager.error('[HotUpdateManager#onCheckUpdateCallback]', 'No local manifest file found');
          cb?.(false);
          break;
        case native.EventAssetsManager.ERROR_DOWNLOAD_MANIFEST:
        case native.EventAssetsManager.ERROR_PARSE_MANIFEST:
          LogManager.error('[HotUpdateManager#onCheckUpdateCallback]', 'Failed to download or parse the remote manifest file');
          cb?.(false);
          break;
        case native.EventAssetsManager.ALREADY_UP_TO_DATE:
          LogManager.info('[HotUpdateManager#onCheckUpdateCallback]', 'Already up to date');
          cb?.(false);
          break;
        case native.EventAssetsManager.NEW_VERSION_FOUND:
          LogManager.info('[HotUpdateManager#onCheckUpdateCallback]', 'Newest version found');
          this.updateAssets();
          cb?.(true);
          break;
        default:
          break;
      }

      this._assetsManager.setEventCallback(null!);
    }.bind(this);
  }

  /**
   * 更新资源
   * @private
   */
  public updateAssets(listener: (status: HotUpdateStatus, progress?: number) => void) {
    // 非原生平台，不支持
    if (!sys.isNative) {
      return;
    }

    if (this._assetsManager.getState() === native.AssetsManager.State.UPDATING) {
      LogManager.info('[HotUpdateManager#updateAssets]', 'Already updating, Please wait...');
      return;
    }

    this._assetsManager.setEventCallback(this.onAssetsUpdateCallback(listener).bind(this));

    // 执行更新
    this._assetsManager.update();
  }

  /**
   * 资源更新的回调函数
   * @param listener
   * @private
   */
  private onAssetsUpdateCallback(listener: (status: HotUpdateStatus, progress?: number) => void) {
    return function (event: native.EventAssetsManager) {
      let failed = false;
      let needRestart = false;

      switch (event.getEventCode()) {
        case native.EventAssetsManager.ERROR_NO_LOCAL_MANIFEST:
          LogManager.error('[HotUpdateManager#onAssetsUpdateCallback]', 'No local manifest file found');
          failed = true;
          break;
        case native.EventAssetsManager.UPDATE_PROGRESSION:
          LogManager.info('[HotUpdateManager#onAssetsUpdateCallback]', `Update progression: ${event.getPercent()}%`);
          listener(HotUpdateStatus.PROGRESS, event.getPercent());
          break;
        case native.EventAssetsManager.ERROR_DOWNLOAD_MANIFEST:
        case native.EventAssetsManager.ERROR_PARSE_MANIFEST:
          LogManager.error('[HotUpdateManager#onAssetsUpdateCallback]', 'Failed to download or parse the remote manifest file');
          failed = true;
          break;
        case native.EventAssetsManager.ALREADY_UP_TO_DATE:
          LogManager.info('[HotUpdateManager#onAssetsUpdateCallback]', 'Already up to date with the latest remote version');
          failed = true;
          break;
        case native.EventAssetsManager.UPDATE_FINISHED:
          LogManager.info('[HotUpdateManager#onAssetsUpdateCallback]', 'Update finished');
          needRestart = true;
          break;
        case native.EventAssetsManager.UPDATE_FAILED:
          LogManager.error('[HotUpdateManager#onAssetsUpdateCallback]', `Update failed: ${event.getMessage()}`);
          // retry
          break;
        case native.EventAssetsManager.ERROR_UPDATING:
          LogManager.error('[HotUpdateManager#onAssetsUpdateCallback]', `Asset update error: ${event.getAssetId()}, ${event.getMessage()}`);
          // show message
          break;
        case native.EventAssetsManager.ERROR_DECOMPRESS:
          LogManager.error('[HotUpdateManager#onAssetsUpdateCallback]', `${event.getMessage()}`);
          // show message
          break;
        default:
          break;
      }

      if (failed) {
        this._assetsManager.setEventCallback(null!);
        listener(HotUpdateStatus.FAILED);
      }

      if (needRestart) {
        this._assetsManager.setEventCallback(null!);

        // Prepend the manifest's search path
        const searchPaths = native.fileUtils.getSearchPaths();
        const newPaths = this._assetsManager.getLocalManifest().getSearchPaths();
        LogManager.info('[HotUpdateManager#onAssetsUpdateCallback]', JSON.stringify(newPaths));
        Array.prototype.unshift.apply(searchPaths, newPaths);
        // This value will be retrieved and appended to the default search path during game startup,
        // please refer to samples/js-tests/main.js for detailed usage.
        // !!! Re-add the search paths in main.js is very important, otherwise, new scripts won't take effect.
        localStorage.setItem('HotUpdateSearchPaths', JSON.stringify(searchPaths));
        native.fileUtils.setSearchPaths(searchPaths);

        listener(HotUpdateStatus.SUCCESS);
      }
    }.bind(this);
  }
}
