import type { MessageHandler, MessagePortFacility } from './types';

const SymbolBiDiPipeDestination = Symbol.for('__seleniumWebDriverMessagePortBiDiPipeDestination');
const SymbolMessagePortFacility = Symbol.for('__seleniumWebDriverMessagePortFacility');

type ImprovisedGlobalThis = typeof globalThis & {
  [SymbolBiDiPipeDestination]?: MessageHandler | undefined;
  [SymbolMessagePortFacility]: MessagePortFacility | undefined;
};

function getBiDiPipeDestination(): MessageHandler | undefined {
  return (globalThis as ImprovisedGlobalThis)[SymbolBiDiPipeDestination];
}

function getMessagePortFacility(): MessagePortFacility | undefined {
  return (globalThis as ImprovisedGlobalThis)[SymbolMessagePortFacility];
}

function setBiDiPipeDestination(value: MessageHandler): void {
  (globalThis as ImprovisedGlobalThis)[SymbolBiDiPipeDestination] = value;
}

export {
  getBiDiPipeDestination,
  getMessagePortFacility,
  setBiDiPipeDestination,
  SymbolBiDiPipeDestination,
  SymbolMessagePortFacility
};

export type { ImprovisedGlobalThis };
