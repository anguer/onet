import { EventTarget } from 'cc';

export class EventEmitter<Types extends string | number, Events extends Record<Types, unknown>> {
  private readonly _event: EventTarget;

  constructor(...props: never[]) {
    this._event = new EventTarget(props);
  }

  public on<K extends Types>(type: K, callback: (event: Events[K]) => void, target: unknown) {
    this._event.on(type, callback, target);
  }

  public once<K extends Types>(type: K, callback: (event: Events[K]) => void, target: unknown) {
    this._event.once(type, callback, target);
  }

  public off<K extends Types>(type: K, callback: (event: Events[K]) => void, target: unknown) {
    this._event.off(type, callback, target);
  }

  public offAll(typeOrTarget: unknown) {
    this._event.targetOff(typeOrTarget);
  }

  public emit<K extends Types>(type: K, args: Events[K]) {
    this._event.emit(type, args);
  }
}

// Examples
// enum MyEventTypes {
//   A = 'a',
//   B = 'b',
// }
// interface MyEvents {
//   [MyEventTypes.A]: { name: number };
//   [MyEventTypes.B]: { age: number };
// }
// const emitter = new EventEmitter<MyEventTypes, MyEvents>();
// emitter.on(MyEventTypes.A, ({ name }) => {}, this);
// emitter.on(MyEventTypes.B, ({ age }) => {}, this);
