import { Layers, Node, UITransform, Widget, v2 } from 'cc';

/**
 * 创建一个全屏的节点
 * @param name
 * @param parent
 */
export function createFullscreenNode(name: string, parent?: Node): Node {
  const node = new Node(name);
  node.layer = Layers.Enum.UI_2D;

  if (parent) {
    node.setParent(parent);
    const ui = parent.getComponent(UITransform) || parent.addComponent(UITransform);
    const self = node.getComponent(UITransform) || node.addComponent(UITransform);
    self.setContentSize(ui.contentSize);
    return node;
  }

  const widget = node.addComponent(Widget);
  widget.top = widget.left = widget.right = widget.bottom = 0;
  widget.isAlignTop = widget.isAlignLeft = widget.isAlignRight = widget.isAlignBottom = true;
  return node;
}

/**
 * 检查当前节点是否在目标节点包围盒内
 * @param current
 * @param target
 * @private
 */
export function isNodeWithinTargetBounds(current: Node, target: Node): boolean {
  if (current === target) {
    return false;
  }

  const targetBox = target.getComponent(UITransform)?.getBoundingBoxToWorld();
  if (!targetBox) {
    return false;
  }
  return targetBox.contains(v2(current.worldPosition.x, current.worldPosition.y));
}
