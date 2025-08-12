import { _decorator, Component, EventTouch, Label, instantiate, Node, Prefab, Sprite, SpriteFrame, Button, Color } from 'cc';
import { Throttle } from 'db://assets/Framework/decorators/throttle';
import { AudioManager } from 'db://assets/Framework/managers/AudioManager';
import { Theme, ThemeManager } from 'db://assets/Nonogram/scripts/managers/ThemeManager';
import { ThemeBrick } from 'db://assets/Nonogram/scripts/conponents/ThemeBrick';

const { ccclass, property } = _decorator;

@ccclass('ThemeItem')
export class ThemeItem extends Component {
  @property(Label) private title: Label;
  @property(Sprite) private frame: Sprite;
  @property(Sprite) private banner: Sprite;
  @property(Label) private progress: Label;
  @property(Node) private bricks: Node;
  @property(Prefab) private itemPrefab: Prefab;

  private _data: Theme | null = null;

  protected onEnable() {
    this.node.on(Button.EventType.CLICK, this._onClicked, this);
    ThemeManager.instance.on(ThemeManager.EventType.SELECT_CHANGE, this._onSelectChanged, this);
  }

  protected onDisable() {
    this.node.off(Button.EventType.CLICK, this._onClicked, this);
    ThemeManager.instance.on(ThemeManager.EventType.SELECT_CHANGE, this._onSelectChanged, this);
  }

  @Throttle()
  private async _onClicked(event: EventTouch) {
    event.propagationStopped = true;
    if (!this._data) return;

    AudioManager.instance.playEffect('common/audio/click1');
    ThemeManager.instance.selectTheme(this._data.id);
  }

  private _onSelectChanged() {
    this._updateUI();
  }

  public init(data: Theme) {
    this._data = data;
    this.title.string = data.name;
    this.banner.spriteFrame = data.banner;
    this._updateUI();
    this._initBricks(data.bricks);
  }

  private _initBricks(spriteFrames: Array<SpriteFrame>) {
    this.bricks.removeAllChildren();

    for (const spriteFrame of spriteFrames) {
      const node = instantiate(this.itemPrefab);
      const item = node.getComponent(ThemeBrick);
      if (!item) {
        node.destroy();
        throw new Error('[ThemeItem#_initBricks] BrickItem not found');
      }

      item.init(spriteFrame);
      this.bricks.addChild(node);
    }
  }

  private _updateUI() {
    if (!this._data) return;

    if (this._data.id === ThemeManager.instance.selectedTheme.id) {
      this.title.color = Color.WHITE;
      this.frame.color = new Color(100, 117, 254);
      this.progress.string = '使用中';
    } else {
      this.title.color = new Color(16, 23, 46);
      this.frame.color = Color.WHITE;
      this.progress.string = '已解锁';
    }
  }
}
