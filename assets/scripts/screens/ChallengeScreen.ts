import { _decorator, instantiate, PageView, Prefab, Button, CCInteger, Label } from 'cc';
import { LogManager } from 'db://assets/Framework/managers/LogManager';
import { AudioManager } from 'db://assets/Framework/managers/AudioManager';
import { CalendarPage } from 'db://assets/scripts/conponents/CalendarPage';
import EventManager from 'db://assets/scripts/managers/EventManager';
import { GameManager } from 'db://assets/scripts/managers/GameManager';
import { NonogramLevel } from 'db://assets/scripts/models/NonogramLevel';
import { Throttle } from 'db://assets/Framework/decorators/throttle';
import { LevelType } from 'db://assets/scripts/NonogramInterface';
import { BaseScreen } from 'db://assets/scripts/screens/BaseScreen';
const { ccclass, property } = _decorator;

@ccclass('ChallengeScreen')
export class ChallengeScreen extends BaseScreen {
  @property({ type: PageView }) private pageView: PageView;
  @property({ type: Prefab }) private pagePrefab: Prefab;
  @property({ type: Button }) private indicatorPrev: Button;
  @property({ type: Button }) private indicatorNext: Button;
  @property({ type: Button }) private startButton: Button;
  @property({ type: Label }) private month: Label;

  private _challengeTotalPage: number = 0;
  @property({ type: CCInteger, group: { id: 'challenge', name: '挑战' } })
  private get challengeTotalPage(): number {
    return this._challengeTotalPage;
  }

  private _challengePageIndex: number = 0;
  @property({ type: CCInteger, group: { id: 'challenge', name: '挑战' } })
  private get challengePageIndex(): number {
    return this._challengePageIndex;
  }

  private readonly _challengePages: Map<number, CalendarPage> = new Map();

  protected onInit() {
    this._initPages();
  }

  protected onEnable() {
    this.pageView.node.on(PageView.EventType.PAGE_TURNING, this._onPageTurning, this);
    this.indicatorPrev.node.on(Button.EventType.CLICK, this._onPrevPage, this);
    this.indicatorNext.node.on(Button.EventType.CLICK, this._onNextPage, this);
    this.startButton.node.on(Button.EventType.CLICK, this._onStart, this);
    EventManager.on(EventManager.EventType.LEVEL_COMPLETED, this._onLevelCompleted, this);
  }

  protected onDisable() {
    this.pageView.node.off(PageView.EventType.PAGE_TURNING, this._onPageTurning, this);
    this.indicatorPrev.node.off(Button.EventType.CLICK, this._onPrevPage, this);
    this.indicatorNext.node.off(Button.EventType.CLICK, this._onNextPage, this);
    this.startButton.node.off(Button.EventType.CLICK, this._onStart, this);
    EventManager.off(EventManager.EventType.LEVEL_COMPLETED, this._onLevelCompleted, this);
  }

  /**
   * 当切换挑战日历页面时
   * @param pageView
   * @private
   */
  private async _onPageTurning(pageView: PageView) {
    this._challengePageIndex = pageView.curPageIdx;
    this.indicatorPrev.node.active = this._challengePageIndex > 0;
    this.indicatorNext.node.active = this._challengePageIndex < this._challengeTotalPage - 1;
    await this._loadVisiblePages();

    const page = this._challengePages.get(this.challengePageIndex);
    if (page) {
      this.month.string = page.data.name;
    }
  }

  @Throttle()
  private _onPrevPage() {
    AudioManager.instance.playEffect('common/audio/click1');
    const index = Math.max(0, this._challengePageIndex - 1);
    this.pageView.scrollToPage(index);
  }

  @Throttle()
  private _onNextPage() {
    AudioManager.instance.playEffect('common/audio/click1');
    const index = Math.min(this._challengeTotalPage, this._challengePageIndex + 1);
    this.pageView.scrollToPage(index);
  }

  /**
   * 开始游戏（挑战）
   * @private
   */
  @Throttle()
  private _onStart() {
    const page = this._challengePages.get(this.challengePageIndex);
    if (!page) {
      return;
    }

    if (!page.selectedLevel) {
      LogManager.warn('[ChallengeScreen#_onStart]', 'No level selected');
      return;
    }

    AudioManager.instance.playEffect('common/audio/click1');
    EventManager.emit(EventManager.EventType.START_GAME, page.selectedLevel);
  }

  private async _onLevelCompleted(prevLevel: NonogramLevel) {
    if (prevLevel.type !== LevelType.DailyChallenge) return;

    const page = this._challengePages.get(this.challengePageIndex);
    if (!page) return;

    page.completedChallenge(prevLevel);
  }

  /**
   * 初始化挑战页面
   */
  private _initPages() {
    this.pageView.removeAllPages();

    const length = GameManager.instance.calendars.length;
    for (let i = 0; i < length; i++) {
      const calendar = GameManager.instance.calendars[i];
      const node = instantiate(this.pagePrefab);
      const item = node.getComponent(CalendarPage);
      if (!item) {
        node.destroy();
        throw new Error('[ChallengeScreen#_initPages] CalendarPage was not found');
      }

      item.init(calendar);
      this.pageView.addPage(node);
      this._challengePages.set(i, item);
    }

    this._challengeTotalPage = length;
    // 滚动至最新页（不再考虑仅有一个月的情况）
    this.pageView.scrollToPage(Math.max(0, length - 1));
  }

  /**
   * 加载可见页面
   * @private
   */
  private async _loadVisiblePages() {
    const currentPageIndex = this.pageView.curPageIdx;

    // 可见页面索引
    const visiblePageIndexes = [currentPageIndex - 1, currentPageIndex, currentPageIndex + 1];

    // 优先卸载不可见页面
    for (const [index, challengePage] of this._challengePages) {
      if (visiblePageIndexes.includes(index)) {
        continue;
      }
      challengePage.unloadPageContent();
    }

    // 再加载可见页面
    for (const [index, challengePage] of this._challengePages) {
      if (visiblePageIndexes.includes(index)) {
        await challengePage.loadPageContent();
      }
    }
  }
}
