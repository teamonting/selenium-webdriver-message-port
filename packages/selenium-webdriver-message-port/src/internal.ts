import type { MessageHandler, MessagePortFacility } from './types.ts';

type ImprovisedGlobalThis<T = typeof globalThis> = T & {
  [SymbolBiDiPipeDestination]?: MessageHandler | undefined;
  [SymbolMessagePortFacility]?: MessagePortFacility | undefined;
};

const SymbolBiDiPipeDestination = Symbol.for('@onting/selenium-webdriver-message-port/biDiPipeDestination');
const SymbolMessagePortFacility = Symbol.for('@onting/selenium-webdriver-message-port/messagePortFacility');

export { SymbolBiDiPipeDestination, SymbolMessagePortFacility };
export type { ImprovisedGlobalThis };
