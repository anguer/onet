import { Serializer } from './Serializer';
import schema from '@colyseus/schema';
import type { Room } from '../Room';

export type SchemaConstructor<T = schema.Schema> = new (...args: any[]) => T;

export function getStateCallbacks<T extends schema.Schema>(room: Room<T>) {
  try {
    // SchemaSerializer
    return schema.getDecoderStateCallbacks((room['serializer'] as unknown as SchemaSerializer<T>).decoder);
  } catch (e) {
    // NoneSerializer
    return undefined;
  }
}

export class SchemaSerializer<T extends schema.Schema = any> implements Serializer<T> {
  state: T;
  decoder: schema.Decoder<T>;

  setState(encodedState: Buffer, it?: schema.Iterator) {
    this.decoder.decode(encodedState, it);
  }

  getState() {
    return this.state;
  }

  patch(patches: Buffer, it?: schema.Iterator) {
    return this.decoder.decode(patches, it);
  }

  teardown() {
    this.decoder.root.clearRefs();
  }

  handshake(bytes: Buffer, it?: schema.Iterator) {
    if (this.state) {
      //
      // TODO: validate definitions against concreate this.state instance
      //
      schema.Reflection.decode(bytes, it); // no-op

      this.decoder = new schema.Decoder(this.state);
    } else {
      // initialize reflected state from server
      this.decoder = schema.Reflection.decode(bytes, it);
      this.state = this.decoder.state;
    }
  }
}
