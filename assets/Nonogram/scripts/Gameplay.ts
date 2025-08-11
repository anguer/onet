import { _decorator, Asset, Component, instantiate, Node, Prefab, game, Game, SpriteFrame } from 'cc';
import { LogManager } from 'db://assets/Framework/managers/LogManager';
import { PopupManager } from 'db://assets/Framework/managers/PopupManager';
import { EventManager } from 'db://assets/Nonogram/scripts/managers/EventManager';
import { GameManager } from 'db://assets/Nonogram/scripts/managers/GameManager';
import { SplashScreen } from 'db://assets/Nonogram/scripts/screens/SplashScreen';
import { UserManager } from 'db://assets/Nonogram/scripts/managers/UserManager';
import { NonogramLevel } from 'db://assets/Nonogram/scripts/models/NonogramLevel';
import { ResourceManager } from 'db://assets/Framework/managers/ResourceManager';
import { NetManager } from 'db://assets/Nonogram/scripts/managers/NetManager';
import { ToastManager } from 'db://assets/Framework/managers/ToastManager';
import { SettingsPopup } from 'db://assets/Nonogram/scripts/popups/SettingsPopup';
import { RewardPopup } from 'db://assets/Nonogram/scripts/popups/RewardPopup';
import { ObjectPoolManager } from 'db://assets/Framework/managers/ObjectPoolManager';
import { GameResult, GameScreen } from 'db://assets/Nonogram/scripts/screens/GameScreen';
import { SocialManager } from 'db://assets/Framework/factories/social/SocialManager';
import { AnalysisManager } from 'db://assets/Nonogram/scripts/managers/AnalysisManager';

const { ccclass, property } = _decorator;

declare module 'db://assets/Framework/managers/PopupManager' {
  interface PopupMap {
    SettingsPopup: typeof SettingsPopup;
    RewardPopup: typeof RewardPopup;
    GameScreen: typeof GameScreen;
  }
}

const MAIN_SCREEN = 'prefabs/screens/MainScreen';
const SPINNER_ASSET = 'common/sprites/spinner/spriteFrame';

const popups = [
  // Modal
  { popupClass: SettingsPopup, path: 'prefabs/popups/SettingsPopup', modal: true, priority: 1000 },
  { popupClass: RewardPopup, path: 'prefabs/popups/RewardPopup', modal: true, priority: 1000 },
  // Fullscreen
  { popupClass: GameScreen, path: 'prefabs/popups/GameScreen', modal: false, priority: 900 },
];

const OTHER_COUNT = 2;
const POOL_COUNT = 2;
const RESOURCE_COUNT = OTHER_COUNT + POOL_COUNT + popups.length;

@ccclass('Gameplay')
export class Gameplay extends Component {
  @property(SplashScreen) private splashScreen: SplashScreen;
  @property(Node) private root: Node;
  @property(Prefab) private calendarDayPrefab: Prefab;

  protected onLoad() {
    game.on(Game.EVENT_HIDE, () => console.log('游戏进入后台'), this);
    game.on(Game.EVENT_SHOW, () => console.log('游戏进入前台'), this);
    // 设置状态栏颜色
    SocialManager.instance.setStatusBarStyle('white');
    SocialManager.instance.onMemoryWarning(this._onMemoryWarning.bind(this));
  }

  protected async start() {
    this.splashScreen.show();

    try {
      // 初始化网络和登录态
      const authData = await NetManager.instance.init();

      // 初始化广告分析
      AnalysisManager.instance.init(authData.playerId || '', authData.providerAccountId || '', authData.isNew || false);

      // 加载数据
      await Promise.all([this._requestAll(), this._loadAll(this._onProgress.bind(this))]);

      // 加载主界面
      await this._loadMain();
    } catch (e) {
      LogManager.error('[Gameplay#start]', e);
      ToastManager.instance.show('加载资源失败');
    }
  }

  protected onEnable() {
    EventManager.on(EventManager.EventType.START_GAME, this._onStartGame, this);
  }

  protected onDisable() {
    EventManager.off(EventManager.EventType.START_GAME, this._onStartGame, this);
  }

  protected onDestroy() {
    SocialManager.instance.offMemoryWarning(this._onMemoryWarning.bind(this));
  }

  /**
   * 主界面 - 开始游戏
   * @private
   */
  private async _onStartGame(level: NonogramLevel) {
    if (!level.isValid) {
      ToastManager.instance.show('关卡异常');
      return;
    }

    // 体力不足
    if (!UserManager.instance.hasEnergy) {
      await PopupManager.instance.show('MoreEnergyPopup', {});
      // if (result === MoreEnergyResult.Close) return;
      return;
    }

    const result = await PopupManager.instance.show('GameScreen', level);
    if (result === GameResult.Complete) {
      EventManager.emit(EventManager.EventType.LEVEL_COMPLETED, level);
    }
  }

  private async _onProgress(progress: number) {
    await this.splashScreen.onProgress(progress);
  }

  private async _loadMain() {
    const prefab = await ResourceManager.instance.load(MAIN_SCREEN, Prefab);
    const node = instantiate(prefab);
    this.root.addChild(node);
    ResourceManager.instance.release(MAIN_SCREEN);
    await this._onProgress(100);
    // 加载完成，关闭页面
    this.splashScreen.hide();
  }

  /**
   * 请求网络资源
   * @private
   */
  private async _requestAll() {
    // 初始化游戏关卡
    await GameManager.instance.init();
    // 初始化用户信息
    await UserManager.instance.init();
  }

  /**
   * 加载分包资源
   * @private
   */
  private async _loadAll(onProgress: (progress: number) => Promise<void>) {
    return new Promise<void>(async (resolve, reject) => {
      try {
        let finished = 0;

        {
          // 加载弹窗
          for (const popup of popups) {
            const prefab = await this._loadAsset(popup.path, Prefab, finished, RESOURCE_COUNT, onProgress);
            PopupManager.instance.registerPopup(prefab.name, prefab, popup.popupClass, popup.priority, popup.modal);
            finished++;
            // ResourceManager.instance.release(popup.path);
          }
          LogManager.info(`[Gameplay#_loadAll]`, `成功加载${popups.length}个弹窗`);
        }

        {
          const spinner = await this._loadAsset(SPINNER_ASSET, SpriteFrame, finished, RESOURCE_COUNT, onProgress);
          finished++;
          await ToastManager.instance.config({ spinner });
        }

        {
          // 初始化对象池
          finished += POOL_COUNT;
          await Promise.all([
            // ObjectPoolManager.instance.createPool(this.chapterLevelPrefab, {
            //   name: this.chapterLevelPrefab.name,
            //   // 特别篇章最多144关卡
            //   initialSize: 144,
            // }),
            ObjectPoolManager.instance.createPool(this.calendarDayPrefab, {
              name: this.calendarDayPrefab.name,
              // 连续三个月不会超过100天
              initialSize: 100,
            }),
            onProgress(Math.min(Math.max((finished / RESOURCE_COUNT) * 100, 0), 100)),
          ]);
        }

        // 释放内存
        SocialManager.instance.triggerGC();

        resolve();
      } catch (e) {
        reject(e);
      }
    });
  }

  private async _loadAsset<T extends Asset>(
    path: string,
    type: new (...args: never[]) => T,
    finished: number,
    total: number,
    onProgress: (progress: number) => Promise<void>,
  ): Promise<T> {
    const asset = await ResourceManager.instance.load(path, type);
    onProgress(Math.min(Math.max(((finished + 1) / total) * 100, 0), 100)).then();
    return asset;
  }

  /**
   * 监听内存告警
   * @private
   */
  private _onMemoryWarning() {
    SocialManager.instance.triggerGC();
  }
}
