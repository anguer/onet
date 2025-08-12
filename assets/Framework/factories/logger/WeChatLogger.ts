import { Logger } from 'db://assets/Framework/factories/logger/Logger';

/*
 * 简易版 lodash.get 实现，支持字符串路径（"a.b[0].c"）或键名数组
 * @param obj      - 目标对象
 * @param path     - 属性访问路径，支持 dot/bracket 语法 或 字符串数组
 * @param defaultValue - 当结果为 undefined 时返回的默认值
 */
export function get<T, D = undefined>(obj: T, path: string | Array<string | number>, defaultValue?: D): unknown {
  if (obj == null) {
    return defaultValue;
  }
  // 统一路径为数组："a.b[0].c" -> ["a","b","0","c"]
  const segments: Array<string | number> = Array.isArray(path)
    ? path
    : String(path)
        .replace(/\[(\d+)]/g, '.$1') // 将 "[0]" 转为 ".0"
        .split('.')
        .filter(Boolean);

  let current: unknown = obj;
  for (const key of segments) {
    if (current == null) {
      return defaultValue;
    }
    current = current[key as keyof typeof current];
  }
  return current === undefined ? defaultValue : current;
}

function normalizeTag(input: string): string {
  return (
    input
      // 去掉首尾的方括号
      .replace(/^\[|]$/g, '')
      // 把所有的 # 换成空格
      .replace(/#/g, '(')
  );
}

export class WeChatLogger extends Logger {
  private readonly _logManager: WechatMinigame.GameLogManager | null = null;

  constructor() {
    super();

    try {
      const info = wx.getAccountInfoSync();
      this._logManager = wx.getGameLogManager({
        commonInfo: {
          env: get(info, 'miniProgram.envVersion', 'develop'),
          version: get(info, 'miniProgram.version', '0.0.0'),
        },
      });
    } catch {
      // no support
    }
  }

  protected reportDebug(module: string, ...data: unknown[]): void {
    if (!this._logManager) return;
    this._logManager.log({
      level: 'debug',
      key: normalizeTag(module),
      value: data,
      fail: () => console.warn(module, ...data),
    });
  }

  protected reportHttp(module: string, ...data: unknown[]): void {
    if (!this._logManager) return;
    // this._logManager.log({
    //   level: 'debug',
    //   key: normalizeTag(module),
    //   value: data,
    // });
  }

  protected reportError(module: string, ...data: unknown[]): void {
    if (!this._logManager) return;
    this._logManager.log({
      level: 'error',
      key: normalizeTag(module),
      value: data.map((t) => {
        if (t instanceof Error) {
          return {
            ...t,
            message: t.message,
            code: t['code'] || -1,
          };
        }
        return t;
      }),
      fail: () => console.warn(module, ...data),
    });
  }

  protected reportInfo(module: string, ...data: unknown[]): void {
    if (!this._logManager) return;
    this._logManager.log({
      level: 'info',
      key: normalizeTag(module),
      value: data,
      fail: () => console.warn(module, ...data),
    });
  }

  protected reportTrace(module: string, ...data: unknown[]): void {
    if (!this._logManager) return;
    this._logManager.log({
      level: 'info',
      key: normalizeTag(module),
      value: data,
      fail: () => console.warn(module, ...data),
    });
  }

  protected reportWarn(module: string, ...data: unknown[]): void {
    if (!this._logManager) return;
    this._logManager.log({
      level: 'warn',
      key: normalizeTag(module),
      value: data,
      fail: () => console.warn(module, ...data),
    });
  }
}
