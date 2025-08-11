import { sys } from 'cc';

const APP_NAME = 'Onet_1.0';

function getCacheKey(key: string) {
  return `__${APP_NAME}_${key}__`.toUpperCase();
}

export function setCache<T>(key: string, value: T) {
  const cacheKey = getCacheKey(key);
  const data = { value: value };
  sys.localStorage.setItem(cacheKey, JSON.stringify(data));
}

export function getCache<T>(key: string, defaultValue: T): T {
  const cacheKey = getCacheKey(key);
  const str = sys.localStorage.getItem(cacheKey);
  try {
    return JSON.parse(str).value;
  } catch (e) {
    setCache(key, defaultValue);
    return defaultValue;
  }
}

export class MapState<K extends string | number | symbol, V> {
  private readonly _cacheKey: string;
  private readonly _cache: Record<K, V>;

  constructor(cacheKey: string, defaultValue: Record<K, V>) {
    this._cacheKey = cacheKey;
    this._cache = getCache<Record<K, V>>(this._cacheKey, defaultValue);
  }

  get(key: K): V | undefined {
    if (key in this._cache) {
      return this._cache[key];
    }

    return undefined;
  }

  set(key: K, value: V): this {
    this._cache[key] = value;
    setCache(this._cacheKey, this._cache);
    return this;
  }

  delete(key: K): this {
    delete this._cache[key];
    setCache(this._cacheKey, this._cache);
    return this;
  }

  clear(): this {
    Object.assign(this._cache, {});
    setCache(this._cacheKey, this._cache);
    return this;
  }

  toValue(): Record<K, V> {
    return this._cache;
  }
}
