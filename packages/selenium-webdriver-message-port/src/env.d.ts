/// <reference types="@onting/selenium-webdriver-message-port-types/selenium-webdriver.js" />

import type { BiDiMessagePortFacility, MessageHandler, MessagePortFacility, SerializedMessage } from './types.js';

declare global {
  var __seleniumWebDriverBiDiPipeDestination: MessageHandler | undefined;
  var __seleniumWebDriverMessagePortFacility: MessagePortFacility | undefined;
}

export {};
