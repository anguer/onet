import { LoggerManager } from 'db://assets/Framework/factories/logger/LoggerManager';

export class LogManager {
  public static trace(module: string, ...data: unknown[]): void {
    LoggerManager.instance.trace(module, ...data);
  }

  public static info(module: string, ...data: unknown[]): void {
    LoggerManager.instance.info(module, ...data);
  }

  public static debug(module: string, ...data: unknown[]): void {
    LoggerManager.instance.debug(module, ...data);
  }

  public static warn(module: string, ...data: unknown[]): void {
    LoggerManager.instance.warn(module, ...data);
  }

  public static error(module: string, ...data: unknown[]): void {
    LoggerManager.instance.error(module, ...data);
  }

  public static http(module: string, ...data: unknown[]): void {
    LoggerManager.instance.http(module, ...data);
  }
}
