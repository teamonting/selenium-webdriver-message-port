type SerializedMessage = {
  readonly data: unknown;
  readonly portId: string;
  readonly transferPortIds: readonly string[];
};

type MessageHandler = (data: string) => void;

interface MessagePortFacility {
  flushAll(): readonly string[];
  sendToBrowser(data: string): void;
}

export type { MessageHandler, MessagePortFacility, SerializedMessage };
