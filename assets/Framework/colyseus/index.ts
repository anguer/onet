export { Client, MatchMakeError, type EndpointSettings, type ClientOptions } from './Client';
export type { JoinOptions } from './Client';
export { Protocol, ErrorCode } from './Protocol';
export type { SeatReservation } from './Protocol';
export { Room } from './Room';
export type { RoomAvailable } from './Room';
export { ServerError } from './errors/Errors';

/*
 * Serializers
 */
import { SchemaSerializer, getStateCallbacks } from './serializer/SchemaSerializer';
import { NoneSerializer } from './serializer/NoneSerializer';
import { registerSerializer } from './serializer/Serializer';

export { registerSerializer, SchemaSerializer, getStateCallbacks };
registerSerializer('schema', SchemaSerializer);
registerSerializer('none', NoneSerializer);
