import type { MessagePortFacility, NotifyHandler } from './types.ts';

type ImprovisedGlobalThis<T = typeof globalThis> = T & {
  [SymbolBiDiNotify]?: NotifyHandler | undefined;
  [SymbolMessagePortFacility]?: MessagePortFacility | undefined;
};

const SymbolBiDiNotify = Symbol.for('@onting/selenium-webdriver-message-port/biDiNotify');
const SymbolMessagePortFacility = Symbol.for('@onting/selenium-webdriver-message-port/messagePortFacility');

export { SymbolBiDiNotify, SymbolMessagePortFacility };
export type { ImprovisedGlobalThis };
