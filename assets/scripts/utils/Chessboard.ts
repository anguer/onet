import { EventTouch, Layout, instantiate, Node, Prefab, Size, UITransform, Vec2, Vec3, math, SpriteFrame } from 'cc';
import { GameBrick } from 'db://assets/scripts/conponents/GameBrick';
import { sleep } from 'db://assets/Framework/lib/Share';
import { ThemeManager } from 'db://assets/scripts/managers/ThemeManager';

// 瓦片类型
export enum TileType {
  Empty = 0,
  Brick = 1,
  Ice = 2,
}

// 移动模式
export enum DropMode {
  None = 0, // 不移动
  Down = 1,
  Up = 2,
  Left = 3,
  Right = 4,
  HorizontalInward = 5, // 左右向内
  HorizontalOutward = 6, // 由内向左右
  VerticalInward = 7, // 上下向内
  VerticalOutward = 8, // 由内向上下
}

// 瓦片信息
export interface TileData {
  row: number;
  col: number;
  type: TileType;
}

// 格子坐标键
export type CellKey = `${number}x${number}`;

/**
 * 棋盘管理类
 */
export class Chessboard {
  private readonly _outUILocation: Vec2 = new Vec2();
  private readonly _outUIPosition: Vec3 = new Vec3();
  private readonly _outPosition: Vec3 = new Vec3();

  // 棋盘网格列数
  private readonly cols: number = 8;
  // 棋盘网格行数
  private readonly rows: number = 14;
  // 棋盘格子的坐标和节点映射，e.g. `1x1` => Node
  private readonly cells: Map<CellKey, Node> = new Map();
  // 控制棋盘UI
  private readonly boardUI: UITransform;
  // 控制棋盘布局
  private readonly boardLayout: Layout;

  constructor(
    // 棋盘节点
    private readonly boardNode: Node,
    // 关卡瓦片二维数组
    private readonly tiles: Array<Array<TileType>>,
    // 砖块预制体
    private readonly brickPrefab: Prefab,
  ) {
    this.boardUI = this.boardNode.getComponent(UITransform) || this.boardNode.addComponent(UITransform);
    this.boardLayout = this.boardNode.getComponent(Layout) || this.boardNode.addComponent(Layout);

    // 验证瓦片信息，确保行列一致

    // 初始化棋盘
    this._initLayout();
    this._initCells();
  }

  /**
   * 初始化瓦片
   */
  public async initTiles() {
    const { bricks, blocks } = this._parseTiles();

    this._createBlocks(blocks);
    await this._createBricks(bricks);
  }

  public async reset() {}

  public checkout(event: EventTouch): CellKey | null {
    const { x, y } = event.getUILocation(this._outUILocation);
    this._outUIPosition.set(x, y);
    const localPos = this.boardUI.convertToNodeSpaceAR(this._outUIPosition, this._outPosition).toVec2();

    // for (const [key, cell] of this.cells) {
    //   if (cell.boundingBox.contains(localPos)) {
    //     return key;
    //   }
    // }
    return null;
  }

  /**
   * 初始化砖块
   * @param bricks
   * @param itemCount
   * @private
   */
  private async _createBricks(bricks: Array<TileData>, itemCount: number = 8): Promise<void> {
    const theme = ThemeManager.instance.selectedTheme;

    for (const brick of bricks) {
      const cell = this.cells.get(`${brick.row}x${brick.col}`);
      if (!cell) {
        continue;
      }

      // 随机一个物品
      const key = math.randomRangeInt(0, theme.bricks.length);
      const sf = theme.bricks[key];
      const tile = this._createBrick(sf);
      cell.addChild(tile);
      await sleep(0.02);
    }
  }

  /**
   * 创建一个砖块
   * @private
   */
  private _createBrick(sf: SpriteFrame): Node {
    const node = instantiate(this.brickPrefab);
    const ui = node.getComponent(UITransform) || node.addComponent(UITransform);
    const item = node.getComponent(GameBrick);
    node.setPosition(Vec3.ZERO);
    ui.setContentSize(this.boardLayout.cellSize);
    item?.init(sf);
    return node;
  }

  /**
   * 初始化阻挡物
   * @param blocks
   * @private
   */
  private _createBlocks(blocks: Array<TileData>): void {
    for (const block of blocks) {
      const cell = this.cells.get(`${block.row}x${block.col}`);
      if (!cell) {
        continue;
      }

      const tile = this._createEmpty(`__Ice_${block.row}_${block.col}__`);
      cell.addChild(tile);
    }
  }

  /**
   * 解析瓦片列表
   * @private
   */
  private _parseTiles(): { bricks: Array<TileData>; blocks: Array<TileData> } {
    const bricks: Array<TileData> = [];
    const blocks: Array<TileData> = [];

    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        const type = this.tiles[row][col];
        switch (type) {
          case TileType.Empty:
            break;
          case TileType.Brick:
            bricks.push({ row, col, type });
            break;
          case TileType.Ice:
            blocks.push({ row, col, type });
            break;
        }
      }
    }

    return { bricks, blocks };
  }

  /**
   * 初始化布局
   * @private
   */
  private _initLayout(): void {
    // 按棋盘宽度和固定列数计算砖块大小
    const size = this.boardUI.width / this.cols;
    const cellSize = new Size(size, size);
    // 计算棋盘高度
    const boardHeight = size * this.rows;
    this.boardUI.setContentSize(this.boardUI.width, boardHeight);

    // 更新布局
    this.boardLayout.type = Layout.Type.GRID;
    this.boardLayout.resizeMode = Layout.ResizeMode.CHILDREN;
    this.boardLayout.startAxis = Layout.AxisDirection.HORIZONTAL;
    // 无间距
    this.boardLayout.spacingX = this.boardLayout.spacingY = 0;
    // 无内边距
    this.boardLayout.paddingTop = this.boardLayout.paddingBottom = this.boardLayout.paddingLeft = this.boardLayout.paddingRight = 0;
    // 限制列数
    this.boardLayout.constraint = Layout.Constraint.FIXED_COL;
    this.boardLayout.constraintNum = this.cols;
    // 格子大小
    this.boardLayout.cellSize = cellSize;
    this.boardLayout.updateLayout();
  }

  /**
   * 初始化棋盘格子映射，数量=rows*cols
   * @private
   */
  private _initCells(): void {
    this.boardNode.removeAllChildren();
    this.cells.clear();

    // 生成棋子坐标
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        const cell = this._createEmpty(`__Cell_${row}_${col}__`);
        this.boardNode.addChild(cell);
        this.cells.set(`${row}x${col}`, cell);
      }
    }
  }

  /**
   * 创建一个空节点
   * @param name
   * @private
   */
  private _createEmpty(name = '__Empty__'): Node {
    const node = new Node(name);
    const ui = node.getComponent(UITransform) || node.addComponent(UITransform);
    ui.setContentSize(this.boardLayout.cellSize);
    return node;
  }
}
