import { _decorator, Component, Sprite, SpriteFrame } from 'cc';

const { ccclass, property } = _decorator;

@ccclass('ThemeBrick')
export class ThemeBrick extends Component {
  @property(Sprite) private image: Sprite;

  public init(spriteFrame: SpriteFrame) {
    this.image.spriteFrame = spriteFrame;
  }
}
