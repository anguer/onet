import throttle from 'lodash.throttle';

/**
 * 节流装饰器
 * @param wait
 * @param options
 * @constructor
 */
export function Throttle(wait: number = 500, options?: { leading?: boolean; trailing?: boolean }) {
  const { leading = true, trailing = false } = options || {};

  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const symbolKey = Symbol(`__throttle_${propertyKey}`);

    descriptor.value = function (...args: any[]) {
      if (!this[symbolKey]) {
        // 必须先 bind(this)，再交给 lodash.throttle
        this[symbolKey] = throttle(originalMethod.bind(this), wait, { leading, trailing });
      }
      return this[symbolKey](...args);
    };

    return descriptor;
  };
}
