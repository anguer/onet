import { EventTouch, Layout, instantiate, Node, Prefab, Size, UITransform, Vec2, Vec3, SpriteFrame } from 'cc';
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

export interface LevelData {
  dropMode: DropMode;
  itemCount: number;
  tiles: Array<Array<TileType>>;
}

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

  // 当前棋盘状态信息
  private readonly tiles: Array<Array<TileType>>;
  // 第一次选择的砖块
  private firstSelection: { row: number; col: number } | null = null;

  constructor(
    // 棋盘节点
    private readonly boardNode: Node,
    private readonly data: LevelData,
    // 砖块预制体
    private readonly brickPrefab: Prefab,
  ) {
    this.boardUI = this.boardNode.getComponent(UITransform) || this.boardNode.addComponent(UITransform);
    this.boardLayout = this.boardNode.getComponent(Layout) || this.boardNode.addComponent(Layout);

    // 验证瓦片信息，确保行列一致

    // 深拷贝用于存储存储状态信息
    this.tiles = this.data.tiles.map((row) => [...row]);

    // 初始化棋盘
    this._initLayout();
    this._initCells();
  }

  /**
   * 初始化瓦片
   */
  public async initTiles() {
    const { bricks, blocks } = this._parseLevelTiles();

    this._createBlocks(blocks);
    await this._createBricks(bricks);
  }

  public async reset() {}

  /**
   * 选择瓦片
   * @param event
   */
  public selectTile(event: EventTouch): void {
    // 1. 获取点击屏幕坐标
    const { x, y } = event.getUILocation(this._outUILocation);
    this._outUIPosition.set(x, y);

    // 2. 转成棋盘本地坐标
    const localPos = this.boardUI.convertToNodeSpaceAR(this._outUIPosition, this._outPosition);

    // 3. 计算格子索引
    const cellWidth = this.boardLayout.cellSize.width;
    const cellHeight = this.boardLayout.cellSize.height;

    // 棋盘左上角坐标相对中心
    const boardLeft = -this.boardUI.width / 2;
    const boardTop = this.boardUI.height / 2;

    // 根据 localPos 计算 col 和 row
    const col = Math.floor((localPos.x - boardLeft) / cellWidth);
    const row = Math.floor((boardTop - localPos.y) / cellHeight); // Y 向下为正

    // 4. 检查范围
    if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) return;

    // 5. 交给选中逻辑
    this.onClickCell(row, col);
  }

  /**
   * 检测当前棋盘是否至少有一对可消除
   */
  public hasAnyMatch(): boolean {
    const rows = this.tiles.length;
    const cols = this.tiles[0].length;
    const bricks: [number, number][] = [];

    // 收集所有砖块
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (this.tiles[r][c] === TileType.Brick) {
          bricks.push([r, c]);
        }
      }
    }

    // 两两检查
    for (let i = 0; i < bricks.length; i++) {
      for (let j = i + 1; j < bricks.length; j++) {
        const [r1, c1] = bricks[i];
        const [r2, c2] = bricks[j];
        if (this.canLink(r1, c1, r2, c2)) {
          // 找到一对立即返回
          return true;
        }
      }
    }
    return false;
  }

  private onClickCell(row: number, col: number): void {
    const type = this.tiles[row][col];
    if (type !== TileType.Brick) return;

    if (!this.firstSelection) {
      this.firstSelection = { row, col };
      this._highlightCell(row, col, true);
      return;
    }

    const { row: r1, col: c1 } = this.firstSelection;
    // 点击同一块，取消选择
    if (r1 === row && c1 === col) {
      this._highlightCell(row, col, false);
      this.firstSelection = null;
      return;
    }

    const node1 = this.cells.get(`${r1}x${c1}`)?.children[0];
    const node2 = this.cells.get(`${row}x${col}`)?.children[0];
    if (!node1 || !node2) return;

    const brick1 = node1.getComponent(GameBrick);
    const brick2 = node2.getComponent(GameBrick);
    if (!brick1 || !brick2) return;

    // 如果不是相同的物品对象，则切换选择
    if (brick1.itemIdx !== brick2.itemIdx) {
      this._highlightCell(r1, c1, false);
      this.firstSelection = { row, col };
      this._highlightCell(row, col, true);
      return;
    }

    // 如果不能消除，则执行一个错误动画
    if (!this.canLink(r1, c1, row, col)) {
      this._highlightCell(r1, c1, false);
      this.firstSelection = { row, col };
      this._highlightCell(row, col, true);
      return;
    }

    this._removeBrick(r1, c1);
    this._removeBrick(row, col);
    this.tiles[r1][c1] = TileType.Empty;
    this.tiles[row][col] = TileType.Empty;
    this.firstSelection = null;

    // TODO: 消除后触发砖块移动
    // this.moveTilesAfterMatch();
  }

  private _removeBrick(row: number, col: number): void {
    const cell = this.cells.get(`${row}x${col}`);
    if (!cell || cell.children.length === 0) return;
    cell.children[0].destroy();
  }

  private _highlightCell(row: number, col: number, highlight: boolean): void {
    const cell = this.cells.get(`${row}x${col}`);
    if (!cell || cell.children.length === 0) return;
    const brick = cell.children[0].getComponent(GameBrick);
    brick?.toggle(highlight);
  }

  /**
   * 初始化砖块
   * @param bricks
   * @private
   */
  private async _createBricks(bricks: Array<TileData>): Promise<void> {
    const theme = ThemeManager.instance.selectedTheme;

    // 构建可解布局
    const assignment = this._buildSolvableAssignment(bricks);

    // 遍历分配结果生成砖块
    for (const a of assignment) {
      const cell = this.cells.get(`${a.row}x${a.col}`);
      if (!cell) continue;

      const sf = theme.bricks[a.itemIdx];
      const tile = this._createBrick(a.itemIdx, sf);
      cell.addChild(tile);

      await sleep(0.02); // 避免阻塞
    }
  }

  /**
   * 分配物品到砖块
   * @param bricks
   * @private
   */
  private _buildSolvableAssignment(bricks: TileData[]): { row: number; col: number; itemIdx: number }[] {
    if (bricks.length % 2 !== 0) throw new Error(`砖块数量(${bricks.length})不是偶数`);

    const assignment: { row: number; col: number; itemIdx: number }[] = [];

    const maxTypes = Math.min(this.data.itemCount, ThemeManager.instance.selectedTheme.bricks.length, 27);
    const pairTotal = bricks.length / 2;

    // 生成物品类型对池
    const typePool: number[] = [];
    const base = Math.floor(pairTotal / maxTypes);
    const extras = pairTotal % maxTypes;
    for (let t = 0; t < maxTypes; t++) {
      for (let i = 0; i < base; i++) typePool.push(t);
      if (t < extras) typePool.push(t < extras ? t : t);
    }

    // 随机打乱砖块位置
    const shuffledBricks = [...bricks];
    for (let i = shuffledBricks.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledBricks[i], shuffledBricks[j]] = [shuffledBricks[j], shuffledBricks[i]];
    }

    // 每两块分配一个物品类型
    const typeIdxList = [...typePool];
    for (let i = 0; i < shuffledBricks.length; i += 2) {
      const itemIdx = typeIdxList.splice(Math.floor(Math.random() * typeIdxList.length), 1)[0];
      assignment.push({ row: shuffledBricks[i].row, col: shuffledBricks[i].col, itemIdx });
      assignment.push({ row: shuffledBricks[i + 1].row, col: shuffledBricks[i + 1].col, itemIdx });
    }

    return assignment;
  }

  /**
   * 判断两个砖块是否可连通（拐点 ≤ 2，支持阻挡物）
   * @param r1 起点行
   * @param c1 起点列
   * @param r2 终点行
   * @param c2 终点列
   */
  private canLink(r1: number, c1: number, r2: number, c2: number): boolean {
    const rows = this.tiles.length;
    const cols = this.tiles[0].length;

    // 扩展棋盘，周围加一圈空格
    const paddedRows = rows + 2;
    const paddedCols = cols + 2;
    const paddedTiles: TileType[][] = Array.from({ length: paddedRows }, (_, r) =>
      Array.from({ length: paddedCols }, (_, c) => {
        if (r === 0 || r === paddedRows - 1 || c === 0 || c === paddedCols - 1) return TileType.Empty;
        return this.tiles[r - 1][c - 1];
      }),
    );

    // BFS 四个方向
    const dirs = [
      [0, 1],
      [1, 0],
      [0, -1],
      [-1, 0],
    ];

    type Node = { row: number; col: number; dir: number | null; turn: number };

    const visited = Array.from({ length: paddedRows }, () => Array.from({ length: paddedCols }, () => Array(4).fill(Infinity)));

    const queue: Node[] = [];

    // 起点偏移 +1
    const startR = r1 + 1;
    const startC = c1 + 1;
    const endR = r2 + 1;
    const endC = c2 + 1;

    for (let d = 0; d < 4; d++) {
      const nr = startR + dirs[d][0];
      const nc = startC + dirs[d][1];
      if (nr < 0 || nr >= paddedRows || nc < 0 || nc >= paddedCols) continue;
      if (paddedTiles[nr][nc] === TileType.Empty || (nr === endR && nc === endC)) {
        visited[nr][nc][d] = 0;
        queue.push({ row: nr, col: nc, dir: d, turn: 0 });
      }
    }

    while (queue.length > 0) {
      const cur = queue.shift()!;
      const { row, col, dir, turn } = cur;

      if (row === endR && col === endC && turn <= 2) return true;

      for (let d = 0; d < 4; d++) {
        const nr = row + dirs[d][0];
        const nc = col + dirs[d][1];

        if (nr < 0 || nr >= paddedRows || nc < 0 || nc >= paddedCols) continue;
        if (paddedTiles[nr][nc] !== TileType.Empty && !(nr === endR && nc === endC)) continue;

        const nextTurn = dir === null || dir === d ? turn : turn + 1;
        if (nextTurn > 2) continue;
        if (visited[nr][nc][d] <= nextTurn) continue;

        visited[nr][nc][d] = nextTurn;
        queue.push({ row: nr, col: nc, dir: d, turn: nextTurn });
      }
    }

    return false;
  }

  /**
   * 创建一个砖块
   * @private
   */
  private _createBrick(itemIdx: number, sf: SpriteFrame): Node {
    const node = instantiate(this.brickPrefab);
    const ui = node.getComponent(UITransform) || node.addComponent(UITransform);
    const item = node.getComponent(GameBrick);
    node.setPosition(Vec3.ZERO);
    ui.setContentSize(this.boardLayout.cellSize);
    item?.init(itemIdx, sf);
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
  private _parseLevelTiles(): { bricks: Array<TileData>; blocks: Array<TileData> } {
    const bricks: Array<TileData> = [];
    const blocks: Array<TileData> = [];

    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        const type = this.data.tiles[row][col];
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
