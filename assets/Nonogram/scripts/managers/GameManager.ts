import { director, Node } from 'cc';
import { ICalendarMonth, ILevelCompleteResult, IStandardLevel, Nullable } from 'db://assets/Nonogram/scripts/NonogramInterface';
import { LogManager } from 'db://assets/Framework/managers/LogManager';
import { NonogramLevel } from 'db://assets/Nonogram/scripts/models/NonogramLevel';
import { NonogramCalendar } from 'db://assets/Nonogram/scripts/models/NonogramCalendar';
import { NetManager } from 'db://assets/Nonogram/scripts/managers/NetManager';

export class GameManager {
  private static _instance: GameManager;

  public static get instance(): GameManager {
    if (!this._instance) {
      this._instance = new GameManager();
    }
    return this._instance;
  }

  private readonly _manager: Node;
  public get node(): Node {
    return this._manager;
  }

  private _standard: Map<'current', NonogramLevel> = new Map();
  private _calendars: NonogramCalendar[] = [];

  public get standard() {
    return this._standard.get('current');
  }

  public get calendars() {
    return this._calendars;
  }

  constructor() {
    this._manager = new Node(`__${this.constructor.name}__`);

    // 添加节点到场景
    director.getScene()?.addChild(this._manager);

    // 标记为常驻节点，这样场景切换的时候就不会被销毁了
    director.addPersistRootNode(this._manager);
  }

  public async init() {
    const [standardLevel, calendars] = await Promise.all([
      NetManager.instance.get<IStandardLevel | null>('/api/levels/current'),
      NetManager.instance.get<ICalendarMonth[]>('/api/calendars'),
    ]);

    if (standardLevel) {
      this._standard.set('current', NonogramLevel.fromStandard(standardLevel));
    }
    this._calendars = calendars.map((calendar) => new NonogramCalendar(calendar));
  }

  /**
   * 完成关卡
   * @param level
   */
  public async completeLevel(level: NonogramLevel): Promise<Nullable<ILevelCompleteResult>> {
    try {
      return null;
    } catch (e) {
      LogManager.error('[NonogramManager#completeLevel]', e);
      return null;
    }
  }
}
