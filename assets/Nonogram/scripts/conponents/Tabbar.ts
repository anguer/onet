import { _decorator, Component, Node, PageView } from 'cc';
import { TabbarItem } from 'db://assets/Nonogram/scripts/conponents/TabbarItem';
import { CommonEvent } from 'db://assets/Nonogram/scripts/utils/CommonEvent';
import { TweenUtils } from 'db://assets/Framework/lib/TweenUtils';
import { BaseScreen } from 'db://assets/Nonogram/scripts/screens/BaseScreen';

const { ccclass, property } = _decorator;

@ccclass('Tabbar')
export class Tabbar extends Component {
  @property(TabbarItem) private itemHome: TabbarItem;
  @property(TabbarItem) private itemChallenge: TabbarItem;
  @property(TabbarItem) private itemTheme: TabbarItem;
  @property(Node) private thumb: Node;
  @property(PageView) private tabViews: PageView;

  private get tabs() {
    return [this.itemHome, this.itemChallenge, this.itemTheme];
  }

  protected start() {
    this._selectedTab(0);
  }

  protected onEnable() {
    this.scheduleOnce(() => {
      // 禁用 PageView 默认的触摸滑动翻页行为
      this.tabViews.node.off(Node.EventType.TOUCH_START, this.tabViews['_onTouchBegan'], this.tabViews, true);
      this.tabViews.node.off(Node.EventType.TOUCH_MOVE, this.tabViews['_onTouchMoved'], this.tabViews, true);
      this.tabViews.node.off(Node.EventType.TOUCH_END, this.tabViews['_onTouchEnded'], this.tabViews, true);
      this.tabViews.node.off(Node.EventType.TOUCH_CANCEL, this.tabViews['_onTouchCancelled'], this.tabViews, true);
    }, 0.5);

    this.node.on(TabbarItem.EventType.SELECT, this._onTabItemSelected, this);
    this.tabViews.node.on(PageView.EventType.PAGE_TURNING, this._onPageTurning, this);
  }

  protected onDisable() {
    this.node.off(TabbarItem.EventType.SELECT, this._onTabItemSelected, this);
    this.tabViews.node.off(PageView.EventType.PAGE_TURNING, this._onPageTurning, this);
  }

  /**
   * 切换Tab
   * @param event
   * @private
   */
  private _onTabItemSelected(event: CommonEvent<TabbarItem>) {
    const index = this.tabs.indexOf(event.detail);
    if (index >= 0 && index !== this.tabViews.curPageIdx) {
      this._selectedTab(index);
    }
  }

  /**
   * 当切Tab页时
   * @param pageView
   * @private
   */
  private async _onPageTurning(pageView: PageView) {
    const pages = this.tabViews.getPages();
    for (let i = 0; i < pages.length; i++) {
      pages[i].emit(BaseScreen.EventType.VISIBLE, i === pageView.curPageIdx);
    }
  }

  private _selectedTab(index: number) {
    this.tabViews.scrollToPage(index);
    TweenUtils.move(this.thumb, 0.18, this.thumb.position, this.tabs[index].node.position).then();
    for (let i = 0; i < this.tabs.length; i++) {
      this.tabs[i].active = i === index;
    }
  }
}
