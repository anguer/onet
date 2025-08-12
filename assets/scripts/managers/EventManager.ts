import { EventEmitter } from 'db://assets/Framework/lib/EventEmitter';
import { NonogramLevel } from 'db://assets/scripts/models/NonogramLevel';

enum EventType {
  START_GAME = 'START_GAME',
  LEVEL_COMPLETED = 'LEVEL_COMPLETED',
}

export interface Events {
  [EventType.START_GAME]: NonogramLevel;
  [EventType.LEVEL_COMPLETED]: NonogramLevel;
}

class CustomEventEmitter extends EventEmitter<EventType, Events> {
  public readonly EventType = EventType;
}

const EventManager = new CustomEventEmitter();
export { EventManager };
export default EventManager;
