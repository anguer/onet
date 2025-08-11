import { Logger } from 'db://assets/Framework/factories/logger/Logger';

export class InternalLogger extends Logger {
  protected reportDebug(module: string, ...data: unknown[]): void {}

  protected reportError(module: string, ...data: unknown[]): void {}

  protected reportHttp(module: string, ...data: unknown[]): void {}

  protected reportInfo(module: string, ...data: unknown[]): void {}

  protected reportTrace(module: string, ...data: unknown[]): void {}

  protected reportWarn(module: string, ...data: unknown[]): void {}
}
