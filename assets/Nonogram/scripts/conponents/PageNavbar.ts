import { _decorator, CCInteger, Component, Layout, screen, UITransform, Widget } from 'cc';
import { EDITOR } from 'cc/env';
import { Device } from 'db://assets/Nonogram/scripts/utils/Device';
const { ccclass, property, executeInEditMode } = _decorator;

@ccclass('PageNavbar')
@executeInEditMode()
export class PageNavbar extends Component {
  @property(CCInteger) private _navbarHeight: number = 84;
  @property(CCInteger)
  private get navbarHeight() {
    return this._navbarHeight;
  }
  private set navbarHeight(value: number) {
    this._navbarHeight = value;
    this.updateArea();
  }

  @property(CCInteger) private _bottom: number = 0;
  @property(CCInteger)
  private get bottom() {
    return this._bottom;
  }
  private set bottom(value: number) {
    this._bottom = value;
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
    const uiTransform = this.node.getComponent(UITransform) || this.node.addComponent(UITransform);
    const widget = this.node.getComponent(Widget) || this.node.addComponent(Widget);
    const layout = this.node.getComponent(Layout) || this.node.addComponent(Layout);

    if (EDITOR) {
      uiTransform.height = this.navbarHeight + this._bottom + 88;
      widget.top = widget.left = widget.right = 0;
      widget.isAlignTop = widget.isAlignLeft = widget.isAlignRight = true;
      widget.isAlignBottom = false;
      layout.type = Layout.Type.VERTICAL;
      layout.resizeMode = Layout.ResizeMode.CHILDREN;
      layout.paddingTop = 88;
      layout.paddingBottom = this._bottom;
      layout.updateLayout();
      return;
    }

    // IMPORTANT: need to update alignment to get the latest position
    widget.updateAlignment();
    layout.updateLayout();
    //
    const visibleSize = Device.instance.visibleSize;
    const screenHeight = visibleSize.height;
    const safeArea = Device.instance.getSafeAreaRect();
    const statusBarHeight = Math.max(60, screenHeight - safeArea.y - safeArea.height);
    uiTransform.height = this.navbarHeight + this._bottom + statusBarHeight;
    widget.isAlignTop = widget.isAlignLeft = widget.isAlignRight = true;
    widget.isAlignBottom = false;
    widget.top = widget.left = widget.right = 0;
    widget.updateAlignment();
    layout.type = Layout.Type.VERTICAL;
    layout.resizeMode = Layout.ResizeMode.CHILDREN;
    layout.paddingTop = statusBarHeight;
    layout.paddingBottom = this._bottom;
    layout.updateLayout();
  }
}
