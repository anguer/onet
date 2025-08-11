import { _decorator, CCInteger, Component, Enum, instantiate, Layout, Node, NodePool, Prefab, ScrollView, Size, UITransform, Vec3, Widget } from 'cc';
import { Throttle } from 'db://assets/Framework/decorators/throttle';

const { ccclass, property } = _decorator;

enum LayoutType {
  Vertical = 1,
  Horizontal = 2,
  Grid = 3,
}

@ccclass('VirtualList')
export class VirtualList<T = any> extends Component {
  public static readonly ITEM_UPDATE = 'virtual_list_item_update';

  @property(Prefab)
  private itemPrefab: Prefab;

  @property({ type: Enum(LayoutType) })
  private layoutType: LayoutType = LayoutType.Vertical;

  @property({
    type: CCInteger,
    visible() {
      return this.layoutType === LayoutType.Grid;
    },
  })
  private columns: number = 1; // 网格模式下的列数（纵向滚动）

  @property({ type: CCInteger })
  private spacingX: number = 10;

  @property({ type: CCInteger })
  private spacingY: number = 10;

  @property({ type: CCInteger })
  private paddingTop: number = 10;

  @property({ type: CCInteger })
  private paddingBottom: number = 10;

  @property({ type: CCInteger })
  private paddingLeft: number = 10;

  @property({ type: CCInteger })
  private paddingRight: number = 10;

  private scrollView: ScrollView;
  private content: Node;
  private viewport: UITransform;
  private itemPool: NodePool = new NodePool();
  private itemSize: Size = new Size();
  private dataList: T[] = [];
  // 用 Map 来跟踪“索引 → 节点”，便于增量回收
  private activeItemMap: Map<number, Node> = new Map();
  // 复用 Vec3 避免 new 太多临时对象
  private tmpPos: Vec3 = new Vec3();

  private totalCount = 0;

  private _initialized: boolean = false;
  public get initialized(): boolean {
    return this._initialized;
  }

  protected onLoad() {
    const sv = this.node.getComponent(ScrollView);
    if (!sv) {
      throw new Error('ScrollView not found');
    } else {
      this.scrollView = sv;
    }

    if (!this.scrollView.content) {
      throw new Error('ScrollView.content not found');
    } else {
      this.content = this.scrollView.content;
      // 设置 content 锚点为左上角
      const contentUI = this.content.getComponent(UITransform) || this.content.addComponent(UITransform);
      contentUI.setAnchorPoint(0, 1);
    }

    if (!this.scrollView.view) {
      throw new Error('ScrollView.view not found');
    } else {
      const widget = this.scrollView.node.getComponent(Widget);
      widget?.updateAlignment();
      this.viewport = this.scrollView.view;
      // 设置 view 锚点为左上角
      this.viewport.setAnchorPoint(0, 1);
    }

    this.initLayout();
    this.initItemSize();

    this.scrollView.node.on(ScrollView.EventType.SCROLLING, this.onScrolling, this);
  }

  /**
   * 释放列表项
   */
  public releaseItems(): void {
    this.activeItemMap.forEach((node) => {
      node.active = false;
      node.removeFromParent();
      this.itemPool.put(node);
    });
    this.activeItemMap.clear();
    this.scrollView.scrollToTop();
  }

  /**
   * 加载列表项
   */
  public loadItems(): void {
    if (this.dataList.length === 0) return;
    this.totalCount = this.dataList.length;
    this.calcContentSize();
    this.spawnInitialItems();
  }

  public init(dataList: T[]) {
    if (this._initialized) {
      return;
    }

    this._initialized = true;
    this.releaseItems();
    // 赋新数据
    this.dataList = dataList || [];
    this.loadItems();
  }

  public appendData(dataList: T[]) {
    if (dataList.length === 0) return;
    // 保留已有项，仅追加
    this.dataList.push(...dataList);
    this.totalCount = this.dataList.length;
    this.calcContentSize();
    // 渲染新出现的可见项
    const newIndices = this.calcVisibleIndices();
    for (const idx of newIndices) {
      if (!this.activeItemMap.has(idx)) {
        this.addItemAt(idx);
      }
    }
  }

  public prependData(dataList: T[]) {
    if (dataList.length === 0) return;
    this.releaseItems();
    // 保留已有项，仅追加
    this.dataList.unshift(...dataList);
    this.loadItems();
  }

  private initLayout() {
    const layout = this.content.getComponent(Layout);
    if (layout) {
      layout.enabled = false;
    }
  }

  private initItemSize() {
    const temp = instantiate(this.itemPrefab);
    // 必须加到场景才能获取 UITransform 尺寸
    this.node.addChild(temp);
    const trans = temp.getComponent(UITransform) || temp.addComponent(UITransform);
    this.itemSize.set(trans.width, trans.height);
    temp.removeFromParent();
    temp.destroy();
  }

  private calcContentSize() {
    const contentTrans = this.content.getComponent(UITransform)!;

    if (this.layoutType === LayoutType.Vertical) {
      const rows = Math.ceil(this.totalCount);
      const height = this.paddingTop + this.paddingBottom + rows * (this.itemSize.height + this.spacingY) - this.spacingY;
      contentTrans.setContentSize(this.viewport.width, height);
    } else if (this.layoutType === LayoutType.Horizontal) {
      const cols = Math.ceil(this.totalCount);
      const width = this.paddingLeft + this.paddingRight + cols * (this.itemSize.width + this.spacingX) - this.spacingX;
      contentTrans.setContentSize(width, this.viewport.height);
    } else if (this.layoutType === LayoutType.Grid) {
      const cols = this.columns;
      const rows = Math.ceil(this.totalCount / cols);
      const width = this.paddingLeft + this.paddingRight + cols * (this.itemSize.width + this.spacingX) - this.spacingX;
      const height = this.paddingTop + this.paddingBottom + rows * (this.itemSize.height + this.spacingY) - this.spacingY;
      contentTrans.setContentSize(width, height);
    }
  }

  private spawnInitialItems() {
    // 增量渲染：只生成首屏+缓冲区
    const indices = this.calcVisibleIndices();
    for (const idx of indices) {
      this.addItemAt(idx);
    }
  }

  private addItemAt(index: number) {
    let item: Node;
    if (this.itemPool.size() > 0) {
      item = this.itemPool.get()!;
    } else {
      item = instantiate(this.itemPrefab);
      const ui = item.getComponent(UITransform) || item.addComponent(UITransform);
      ui.setAnchorPoint(0, 1);
    }

    this.content.addChild(item);
    // 复用 tmpPos，避免频繁 new Vec3
    const pos = this.getItemPosition(index, this.tmpPos);
    item.setPosition(pos);
    item.active = true;
    item.emit(VirtualList.ITEM_UPDATE, this.dataList[index], index);
    this.activeItemMap.set(index, item);
  }

  /**
   * 集中计算可见索引区间
   * @private
   */
  private calcVisibleIndices(): number[] {
    const buffer = 2;

    let startIdx: number;
    const offset = this.scrollView.getScrollOffset();
    if (this.layoutType !== LayoutType.Horizontal) {
      const row = Math.floor(offset.y / (this.itemSize.height + this.spacingY));
      startIdx = Math.max(0, row * (this.layoutType === LayoutType.Grid ? this.columns : 1));
    } else {
      const col = Math.floor(-offset.x / (this.itemSize.width + this.spacingX));
      startIdx = Math.max(0, col);
    }

    let count: number;
    if (this.layoutType !== LayoutType.Horizontal) {
      const rows = Math.ceil(this.viewport.height / (this.itemSize.height + this.spacingY)) + buffer;
      count = rows * (this.layoutType === LayoutType.Grid ? this.columns : 1);
    } else {
      count = Math.ceil(this.viewport.width / (this.itemSize.width + this.spacingX)) + buffer;
    }

    const end = Math.min(this.totalCount, startIdx + count);
    const arr: number[] = [];
    for (let i = startIdx; i < end; i++) arr.push(i);

    return arr;
  }

  private getItemPosition(index: number, out: Vec3): Vec3 {
    let x = this.paddingLeft;
    let y = -this.paddingTop;
    if (this.layoutType === LayoutType.Vertical) {
      y -= index * (this.itemSize.height + this.spacingY);
    } else if (this.layoutType === LayoutType.Horizontal) {
      x += index * (this.itemSize.width + this.spacingX);
    } else {
      const col = index % this.columns;
      const row = Math.floor(index / this.columns);
      x += col * (this.itemSize.width + this.spacingX);
      y -= row * (this.itemSize.height + this.spacingY);
    }
    out.set(x, y, 0);
    return out;
  }

  @Throttle(200)
  private onScrolling() {
    const newIndices = this.calcVisibleIndices();
    // 回收已滑出
    this.activeItemMap.forEach((node, idx) => {
      if (!newIndices.includes(idx)) {
        node.active = false;
        node.removeFromParent();
        this.itemPool.put(node);
        this.activeItemMap.delete(idx);
      }
    });
    // 创建新滑入
    for (const idx of newIndices) {
      if (!this.activeItemMap.has(idx)) {
        this.addItemAt(idx);
      }
    }
  }
}
