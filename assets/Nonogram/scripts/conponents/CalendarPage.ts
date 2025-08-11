import { _decorator, Component, Node, Prefab, UITransform } from 'cc';
import { dayjs } from 'db://assets/Nonogram/scripts/utils/Dayjs';
import { CalendarDay } from 'db://assets/Nonogram/scripts/conponents/CalendarDay';
import { NonogramLevel } from 'db://assets/Nonogram/scripts/models/NonogramLevel';
import { ObjectPoolManager } from 'db://assets/Framework/managers/ObjectPoolManager';
import { CommonEvent } from 'db://assets/Nonogram/scripts/utils/CommonEvent';
import { NonogramCalendar } from 'db://assets/Nonogram/scripts/models/NonogramCalendar';
import { LevelStatus } from 'db://assets/Nonogram/scripts/NonogramInterface';

const { ccclass, property } = _decorator;

@ccclass('CalendarPage')
export class CalendarPage extends Component {
  @property(Node) private grid: Node;
  @property(Prefab) private cellPrefab: Prefab;

  private readonly _calendar: Map<'current', NonogramCalendar> = new Map();
  private readonly _challenges: Map<string, CalendarDay> = new Map();

  public get data(): NonogramCalendar {
    return this._calendar.get('current')!;
  }

  private _selectedLevel: NonogramLevel | null = null;
  public get selectedLevel() {
    return this._selectedLevel;
  }

  protected onEnable() {
    this.grid.on(CalendarDay.EventType.TOUCH_END, this._onTouchEnd, this);
  }

  protected onDisable() {
    this.grid.off(CalendarDay.EventType.TOUCH_END, this._onTouchEnd, this);
  }

  private _onTouchEnd(event: CommonEvent<NonogramLevel>) {
    event.propagationStopped = true;

    if (event.detail === this.selectedLevel) return;
    this._onLevelSelected(event.detail);
  }

  private _onLevelSelected(selectedLevel: NonogramLevel) {
    this._selectedLevel = selectedLevel;
    for (const [challengeId, cell] of this._challenges) {
      cell.setActive(challengeId === selectedLevel.id);
    }
  }

  public init(calendar: NonogramCalendar) {
    this._calendar.set('current', calendar);
    this._challenges.clear();
    this._selectedLevel = null;

    this.grid.removeAllChildren();
  }

  /**
   * 加载页面内容（日历）
   */
  public async loadPageContent() {
    if (this._challenges.size > 0) {
      return;
    }

    const calendar = this._calendar.get('current');
    if (!calendar) {
      return;
    }

    // 本月第一天是星期几，从0(星期天)到6(星期六)
    const firstDay = dayjs(calendar.date).day();

    // 填充空格子
    for (let i = 0; i < firstDay; i++) {
      this._createEmptyCell();
    }

    // 填充日期
    await this._loadChallenges(calendar);
  }

  /**
   * 卸载页面内容（日历）
   */
  public unloadPageContent() {
    if (this._challenges.size === 0) {
      return;
    }

    const calendar = this._calendar.get('current');
    if (!calendar) {
      return;
    }

    this._unloadChallenges(calendar);
  }

  /**
   * 完成关卡后，更新UI
   * @param level
   */
  public completedChallenge(level: NonogramLevel) {
    const calendar = this._calendar.get('current');
    if (!calendar) return;

    calendar.complete(level);

    this._updateStatus();
  }

  /**
   * 更新默认选中状态和挑战进度
   * @private
   */
  private _updateStatus() {
    const calendar = this._calendar.get('current');
    if (!calendar) return;

    const uncompleted: NonogramLevel[] = [];
    const completed: NonogramLevel[] = [];
    for (const level of calendar.levels) {
      if (level.status === LevelStatus.Locked) {
        continue;
      }

      if (level.status === LevelStatus.Completed) {
        completed.push(level);
      } else {
        uncompleted.push(level);
      }
    }

    // 未完成且在今天（含）之前的挑战
    const uncompletedList = uncompleted.sort((a, b) => dayjs(b.date).date() - dayjs(a.date).date());

    // 切换选择
    if (uncompletedList.length > 0) {
      this._onLevelSelected(uncompletedList[0]);
    } else if (completed.length > 0) {
      this._onLevelSelected(completed[0]);
    }
  }

  /**
   * 创建空格子
   * @private
   */
  private _createEmptyCell() {
    const node = new Node('__Empty__');
    if (!node.getComponent(UITransform)) {
      node.addComponent(UITransform);
    }
    this.grid.addChild(node);
  }

  private async _loadChallenges(calendar: NonogramCalendar) {
    const levels = await calendar.loadLevels();
    for (const level of levels) {
      const node = ObjectPoolManager.instance.get(this.cellPrefab.name);
      if (!node) {
        break;
      }

      const cell = node.getComponent(CalendarDay);
      if (!cell) {
        ObjectPoolManager.instance.put(this.cellPrefab.name, node);
        throw new Error('[NonogramChallengePage#_loadChallenges] NonogramCalendarDay not found');
      }

      cell.init(level);
      this._challenges.set(level.id, cell);
      this.grid.addChild(node);
    }

    this._updateStatus();
  }

  private _unloadChallenges(calendar: NonogramCalendar) {
    this._challenges.forEach((cell) => {
      // cell.clear();
      ObjectPoolManager.instance.put(this.cellPrefab.name, cell.node);
    });
    this._challenges.clear();
    // 清理空占位节点
    this.grid.removeAllChildren();
  }
}
