import debounce from 'lodash.debounce';

/**
 * 防抖装饰器
 * @param wait
 * @param options
 * @constructor
 */
export function Debounce(wait: number = 300, options?: { leading?: boolean; trailing?: boolean; maxWait?: number }) {
  const { leading = false, trailing = true } = options || {};

  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const symbolKey = Symbol(`__debounce_${propertyKey}`);

    descriptor.value = function (...args: any[]) {
      if (!this[symbolKey]) {
        this[symbolKey] = debounce(originalMethod.bind(this), wait, { leading, trailing });
      }
      return this[symbolKey](...args);
    };

    return descriptor;
  };
}
