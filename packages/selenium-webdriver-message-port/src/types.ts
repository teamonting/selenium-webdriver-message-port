type SerializedMessage = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly data: any;
  readonly portId: string;
  readonly transferPortIds: readonly string[];
};

interface MessagePortFacility {
  flushAll(): readonly SerializedMessage[];
  sendToBrowser(message: SerializedMessage): void;
}

export type { MessagePortFacility, SerializedMessage };
