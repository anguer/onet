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
  public static readonly EventType = {
    SELECT_CHANGE: '__ThemeManager_SELECT_CHANGE__',
  };

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

  private readonly _current: Map<'current', string> = new Map();
  public get selectedTheme(): Theme {
    const selectedId = this._current.get('current');
    if (!selectedId) {
      return this.themes[0];
    }

    return this._themes.get(selectedId) || this.themes[0];
  }

  constructor() {
    this._manager = new Node(`__${this.constructor.name}__`);

    // 添加节点到场景
    director.getScene()?.addChild(this._manager);

    // 标记为常驻节点，这样场景切换的时候就不会被销毁了
    director.addPersistRootNode(this._manager);
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

  public async init() {
    const configs = await ResourceManager.instance.load('themes/themes', JsonAsset);
    if (!configs.json) {
      throw new Error('加载主题配置文件失败');
    }

    if (!Array.isArray(configs.json)) {
      throw new Error('主题配置文件错误');
    }

    if (configs.json.length === 0) {
      throw new Error('主题配置为空');
    }

    const themes = configs.json as Array<ThemeData>;
    const defaultTheme = themes[0];
    this._current.set('current', defaultTheme.id);

    for (const theme of themes) {
      const banner = await ResourceManager.instance.load(theme.banner, SpriteFrame);
      const atlas = await ResourceManager.instance.load(theme.bricks, SpriteAtlas);
      const bricks = this._loadSpriteFramesWithAtlas(atlas);
      this._themes.set(theme.id, { id: theme.id, name: theme.name, banner, bricks });
    }

    LogManager.info('[ThemeManager#init]', '加载主题完成', this.themes.length);
  }

  public selectTheme(id: string) {
    this._current.set('current', id);
    this.emit(ThemeManager.EventType.SELECT_CHANGE, id);
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
