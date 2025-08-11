import { log, debug, warn, error } from 'cc';

const styles = {
  trace: 'background: #f43f5e; padding: 1px 3px; border-radius: 3px; color: #fff',
  info: 'background: #3b82f6; padding: 1px 3px; border-radius: 3px; color: #fff',
  debug: 'background: #6b7280; padding: 1px 3px; border-radius: 3px; color: #fff',
  warn: 'background: #facc15; padding: 1px 3px; border-radius: 3px; color: #000',
  error: 'background: #ef4444; padding: 1px 3px; border-radius: 3px; color: #fff',
  http: 'background: #22c55e; padding: 1px 3px; border-radius: 3px; color: #fff',
  reset: 'background: transparent',
};

export abstract class Logger {
  protected abstract reportTrace(module: string, ...data: unknown[]): void;
  public trace(module: string, ...data: unknown[]): void {
    // log(module, ...data);
    console.log(`%c TRACE %c ${module}`, styles.trace, styles.reset, ...data);
    this.reportTrace(module, ...data);
  }

  protected abstract reportInfo(module: string, ...data: unknown[]): void;
  public info(module: string, ...data: unknown[]): void {
    // log(module, ...data);
    log(`%c INFO %c ${module}`, styles.info, styles.reset, ...data);
    this.reportInfo(module, ...data);
  }

  protected abstract reportDebug(module: string, ...data: unknown[]): void;
  public debug(module: string, ...data: unknown[]): void {
    // debug(module, ...data);
    debug(`%c DEBUG %c ${module}`, styles.debug, styles.reset, ...data);
    this.reportDebug(module, ...data);
  }

  protected abstract reportWarn(module: string, ...data: unknown[]): void;
  public warn(module: string, ...data: unknown[]): void {
    // warn(module, ...data);
    warn(`%c WARN %c ${module}`, styles.warn, styles.reset, ...data);
    this.reportWarn(module, ...data);
  }

  protected abstract reportError(module: string, ...data: unknown[]): void;
  public error(module: string, ...data: unknown[]): void {
    // error(module, ...data);
    console.error(`%c ERROR %c ${module}`, styles.error, styles.reset, ...data);
    this.reportError(module, ...data);
  }

  protected abstract reportHttp(module: string, ...data: unknown[]): void;
  public http(module: string, ...data: unknown[]): void {
    log(`%c HTTP %c ${module}`, styles.http, styles.reset, ...data);
    this.reportHttp(module, ...data);
  }
}
