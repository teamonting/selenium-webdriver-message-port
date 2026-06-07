type SerializedMessage = {
  readonly data: unknown;
  readonly portId: string;
  readonly transferPortIds: readonly string[];
};

type MessageHandler = (message: SerializedMessage) => void;

interface MessagePortFacility {
  flushAll(): readonly SerializedMessage[];
  sendToBrowser(message: SerializedMessage): void;
}

export type { MessageHandler, MessagePortFacility, SerializedMessage };
