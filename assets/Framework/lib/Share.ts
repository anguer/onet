import { randomRangeInt, Color } from 'cc';

/**
 * 返回最小(包含)和最大(不包含)之间的随机整数。
 * @param min
 * @param max
 */
export function random(min: number, max: number): number {
  return randomRangeInt(min, max);
}

export function sleep(seconds: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, seconds * 1000));
}

/**
 * Shuffle an array using the Fisher-Yates algorithm.
 *
 * @param array The array to shuffle.
 * @returns A new array with elements shuffled.
 */
export function shuffle<T>(array: T[]): T[] {
  const shuffledArray = array.slice(); // Create a copy of the array
  let currentIndex = shuffledArray.length;
  let randomIndex: number;

  // While there remain elements to shuffle...
  while (currentIndex !== 0) {
    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [shuffledArray[currentIndex], shuffledArray[randomIndex]] = [shuffledArray[randomIndex], shuffledArray[currentIndex]];
  }

  return shuffledArray;
}

/**
 * 创建代理，用于拦截类函数调用（一般用于需要初始化的管理器）
 * @param instance
 * @param methodsToSkipCheck
 */
export function createProxy<T extends object>(instance: T, methodsToSkipCheck: (string | symbol)[] = ['init']): T {
  return new Proxy(instance, {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver);

      // 如果访问的是函数，则进行拦截处理
      if (typeof value === 'function') {
        return function (...args: never[]) {
          // 如果当前函数在 methodsToSkipCheck 列表中，直接跳过检查
          if (methodsToSkipCheck.includes(prop)) {
            return value.apply(this, args);
          }
          // 检查是否已经初始化
          if (!target['initialized']) {
            throw new Error(`Cannot call method ${String(prop)}: ${target.constructor.name} is not initialized.`);
          }
          return value.apply(this, args);
        };
      }

      return value;
    },
  });
}

/**
 * 数值格式化，1234 => 1.2K
 * @param num
 * @param digits
 */
export function numberFormatter(num = 0, digits = 1) {
  const si = [
    { value: 1e18, symbol: 'E' },
    { value: 1e15, symbol: 'P' },
    { value: 1e12, symbol: 'T' },
    { value: 1e9, symbol: 'G' },
    { value: 1e6, symbol: 'M' },
    { value: 1e3, symbol: 'K' },
  ];
  for (let i = 0; i < si.length; i++) {
    // 只有当 num >= 该单位基数 × 10 时，才使用该单位进行格式化
    const threshold = si[i].value * 10;
    if (num >= threshold) {
      return (num / si[i].value).toFixed(digits).replace(/\.0+$|(\.[0-9]*[1-9])0+$/, '$1') + si[i].symbol;
    }
  }
  return num.toString();
}

type Iteratee<T> = (item: T) => string;

export function uniqBy<T>(array: T[], iteratee: Iteratee<T>): T[] {
  const seen = new Set();
  const uniqueArray: T[] = [];

  for (const item of array) {
    const key = iteratee(item);
    if (!seen.has(key)) {
      seen.add(key);
      uniqueArray.push(item);
    }
  }

  return uniqueArray;
}

export function groupBy<T, K extends string | number | symbol>(array: T[], iteratee: (item: T) => K): Record<K, T[]> {
  return array.reduce(
    (result, item) => {
      const key = iteratee(item);
      if (!result[key]) {
        result[key] = [];
      }
      result[key].push(item);
      return result;
    },
    {} as Record<K, T[]>,
  );
}

export function mapValues<T extends object, R>(obj: T, iteratee: (value: T[keyof T], key: keyof T) => R): { [K in keyof T]: R } {
  const result = {} as { [K in keyof T]: R };
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      result[key] = iteratee(obj[key], key);
    }
  }
  return result;
}

export function toGrayscaleColor(color: Color, out?: Color) {
  const grayValue = Math.floor(0.3 * color.r + 0.59 * color.g + 0.11 * color.b);
  if (out) {
    out.r = grayValue;
    out.g = grayValue;
    out.b = grayValue;
    out.a = color.a;
    return out;
  }
  return new Color(grayValue, grayValue, grayValue, color.a);
}

export function padStart(target: number | string, maxLength: number, fillString = '0') {
  return `${target}`.padStart(maxLength, fillString);
}

export function isRemoteUrl(str: string): boolean {
  const pattern = /^(https?:\/\/)?([\w-]+\.)+[\w-]{2,}(\/[\w\-._~:/?#[\]@!$&'()*+,;=]*)?$/i;
  return pattern.test(str);
}

/**
 * 截断玩家昵称，超出指定长度时在尾部追加省略号 "..."
 * 支持 Unicode 字符（包括 emoji 等多字节字符）的正确截断
 *
 * @param name - 原始昵称
 * @param maxLength - 昵称最大显示长度（包括省略号）。当 name 的字符数超过此值时会截断。
 * @param defaultValue
 * @returns 截断处理后的昵称
 */
export function truncateNickname(name: string, maxLength: number = 20, defaultValue: string = ''): string {
  const str = `${name}`.trim();
  if (!str) {
    return defaultValue;
  }

  const max = Math.max(3, maxLength);

  // 将字符串按 Unicode codepoint 拆分，确保 emoji 等也能正确处理
  const chars = Array.from(str);

  // 如果长度在限制内，直接返回原始昵称
  if (chars.length <= max) {
    return str;
  }

  // 至少保留一个字符再加省略号
  const keep = Math.max(1, max - 3);
  return chars.slice(0, keep).join('') + '...';
}

export function pick<T extends object, K extends keyof T>(obj: T, keys: readonly K[]): Pick<T, K> {
  const result = {} as Pick<T, K>;
  for (const key of keys) {
    if (key in obj) {
      result[key] = obj[key];
    }
  }
  return result;
}
