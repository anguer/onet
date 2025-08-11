import { Node, UITransform, Vec3, math } from 'cc';

/**
 * 计算方向向量
 * @param target
 * @param current
 * @param out
 */
export function getDirection(target: Vec3, current: Vec3, out: Vec3): Vec3 {
  Vec3.subtract(out, target, current).normalize();
  // 下面代码等价于上面代码，但是需要调用clone()，因为subtract会修改对象本身
  // const direction = target.clone().subtract(current).normalize();
  return out;
}

/**
 * 将方向转换为角度
 * @param direction
 */
export function directionToAngle(direction: Vec3) {
  // 计算弧度
  const radians = Math.atan2(direction.y, direction.x);
  // 弧度转角度
  return math.toDegree(radians);
}

/**
 * 将屏幕坐标转换为指定节点的本地坐标
 * @param node
 * @param worldPoint
 * @param out
 */
export function convertToNodeSpaceAR(node: Node, worldPoint: Vec3, out?: Vec3): Vec3 {
  const transform = node.getComponent(UITransform);
  if (!transform) {
    return Vec3.ZERO;
  }

  return transform.convertToNodeSpaceAR(worldPoint, out);
}
