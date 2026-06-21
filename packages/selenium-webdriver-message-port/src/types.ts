type NotifyHandler = () => void;

interface MessagePortFacility {
  flushAll(): readonly string[];
  sendToBrowser(data: string): void;
}

export type { MessagePortFacility, NotifyHandler };
