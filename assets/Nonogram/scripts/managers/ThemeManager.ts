import { director, JsonAsset, Node, SpriteAtlas, SpriteFrame } from 'cc';
import { ResourceManager } from 'db://assets/Framework/managers/ResourceManager';
import { LogManager } from 'db://assets/Framework/managers/LogManager';

interface ThemeData {
  id: string;
  name: string;
  banner: string;
  bricks: string;
}

export interface Theme {
  id: string;
  name: string;
  banner: SpriteFrame;
  bricks: Array<SpriteFrame>;
}

export class ThemeManager {
  private static _instance: ThemeManager;

  public static get instance(): ThemeManager {
    if (!this._instance) {
      this._instance = new ThemeManager();
    }
    return this._instance;
  }

  private readonly _manager: Node;
  public get node(): Node {
    return this._manager;
  }

  private readonly _themes: Map<string, Theme> = new Map();
  public get themes(): Array<Theme> {
    const values: Array<Theme> = [];
    for (const [, theme] of this._themes) {
      values.push(theme);
    }
    return values;
  }

  constructor() {
    this._manager = new Node(`__${this.constructor.name}__`);

    // 添加节点到场景
    director.getScene()?.addChild(this._manager);

    // 标记为常驻节点，这样场景切换的时候就不会被销毁了
    director.addPersistRootNode(this._manager);
  }

  public async init() {
    try {
      const configs = await ResourceManager.instance.load('themes/themes', JsonAsset);
      if (!configs.json) {
        LogManager.error('[ThemeManager#init]', '加载主题配置文件失败');
        return;
      }

      const themes = configs.json as Array<ThemeData>;
      for (const theme of themes) {
        const banner = await ResourceManager.instance.load(theme.banner, SpriteFrame);
        const atlas = await ResourceManager.instance.load(theme.bricks, SpriteAtlas);
        const bricks = this._loadSpriteFramesWithAtlas(atlas);
        this._themes.set(theme.id, { id: theme.id, name: theme.name, banner, bricks });
      }

      LogManager.info('[ThemeManager#init]', '加载主题完成', this.themes);
    } catch (e) {
      LogManager.error('[ThemeManager#init]', e);
    }
  }

  private _loadSpriteFramesWithAtlas(atlas: SpriteAtlas): Array<SpriteFrame> {
    const items: Array<SpriteFrame> = [];
    for (let i = 1; i <= 27; i++) {
      const sf = atlas.getSpriteFrame(`item_${i}`);
      if (sf) {
        items.push(sf);
      }
    }
    return items;
  }
}
