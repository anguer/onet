import { _decorator, Component, EventTouch, Label, instantiate, Node, Prefab, Sprite, SpriteFrame } from 'cc';
import { Throttle } from 'db://assets/Framework/decorators/throttle';
import { AudioManager } from 'db://assets/Framework/managers/AudioManager';
import { Theme } from 'db://assets/Nonogram/scripts/managers/ThemeManager';
import { ThemeBrick } from 'db://assets/Nonogram/scripts/conponents/ThemeBrick';

const { ccclass, property } = _decorator;

@ccclass('ThemeItem')
export class ThemeItem extends Component {
  @property(Label) private title: Label;
  @property(Sprite) private banner: Sprite;
  @property(Label) private progress: Label;
  @property(Node) private bricks: Node;
  @property(Prefab) private itemPrefab: Prefab;

  private _data: Theme | null = null;

  protected onEnable() {
    this.node.on(Node.EventType.TOUCH_END, this._onTouchEnd, this);
  }

  protected onDisable() {
    this.node.off(Node.EventType.TOUCH_END, this._onTouchEnd, this);
  }

  @Throttle()
  private async _onTouchEnd(event: EventTouch) {
    event.propagationStopped = true;
    if (!this._data) return;

    AudioManager.instance.playEffect('common/audio/click1');
  }

  public init(data: Theme) {
    this._data = data;
    this.title.string = data.name;
    this.banner.spriteFrame = data.banner;
    this.progress.string = '已解锁';
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
}
