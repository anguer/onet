import { Serializer } from './Serializer';

export class NoneSerializer<T = any> implements Serializer<T> {
  state: T;

  setState(rawState: any): void {}
  getState() {
    return this.state;
  }
  patch(patches) {}
  teardown() {}
  handshake(bytes: number[]) {}
}
