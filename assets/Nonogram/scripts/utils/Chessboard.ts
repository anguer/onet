import { EventTouch, Graphics, Layout, Node, Rect, Size, UITransform, Vec2, Vec3 } from 'cc';
import { Colors } from 'db://assets/Nonogram/scripts/utils/Constants';

export interface Square {
  row: number;
  col: number;
  boundingBox: Rect;
}

export class Chessboard {
  private readonly _outUILocation: Vec2 = new Vec2();
  private readonly _outUIPosition: Vec3 = new Vec3();
  private readonly _outPosition: Vec3 = new Vec3();

  private readonly graphics: Graphics;
  private readonly uiTransform: UITransform;
  private readonly layout: Layout;
  private readonly squares: Array<Square> = [];

  public readonly cellSize: Size;

  constructor(
    private readonly node: Node,
    private readonly gridSize: number,
    private readonly gutter: number = 2,
  ) {
    this.graphics = this.node.getComponent(Graphics) || this.node.addComponent(Graphics);
    this.uiTransform = this.node.getComponent(UITransform) || this.node.addComponent(UITransform);
    this.layout = this.node.getComponent(Layout) || this.node.addComponent(Layout);

    // 计算格子大小（减去间隔）
    const padding = (gridSize + 1) * gutter;
    this.cellSize = new Size((this.uiTransform.width - padding) / gridSize, (this.uiTransform.height - padding) / gridSize);

    // 初始化棋盘
    this._init(this.gridSize, this.gutter);
    this._initLayout(this.gridSize, this.gutter);
    this._initSquares(this.gridSize, this.gutter);
  }

  public clear() {
    this.graphics.clear();
    this.squares.length = 0;
  }

  public checkout(event: EventTouch): Square | null {
    const { x, y } = event.getUILocation(this._outUILocation);
    this._outUIPosition.set(x, y);
    const localPos = this.uiTransform.convertToNodeSpaceAR(this._outUIPosition, this._outPosition).toVec2();

    const len = this.squares.length;
    for (let i = 0; i < len; i++) {
      if (this.squares[i].boundingBox.contains(localPos)) {
        return this.squares[i];
      }
    }
    return null;
  }

  /**
   * 绘制棋盘
   * @param gridSize - e.g. 10、15、20
   * @param gutter - e.g. 2、4
   * @private
   */
  private _init(gridSize: number, gutter: number): void {
    // 设置原点为左上角
    this.uiTransform.anchorX = 0;
    this.uiTransform.anchorY = 1;

    // 清理之前内容
    this.clear();

    // 粗线和细线宽度
    const wideLine = 4;
    // const thinLine = 2.8;

    // 绘制背景（由于原点位于左上角，所以高度为负数）
    // this.graphics.fillColor = Colors.white;
    // this.graphics.roundRect(0, 0, this.uiTransform.width, -this.uiTransform.height, 8);
    // this.graphics.fill();

    // 绘制网格线（由于原点位于左上角，所以Y轴坐标始终为负数）
    this.graphics.strokeColor = Colors.GUIDELINE;
    for (let i = 1; i < gridSize; i++) {
      let offset: number;
      if (i % 5 === 0) {
        this.graphics.lineWidth = wideLine;
        offset = Math.abs(wideLine - gutter) / 2;
      } else {
        // this.graphics.lineWidth = thinLine;
        // offset = Math.abs(thinLine - gutter) / 2;
        continue;
      }

      const w = this.cellSize.width + gutter;
      const h = this.cellSize.height + gutter;
      // 纵线
      this.graphics.moveTo(i * w + offset, 0);
      this.graphics.lineTo(i * w + offset, -this.uiTransform.height);
      // 横线
      this.graphics.moveTo(0, i * -h - offset);
      this.graphics.lineTo(this.uiTransform.width, i * -h - offset);
      // 绘制
      this.graphics.stroke();
    }
  }

  private _initLayout(gridSize: number, gutter: number) {
    // 更新布局
    this.layout.resizeMode = Layout.ResizeMode.CHILDREN;
    this.layout.startAxis = Layout.AxisDirection.HORIZONTAL;
    this.layout.spacingX = this.layout.spacingY = this.layout.paddingTop = this.layout.paddingLeft = gutter;
    this.layout.constraint = Layout.Constraint.FIXED_COL;
    this.layout.constraintNum = gridSize;
    this.layout.cellSize = this.cellSize;
    this.layout.updateLayout();
  }

  private _initSquares(gridSize: number, gutter: number) {
    const halfGutter = gutter / 2;
    // this.graphics.fillColor = Colors.CHESS_PIECE_BACKGROUND;

    // 生成棋子坐标
    for (let row = 0; row < gridSize; row++) {
      // 每行的Y坐标
      const y = row * -(this.cellSize.height + gutter) - gutter - this.cellSize.height;
      for (let col = 0; col < gridSize; col++) {
        // 每列的X坐标
        const x = col * (this.cellSize.width + gutter) + gutter;
        // 添加包围盒
        this.squares.push({
          row,
          col,
          boundingBox: new Rect(x - halfGutter, y - halfGutter, this.cellSize.width + halfGutter, this.cellSize.height + halfGutter),
        });

        // this.graphics.roundRect(x, y, this.cellSize.width, this.cellSize.height, 8);
      }
    }

    // this.graphics.fill();
  }
}
