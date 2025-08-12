import { _decorator, instantiate, Prefab, ScrollView } from 'cc';
import { BaseScreen } from 'db://assets/scripts/screens/BaseScreen';
import { ThemeManager } from 'db://assets/scripts/managers/ThemeManager';
import { ThemeItem } from 'db://assets/scripts/conponents/ThemeItem';

const { ccclass, property } = _decorator;

@ccclass('ThemeScreen')
export class ThemeScreen extends BaseScreen {
  @property(ScrollView) private scrollView: ScrollView;
  @property(Prefab) private itemPrefab: Prefab;

  private readonly _chapterItems: Map<string, ThemeItem> = new Map();

  protected onInit() {
    this._initThemes();
  }

  private _initThemes() {
    if (!this.scrollView.content) return;

    // clean
    this.scrollView.content.removeAllChildren();

    const length = ThemeManager.instance.themes.length;
    for (let i = 0; i < length; i++) {
      const theme = ThemeManager.instance.themes[i];
      const node = instantiate(this.itemPrefab);
      const item = node.getComponent(ThemeItem);
      if (!item) {
        node.destroy();
        throw new Error('[ThemeScreen#_loadChapters] ChapterItem not found');
      }

      item.init(theme);
      this._chapterItems.set(theme.id, item);
      this.scrollView.content.addChild(node);
    }
  }
}
