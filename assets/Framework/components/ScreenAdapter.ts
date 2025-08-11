import { _decorator, Component, ResolutionPolicy, screen, Size, view } from 'cc';
import { LogManager } from 'db://assets/Framework/managers/LogManager';

const { ccclass, property } = _decorator;

@ccclass('ScreenAdapter')
export class ScreenAdapter extends Component {
  public static readonly G_VIEW_SIZE = new Size(0, 0);

  protected onLoad() {
    screen.on('window-resize', this._onResize, this);
  }

  protected start() {
    // 获取屏幕的宽度高度，也就是实际设备的分辨率
    this._resize(screen.windowSize);
  }

  protected onDestroy() {
    screen.off('window-resize', this._onResize, this);
  }

  private _onResize(width: number, height: number) {
    this._resize(new Size(width, height));
  }

  private _resize(windowSize = screen.windowSize) {
    const resolutionPolicy: ResolutionPolicy = view.getResolutionPolicy();
    const designSize = view.getDesignResolutionSize();

    // 是否是屏幕更宽
    const isScreenWidthLarger = windowSize.width / windowSize.height > designSize.width / designSize.height;
    // const targetResolutionPolicy = isScreenWidthLarger ? ResolutionPolicy.SHOW_ALL : ResolutionPolicy.FIXED_WIDTH;
    const targetResolutionPolicy = isScreenWidthLarger ? ResolutionPolicy.FIXED_HEIGHT : ResolutionPolicy.FIXED_WIDTH;
    if (targetResolutionPolicy !== resolutionPolicy.getContentStrategy().strategy) {
      // 保证设计分辨率的内容都能显示出来
      view.setDesignResolutionSize(designSize.width, designSize.height, targetResolutionPolicy);
      view.emit('canvas-resize');
    }

    // 实际的尺寸会和设计分辨率在一个维度，但是宽或高更大
    switch (targetResolutionPolicy) {
      case ResolutionPolicy.FIXED_HEIGHT:
        ScreenAdapter.G_VIEW_SIZE.width = Math.ceil((designSize.height * windowSize.width) / windowSize.height);
        ScreenAdapter.G_VIEW_SIZE.height = designSize.height;
        LogManager.trace('[ScreenAdapter#_resize]', '适配宽度', `${ScreenAdapter.G_VIEW_SIZE.width}x${ScreenAdapter.G_VIEW_SIZE.height}`);
        break;
      case ResolutionPolicy.FIXED_WIDTH:
        ScreenAdapter.G_VIEW_SIZE.width = designSize.width;
        ScreenAdapter.G_VIEW_SIZE.height = Math.ceil((designSize.width * windowSize.height) / windowSize.width);
        LogManager.trace('[ScreenAdapter#_resize]', '适配高度', `${ScreenAdapter.G_VIEW_SIZE.width}x${ScreenAdapter.G_VIEW_SIZE.height}`);
        break;
    }
  }
}
