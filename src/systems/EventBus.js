// Simple global event bus wrapper
class EventBusClass extends Phaser.Events.EventEmitter {}
export const EventBus = new EventBusClass();
