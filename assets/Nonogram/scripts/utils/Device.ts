import { Rect, screen, Size, sys, view } from 'cc';
import { LogManager } from 'db://assets/Framework/managers/LogManager';

interface SafaArea {
  top: number;
  left: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
}

export class Device {
  private static _instance: Device;

  public static get instance(): Device {
    if (!this._instance) {
      this._instance = new Device();
    }
    return this._instance;
  }

  private readonly _platform = sys.platform;
  // 视图窗口可见区域尺寸
  private readonly _visibleSize: Size = view.getVisibleSize();
  public get visibleSize(): Size {
    return this._visibleSize;
  }
  // 设备的物理像素分辨率与 CSS 像素分辨率之比
  private readonly _devicePixelRatio: number = screen.devicePixelRatio;
  // 横轴的缩放比，这个缩放比是将画布像素分辨率缩放到设计分辨率的比例
  private readonly _scaleX: number = view.getScaleX();
  private readonly _scaleFactor: number = this._scaleX / this._devicePixelRatio;

  // 当前窗口的物理像素尺寸
  private readonly _windowSize: Size;

  private readonly _safeArea: SafaArea;

  constructor() {
    switch (this._platform) {
      case sys.Platform.WECHAT_GAME:
        const windowInfo = wx.getWindowInfo();
        this._windowSize = new Size(
          // 较小的为宽
          Math.min(windowInfo.screenWidth, windowInfo.screenHeight),
          // 较大的为高
          Math.max(windowInfo.screenWidth, windowInfo.screenHeight),
        );
        this._safeArea = this._convertSafeAreaToPortrait(windowInfo.safeArea, this._windowSize);
        break;
      case sys.Platform.BYTEDANCE_MINI_GAME:
      default:
        this._windowSize = new Size(this._visibleSize.width * this._scaleFactor, this._visibleSize.height * this._scaleFactor);
        this._safeArea = this._convertSafeAreaRectToSize(sys.getSafeAreaRect(false), this._windowSize);
        break;
    }
  }

  /**
   * 获取基于游戏视图坐标系的屏幕安全区域（设计分辨率为单位）
   */
  public getSafeAreaRect(): Rect {
    const x = this._safeArea.left / this._scaleFactor;
    const y = (this._windowSize.height - this._safeArea.bottom) / this._scaleFactor;
    const width = this._safeArea.width / this._scaleFactor;
    const height = this._safeArea.height / this._scaleFactor;
    return new Rect(x, y, width, height);
  }

  /**
   * 将 safeArea 强制转换为竖屏
   * @param safeArea
   * @param windowSize
   * @private
   */
  private _convertSafeAreaToPortrait(safeArea: SafaArea, windowSize: Size): SafaArea {
    LogManager.trace('[Device#_convertSafeAreaToPortrait]', safeArea);
    // 如果安全区域宽度大于高度（设备横屏），则互换对应属性
    if (safeArea.width > safeArea.height) {
      // 以下几项需处理差值
      const right = windowSize.width - (windowSize.height - safeArea.right);
      const width = windowSize.width - (windowSize.height - safeArea.width);
      const bottom = windowSize.height - (windowSize.width - safeArea.bottom);
      const height = windowSize.height - (windowSize.width - safeArea.height);
      const top = Math.max(0, bottom - height);
      const left = Math.max(0, right - width);
      return { top, left, right, width, bottom, height };
    } else {
      return safeArea;
    }
  }

  /**
   * 转换 SafeArea 格式
   * @param rect
   * @param windowSize
   * @private
   */
  private _convertSafeAreaRectToSize(rect: Rect, windowSize: Size): SafaArea {
    LogManager.trace('[Device#_convertSafeAreaRectToSize]', rect);
    const left = rect.x * this._scaleFactor;
    const top = windowSize.height - (rect.y + rect.height) * this._scaleFactor;
    const width = rect.width * this._scaleFactor;
    const height = rect.height * this._scaleFactor;
    const right = left + width;
    const bottom = top + height;
    return { top, left, right, bottom, height, width };
  }
}
