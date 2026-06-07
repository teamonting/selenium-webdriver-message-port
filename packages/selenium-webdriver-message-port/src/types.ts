type MessageHandler = (data: string) => void;

interface MessagePortFacility {
  flushAll(): readonly string[];
  sendToBrowser(data: string): void;
}

export type { MessageHandler, MessagePortFacility };
