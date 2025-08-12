import { _decorator, CCInteger, Component, screen, Widget } from 'cc';
import { EDITOR } from 'cc/env';
import { Device } from 'db://assets/scripts/utils/Device';
const { ccclass, property, executeInEditMode } = _decorator;

@ccclass('PageContainer')
@executeInEditMode()
export class PageContainer extends Component {
  @property(CCInteger) private _navbarHeight: number = 84;
  @property(CCInteger)
  private get navbarHeight() {
    return this._navbarHeight;
  }
  private set navbarHeight(value: number) {
    this._navbarHeight = value;
    this.updateArea();
  }

  public onEnable(): void {
    this.updateArea();
    // IDEA: need to delay the callback on Native platform ?
    screen.on('window-resize', this.updateArea, this);
    screen.on('orientation-change', this.updateArea, this);
  }

  public onDisable(): void {
    screen.off('window-resize', this.updateArea, this);
    screen.off('orientation-change', this.updateArea, this);
  }

  /**
   * @en Adapt to safe area.
   * @zh 立即适配安全区域。
   * @method updateArea
   */
  public updateArea(): void {
    const widget = this.node.getComponent(Widget) || this.node.addComponent(Widget);

    if (EDITOR) {
      widget.bottom = widget.left = widget.right = 0;
      widget.top = this._navbarHeight + 88;
      widget.isAlignBottom = widget.isAlignTop = widget.isAlignLeft = widget.isAlignRight = true;
      return;
    }

    // IMPORTANT: need to update alignment to get the latest position
    widget.updateAlignment();
    //
    widget.isAlignBottom = widget.isAlignTop = widget.isAlignLeft = widget.isAlignRight = true;
    const visibleSize = Device.instance.visibleSize;
    const screenHeight = visibleSize.height;
    const safeArea = Device.instance.getSafeAreaRect();
    widget.bottom = widget.left = widget.right = 0;
    widget.top = this._navbarHeight + Math.max(60, screenHeight - safeArea.y - safeArea.height);
    widget.updateAlignment();
  }
}
