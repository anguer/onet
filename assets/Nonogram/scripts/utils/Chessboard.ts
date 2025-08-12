import { EventTouch, Layout, instantiate, Node, Prefab, Rect, Size, UITransform, Vec2, Vec3, math } from 'cc';
import { GameBrick } from 'db://assets/Nonogram/scripts/conponents/GameBrick';
import { sleep } from 'db://assets/Framework/lib/Share';
import { ThemeManager } from 'db://assets/Nonogram/scripts/managers/ThemeManager';

export interface Square {
  row: number;
  col: number;
  boundingBox: Rect;
}

export enum CellType {
  Empty = 0,
  Brick = 1,
  Ice = 2,
}

// 限制列数
const CONSTRAINT_COLS = 8;

export class Chessboard {
  private readonly _outUILocation: Vec2 = new Vec2();
  private readonly _outUIPosition: Vec3 = new Vec3();
  private readonly _outPosition: Vec3 = new Vec3();

  private readonly board: UITransform;
  private readonly layout: Layout;
  private readonly squares: Array<Square> = [];

  public readonly brickSize: Size;
  public readonly rows: number;
  public readonly cols: number;

  constructor(
    private readonly grid: Node,
    private readonly cells: Array<Array<CellType>>,
    private readonly itemPrefab: Prefab,
  ) {
    this.board = this.grid.getComponent(UITransform) || this.grid.addComponent(UITransform);
    this.layout = this.grid.getComponent(Layout) || this.grid.addComponent(Layout);

    this.rows = this.cells.length;
    this.cols = this.cells[0].length || 0;

    // 按棋盘宽度和固定列数计算砖块大小
    const size = this.board.width / CONSTRAINT_COLS;
    // 计算棋盘高度
    const boardHeight = size * this.rows;
    this.board.setContentSize(this.board.width, boardHeight);
    this.brickSize = new Size(size, size);

    // 初始化棋盘
    this._clear();
    this._initLayout();
    this._initCells();
  }

  public async initBricks() {
    for (let i = 0; i < this.rows; i++) {
      for (let j = 0; j < this.cols; j++) {
        const cell = this.cells[i][j];
        switch (cell) {
          case CellType.Empty:
            this._createEmpty();
            break;
          case CellType.Brick:
            this._createBrick();
            await sleep(0.05);
            break;
          case CellType.Ice:
            this._createEmpty();
            break;
        }
      }
    }
  }

  public async reset() {
    this._clear();
    await this.initBricks();
  }

  public checkout(event: EventTouch): Square | null {
    const { x, y } = event.getUILocation(this._outUILocation);
    this._outUIPosition.set(x, y);
    const localPos = this.board.convertToNodeSpaceAR(this._outUIPosition, this._outPosition).toVec2();

    const len = this.squares.length;
    for (let i = 0; i < len; i++) {
      if (this.squares[i].boundingBox.contains(localPos)) {
        return this.squares[i];
      }
    }
    return null;
  }

  private _clear() {
    this.grid.removeAllChildren();
  }

  private _initLayout() {
    // 更新布局
    this.layout.type = Layout.Type.GRID;
    this.layout.resizeMode = Layout.ResizeMode.CHILDREN;
    this.layout.startAxis = Layout.AxisDirection.HORIZONTAL;
    // 无间距
    this.layout.spacingX = this.layout.spacingY = 0;
    // 无内边距
    this.layout.paddingTop = this.layout.paddingBottom = this.layout.paddingLeft = this.layout.paddingRight = 0;
    // 限制列数
    this.layout.constraint = Layout.Constraint.FIXED_COL;
    this.layout.constraintNum = CONSTRAINT_COLS;
    // 格子大小
    this.layout.cellSize = this.brickSize;
    this.layout.updateLayout();
  }

  private _initCells() {
    this.squares.length = 0;
    // 生成棋子坐标
    for (let row = 0; row < this.rows; row++) {
      // 每行的Y坐标
      const y = row * -this.brickSize.height - this.brickSize.height;
      for (let col = 0; col < this.cols; col++) {
        // 每列的X坐标
        const x = col * this.brickSize.width;
        // 添加包围盒
        this.squares.push({
          row,
          col,
          boundingBox: new Rect(x, y, this.brickSize.width, this.brickSize.height),
        });
      }
    }
  }

  private _createBrick() {
    const node = instantiate(this.itemPrefab);
    const ui = node.getComponent(UITransform) || node.addComponent(UITransform);
    ui.setContentSize(this.brickSize);
    const item = node.getComponent(GameBrick);
    if (!item) {
      node.destroy();
      throw new Error('[Chessboard#_createBrick] GameBrick not found');
    }

    const theme = ThemeManager.instance.selectedTheme;
    const key = math.randomRangeInt(0, theme.bricks.length);
    item.init(theme.bricks[key]);
    this.grid.addChild(node);
    return node;
  }

  private _createEmpty() {
    const node = new Node('__Empty__');
    const ui = node.getComponent(UITransform) || node.addComponent(UITransform);
    ui.setContentSize(this.brickSize);
    this.grid.addChild(node);
    return node;
  }
}
