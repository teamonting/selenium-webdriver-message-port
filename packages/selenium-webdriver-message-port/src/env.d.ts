/// <reference types="@onting/common/selenium-webdriver.js" />

import type { MessageHandler, MessagePortFacility } from './types.js';

declare global {
  var __seleniumWebDriverMessagePortBiDiPipeDestination: MessageHandler | undefined;
  var __seleniumWebDriverMessagePortFacility: MessagePortFacility | undefined;
}

export {};
