import type { MessagePortFacility } from './types.js';

declare global {
  var __messagePortFacility: MessagePortFacility | undefined;
}

export {};
