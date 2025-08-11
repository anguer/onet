import { Canvas, director, Node, view, tween, UITransform, Graphics, Label, Tween, Vec3, Color, BlockInputEvents, UIOpacity, SpriteFrame, Sprite } from 'cc';
import { createFullscreenNode } from 'db://assets/Framework/lib/Node';
import { LogManager } from 'db://assets/Framework/managers/LogManager';
import { TweenUtils } from 'db://assets/Framework/lib/TweenUtils';

export class ToastManager {
  private static _instance: ToastManager;

  public static get instance(): ToastManager {
    if (!this._instance) {
      this._instance = new ToastManager();
    }
    return this._instance;
  }

  private readonly _manager: Node;
  private readonly _content: Node;
  private readonly _mask: Node;
  private readonly _spinner: Node;
  private readonly _designSize = view.getDesignResolutionSize();

  private readonly _fromPosition: Vec3 = new Vec3(0, this._designSize.height * 0.25, 0);
  private readonly _toPosition: Vec3 = new Vec3(0, this._designSize.height * 0.35, 0);
  private readonly _startAngle: Vec3 = new Vec3(0, 0, 0);
  private readonly _endAngle: Vec3 = new Vec3(0, 0, -360);

  constructor() {
    // 创建根节点
    this._manager = createFullscreenNode(`__${this.constructor.name}__`);
    this._manager.addComponent(Canvas);

    // 添加根节点到场景
    director.getScene()?.addChild(this._manager);

    // 标记根节点为常驻节点，这样场景切换的时候就不会被销毁了
    director.addPersistRootNode(this._manager);

    this._mask = this._createMask();

    this._content = createFullscreenNode('__Content__', this._manager);

    // spinner
    this._spinner = this._createSpinner();
    this._spinner.setParent(this._content);
  }

  public async config({ spinner }: { spinner: SpriteFrame }): Promise<void> {
    const sprite = this._spinner.getComponent(Sprite) || this._spinner.addComponent(Sprite);
    sprite.sizeMode = Sprite.SizeMode.CUSTOM;
    sprite.trim = false;
    sprite.color = new Color(0, 255, 200);
    sprite.spriteFrame = spinner;
  }

  public show(message: string, options: { width?: number; height?: number; fontSize?: number } = {}): void {
    try {
      const { width = 600, height = 80, fontSize = 28 } = options;

      // toast
      const toast = this._createNode('toast', width, height);
      const graphics = toast.addComponent(Graphics);
      graphics.fillColor = new Color(0, 0, 0, 127);
      graphics.roundRect(-(width / 2), -(height / 2), width, height, 16);
      graphics.fill();

      // text
      const text = this._createNode('text', width, height);
      const label = text.addComponent(Label);
      label.string = message;
      label.fontSize = label.lineHeight = fontSize;
      label.color = Color.WHITE;
      label.enableWrapText = false;
      label.overflow = Label.Overflow.SHRINK;
      label.verticalAlign = Label.VerticalAlign.CENTER;
      label.horizontalAlign = Label.HorizontalAlign.CENTER;
      text.setParent(toast);

      tween(toast).set({ parent: this._content, position: this._fromPosition }).delay(0.5).to(0.5, { position: this._toPosition }).destroySelf().start();
    } catch (e) {
      LogManager.error('[ToastManager#show]', e);
    }
  }

  public showLoading() {
    if (this._spinner.active) return;

    this._mask.active = true;
    TweenUtils.fadeIn(this._mask, 0.3).then().catch();
    tween(this._spinner)
      .set({ active: true, eulerAngles: this._startAngle })
      .repeatForever(tween(this._spinner).to(0.8, { eulerAngles: this._endAngle }).set({ eulerAngles: this._startAngle }))
      .start();
  }

  public hideLoading() {
    Tween.stopAllByTarget(this._spinner);
    TweenUtils.fadeOut(this._mask, 0.2).then().catch();
    this._spinner.active = false;
  }

  private _createMask(): Node {
    // 创建遮罩
    const mask = createFullscreenNode('__Mask__', this._manager);
    // 阻止穿透
    mask.addComponent(BlockInputEvents);
    // 绘制背景
    const transform = mask.getComponent(UITransform) || mask.addComponent(UITransform);
    const graphics = mask.getComponent(Graphics) || mask.addComponent(Graphics);
    graphics.clear();
    graphics.fillColor = new Color(0, 0, 0, 100);
    graphics.fillRect(-transform.width / 2, -transform.height / 2, transform.width, transform.height);
    // 添加半透明背景
    const modalBgOpacity = mask.addComponent(UIOpacity);
    modalBgOpacity.opacity = 0;
    // 默认禁用
    mask.active = false;
    return mask;
  }

  private _createSpinner() {
    const spinner = this._createNode('__Spinner__', 100, 100);
    spinner.setPosition(0, 0);

    // 默认关闭
    spinner.active = false;

    return spinner;
  }

  private _createNode(name: string, width: number, height: number): Node {
    const node = new Node(name);
    const uiTransform = node.getComponent(UITransform) || node.addComponent(UITransform);
    uiTransform.setContentSize(width, height);
    return node;
  }
}
