import { Color, EventTouch, Graphics, instantiate, Layout, Node, Prefab, Size, SpriteFrame, UITransform, Vec2, Vec3 } from 'cc';
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

type PathCell = { row: number; col: number };

/**
 * 棋盘管理类
 */
export class Chessboard {
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
  // 控制棋盘布局
  private readonly boardGraphics: Graphics;

  private readonly _outUILocation: Vec2 = new Vec2();
  private readonly _outUIPosition: Vec3 = new Vec3();
  private readonly _outPosition: Vec3 = new Vec3();

  // 当前棋盘状态信息
  private tiles: Array<Array<TileType>>;
  // 第一次选择的砖块
  private firstSelection: { row: number; col: number } | null = null;

  // 是否已全部清除
  public get isCleared(): boolean {
    return this.tiles.every((row) => row.every((tile) => tile === TileType.Empty));
  }

  // 是否有至少一对可消除
  public get hasAnyMatch(): boolean {
    return !!this._findAnyMatchPair();
  }

  constructor(
    // 棋盘节点
    private readonly boardNode: Node,
    private readonly data: LevelData,
    // 砖块预制体
    private readonly brickPrefab: Prefab,
  ) {
    this.boardUI = this.boardNode.getComponent(UITransform) || this.boardNode.addComponent(UITransform);
    this.boardLayout = this.boardNode.getComponent(Layout) || this.boardNode.addComponent(Layout);
    this.boardGraphics = this.boardNode.getComponent(Graphics) || this.boardNode.addComponent(Graphics);
    this.boardGraphics.lineWidth = 10;
    this.boardGraphics.strokeColor = new Color(255, 142, 38);

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

  /**
   * 重置棋盘（用于重玩）
   */
  public async reset(): Promise<void> {
    // 清除所有砖块节点
    this.cells.forEach((cell) => {
      cell.removeAllChildren();
    });

    // 重置瓦片状态
    this.tiles = this.data.tiles.map((row) => [...row]);

    // 重置状态标志
    this.firstSelection = null;

    // 重新生成砖块
    const { bricks, blocks } = this._parseLevelTiles();
    this._createBlocks(blocks);
    await this._createBricks(bricks);
  }

  /**
   * 刷新棋盘剩余砖块物品位置
   */
  public refresh(): void {
    const theme = ThemeManager.instance.selectedTheme;

    // 收集剩余砖块
    const remaining: TileData[] = [];
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (this.tiles[r][c] === TileType.Brick) {
          remaining.push({ row: r, col: c, type: TileType.Brick });
        }
      }
    }

    if (remaining.length === 0) return;

    // 获取当前砖块节点
    const bricksNodes = remaining
      .map((tile) => {
        const node = this.cells.get(`${tile.row}x${tile.col}`)?.children[0];
        return { tile, node };
      })
      .filter((x) => x.node);

    // 随机打乱砖块物品
    const itemIdxList = bricksNodes.map((x) => x.node!.getComponent(GameBrick)!.itemIdx);
    for (let i = itemIdxList.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [itemIdxList[i], itemIdxList[j]] = [itemIdxList[j], itemIdxList[i]];
    }

    // 重新赋值
    bricksNodes.forEach(({ node }, idx) => {
      const brick = node!.getComponent(GameBrick)!;
      const sf = theme.bricks[itemIdxList[idx]];
      brick.updateUI(itemIdxList[idx], sf);
    });
  }

  /**
   * 高亮提示一对可消除的砖块
   */
  public async highlightHintPair(): Promise<void> {
    const pair = this._findAnyMatchPair();
    if (!pair) return;

    const { tile1, tile2 } = pair;

    // 先取消之前的高亮（可选，根据需求）
    this._clearAllHighlights();

    // 高亮砖块
    this._highlightCell(tile1.row, tile1.col, true);
    this._highlightCell(tile2.row, tile2.col, true);
  }

  /**
   * 直接消除一对砖块
   */
  public async eliminateAnyPair(): Promise<void> {
    const pair = this._findAnyMatchPair();
    if (!pair) return;

    const { tile1, tile2, paths } = pair;

    this._drawLink(paths);

    // 移除砖块
    this._removeBrick(tile1.row, tile1.col);
    this._removeBrick(tile2.row, tile2.col);
    this.tiles[tile1.row][tile1.col] = TileType.Empty;
    this.tiles[tile2.row][tile2.col] = TileType.Empty;

    // 取消之前的高亮（可选）
    this._clearAllHighlights();

    await sleep(0.5);
    this._clearLink();
  }

  /**
   * 选择瓦片
   * @param event
   */
  public async selectTile(event: EventTouch): Promise<void> {
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
    await this._onSelectTile(row, col);
  }

  /**
   * 处理瓦片选中
   * @param row
   * @param col
   * @private
   */
  private async _onSelectTile(row: number, col: number): Promise<void> {
    const type = this.tiles[row][col];
    if (type !== TileType.Brick) return;

    if (!this.firstSelection) {
      this.firstSelection = { row, col };
      this._toggleCell(row, col, true);
      return;
    }

    const { row: r1, col: c1 } = this.firstSelection;
    // 点击同一块，取消选择
    if (r1 === row && c1 === col) {
      this._toggleCell(row, col, false);
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
      this._toggleCell(r1, c1, false);
      this.firstSelection = { row, col };
      this._toggleCell(row, col, true);
      return;
    }

    const paths = this._findLinkPath(r1, c1, row, col);

    // 如果不能消除，则执行一个错误动画
    if (!paths) {
      this._toggleCell(r1, c1, false);
      this.firstSelection = { row, col };
      this._toggleCell(row, col, true);
      return;
    }

    console.log(paths);
    this._drawLink(paths);

    this._removeBrick(r1, c1);
    this._removeBrick(row, col);
    this.tiles[r1][c1] = TileType.Empty;
    this.tiles[row][col] = TileType.Empty;
    this.firstSelection = null;

    await sleep(0.5);
    this._clearLink();

    // TODO: 消除后触发砖块移动
    // this.moveTilesAfterMatch();
  }

  private _removeBrick(row: number, col: number): void {
    const cell = this.cells.get(`${row}x${col}`);
    if (!cell || cell.children.length === 0) return;
    cell.children[0].destroy();
  }

  private _toggleCell(row: number, col: number, checked: boolean): void {
    const cell = this.cells.get(`${row}x${col}`);
    if (!cell || cell.children.length === 0) return;
    const brick = cell.children[0].getComponent(GameBrick);
    brick?.toggle(checked);
  }

  private _highlightCell(row: number, col: number, highlight: boolean): void {
    const cell = this.cells.get(`${row}x${col}`);
    if (!cell || cell.children.length === 0) return;
    const brick = cell.children[0].getComponent(GameBrick);
    brick?.highlight(highlight);
  }

  /**
   * 清除棋盘上所有砖块高亮
   * @private
   */
  private _clearAllHighlights(): void {
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        const cell = this.cells.get(`${row}x${col}`);
        if (!cell || cell.children.length === 0) continue;
        const brick = cell.children[0].getComponent(GameBrick);
        brick?.toggle(false);
      }
    }
  }

  private _gridToLocal(row: number, col: number): Vec3 {
    // 允许 row/col 为 -1 或 = rows/cols（走到外框）
    const cellW = this.boardLayout.cellSize.width;
    const cellH = this.boardLayout.cellSize.height;
    const boardLeft = -this.boardUI.width / 2;
    const boardTop = this.boardUI.height / 2;

    const x = boardLeft + (col + 0.5) * cellW;
    const y = boardTop - (row + 0.5) * cellH;
    return new Vec3(x, y, 0);
  }

  private _drawLink(path: PathCell[]): void {
    if (!path || path.length < 2) return;

    this.boardGraphics.clear();

    const p0 = this._gridToLocal(path[0].row, path[0].col);
    this.boardGraphics.moveTo(p0.x, p0.y);

    for (let i = 1; i < path.length; i++) {
      const p = this._gridToLocal(path[i].row, path[i].col);
      this.boardGraphics.lineTo(p.x, p.y);
    }
    this.boardGraphics.stroke();
  }

  private _clearLink(): void {
    this.boardGraphics.clear();
  }

  /**
   * 查找棋盘上任意一对可消除的砖块
   * @returns 如果存在返回 [tile1, tile2]，否则返回 null
   */
  private _findAnyMatchPair(): { tile1: TileData; tile2: TileData; paths: PathCell[] } | null {
    const bricks: TileData[] = [];

    // 收集所有砖块
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (this.tiles[r][c] === TileType.Brick) {
          bricks.push({ row: r, col: c, type: TileType.Brick });
        }
      }
    }

    // 两两尝试
    for (let i = 0; i < bricks.length; i++) {
      for (let j = i + 1; j < bricks.length; j++) {
        const b1 = bricks[i];
        const b2 = bricks[j];
        const node1 = this.cells.get(`${b1.row}x${b1.col}`)?.children[0];
        const node2 = this.cells.get(`${b2.row}x${b2.col}`)?.children[0];
        if (!node1 || !node2) continue;

        const brick1 = node1.getComponent(GameBrick);
        const brick2 = node2.getComponent(GameBrick);
        if (!brick1 || !brick2) continue;

        // 类型相同才可能匹配
        if (brick1.itemIdx !== brick2.itemIdx) continue;

        // 检查连通性
        const paths = this._findLinkPath(b1.row, b1.col, b2.row, b2.col);
        if (paths) {
          return { tile1: b1, tile2: b2, paths };
        }
      }
    }

    return null;
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
   * 查找两个砖块之间的连接路径
   * @param r1 起点行
   * @param c1 起点列
   * @param r2 终点行
   * @param c2 终点列
   */
  private _findLinkPath(r1: number, c1: number, r2: number, c2: number): PathCell[] | null {
    const rows = this.tiles.length;
    const cols = this.tiles[0].length;

    // —— 扩展棋盘（外圈一圈可通行空格）——
    const paddedRows = rows + 2;
    const paddedCols = cols + 2;
    const paddedTiles: TileType[][] = Array.from({ length: paddedRows }, (_, r) =>
      Array.from({ length: paddedCols }, (_, c) => {
        if (r === 0 || r === paddedRows - 1 || c === 0 || c === paddedCols - 1) return TileType.Empty;
        return this.tiles[r - 1][c - 1];
      }),
    );

    // 方向：右、下、左、上
    const dirs = [
      [0, 1],
      [1, 0],
      [0, -1],
      [-1, 0],
    ];

    type State = { row: number; col: number; dir: number; turn: number };

    // 访问表：到达 (r,c) 且朝向 d 的最小拐弯数
    const visited = Array.from({ length: paddedRows }, () => Array.from({ length: paddedCols }, () => Array(4).fill(Infinity)));

    // 前驱表：重建路径
    const prev: ({ row: number; col: number; dir: number } | null)[][][] = Array.from({ length: paddedRows }, () =>
      Array.from({ length: paddedCols }, () => Array(4).fill(null)),
    );

    const queue: State[] = [];

    // 起止点（映射到扩展棋盘）
    const startR = r1 + 1;
    const startC = c1 + 1;
    const endR = r2 + 1;
    const endC = c2 + 1;

    // 从起点四周一格出发（起点本身是砖块，不能入队）
    for (let d = 0; d < 4; d++) {
      const nr = startR + dirs[d][0];
      const nc = startC + dirs[d][1];
      if (nr < 0 || nr >= paddedRows || nc < 0 || nc >= paddedCols) continue;
      if (paddedTiles[nr][nc] === TileType.Empty || (nr === endR && nc === endC)) {
        visited[nr][nc][d] = 0;
        prev[nr][nc][d] = { row: startR, col: startC, dir: -1 };
        queue.push({ row: nr, col: nc, dir: d, turn: 0 });
      }
    }

    // BFS
    while (queue.length) {
      const cur = queue.shift()!;
      const { row, col, dir, turn } = cur;

      // 抵达终点
      if (row === endR && col === endC && turn <= 2) {
        // —— 重建路径（扩展棋盘坐标）——
        const full: { r: number; c: number }[] = [];
        let rr = row,
          cc = col,
          dd = dir;
        full.push({ r: rr, c: cc });
        while (!(rr === startR && cc === startC)) {
          const p = prev[rr][cc][dd];
          if (!p) break;
          rr = p.row;
          cc = p.col;
          dd = p.dir;
          full.push({ r: rr, c: cc });
        }
        full.reverse(); // [startR/C, ..., endR/C]

        // —— 去掉扩展偏移，得到原棋盘坐标（可能出现 -1 或 rows/cols 表示走到外框）——
        const raw: PathCell[] = full.map((p) => ({ row: p.r - 1, col: p.c - 1 }));

        // —— 只保留拐点（含起点/终点）——
        return this._compressPath(raw);
      }

      // 四方向扩展
      for (let nd = 0; nd < 4; nd++) {
        const nr = row + dirs[nd][0];
        const nc = col + dirs[nd][1];
        if (nr < 0 || nr >= paddedRows || nc < 0 || nc >= paddedCols) continue;

        // 只能走空格或终点
        if (paddedTiles[nr][nc] !== TileType.Empty && !(nr === endR && nc === endC)) continue;

        const nextTurn = nd === dir ? turn : turn + 1;
        if (nextTurn > 2) continue;
        if (visited[nr][nc][nd] <= nextTurn) continue;

        visited[nr][nc][nd] = nextTurn;
        prev[nr][nc][nd] = { row, col, dir };
        queue.push({ row: nr, col: nc, dir: nd, turn: nextTurn });
      }
    }

    return null;
  }

  // 仅保留“拐点”（方向变化点）+ 起止
  private _compressPath(seq: PathCell[]): PathCell[] {
    if (seq.length <= 2) return seq;
    const out: PathCell[] = [];
    out.push(seq[0]);
    let lastDr = seq[1].row - seq[0].row;
    let lastDc = seq[1].col - seq[0].col;
    for (let i = 2; i < seq.length; i++) {
      const dr = seq[i].row - seq[i - 1].row;
      const dc = seq[i].col - seq[i - 1].col;
      if (dr !== lastDr || dc !== lastDc) {
        out.push(seq[i - 1]); // 方向变化处是拐点
        lastDr = dr;
        lastDc = dc;
      }
    }
    out.push(seq[seq.length - 1]);
    return out;
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
    item?.updateUI(itemIdx, sf);
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
