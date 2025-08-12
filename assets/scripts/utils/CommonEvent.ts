import { Event } from 'cc';

export class CommonEvent<T> extends Event {
  public readonly detail: T;

  constructor(name: string, bubbles: boolean, detail: T) {
    super(name, bubbles);
    this.detail = detail;
  }
}
