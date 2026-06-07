/// <reference types="../env.d.ts" />

import { v7 } from 'uuid';
import { ROOT_MESSAGE_PORT } from '../constant.ts';
import { marshal, unmarshal } from '../marshal.ts';
import type { MessageHandler, MessagePortFacility, SerializedMessage } from '../types.js';

const portMap = new Map<string, MessagePort>();
const queue: string[] = [];

function flushAll(): readonly string[] {
  return Object.freeze(queue.splice(0));
}

function tryFlushToPipe() {
  const pipingMessageHandler: MessageHandler | undefined = globalThis.__seleniumWebDriverBiDiPipeDestination;

  if (pipingMessageHandler) {
    let message: string | undefined;

    while (typeof (message = queue.shift()) === 'string') {
      pipingMessageHandler(message);
    }
  }
}

function createMessagePort(portId: string): MessagePort {
  if (portMap.has(portId)) {
    throw new Error(`MessagePort with id "${portId}" is already registered, cannot register again`);
  }

  const { port1, port2 } = new MessageChannel();

  registerMessagePort(port1, portId);

  return port2;
}

function registerMessagePort(port: MessagePort, portId: string): void {
  if (portMap.has(portId)) {
    throw new Error(`MessagePort with id "${portId}" is already registered, cannot register again`);
  }

  portMap.set(portId, port);

  port.addEventListener('message', ({ data, ports }) => {
    // Because MessagePort will detach on send, thus, postMessage() cannot transfer the same MessagePort twice.
    // We don't need to check if the port already have an ID or not.
    // MessagePort cannot be sent twice, thus it must be new.
    // Otherwise postMessage() would have already fail and should never reach this code block.

    const transferPortIds = ports.map(port => {
      const id = v7();

      registerMessagePort(port, id);

      return id;
    });

    queue.push(
      JSON.stringify({
        data: marshal(data, ports),
        portId,
        transferPortIds
      })
    );

    tryFlushToPipe();
  });

  port.start();
}

function sendToBrowser(data: string): void {
  const { data: payload, portId, transferPortIds } = JSON.parse(data) as SerializedMessage;

  const port = portMap.get(portId);

  if (!port) {
    console.warn(`Host should not send to unbound port "${portId}"`);

    return;
  }

  // postMessage() will neuter MessagePort after sent, thus, every port received must be new transfer.
  const transfer = transferPortIds.map(transferPortId => createMessagePort(transferPortId));

  port.postMessage(unmarshal(payload, transfer), transfer);
}

globalThis.__seleniumWebDriverMessagePortFacility = Object.freeze({
  flushAll,
  sendToBrowser
} satisfies MessagePortFacility);

let _pipe: MessageHandler | undefined = globalThis.__seleniumWebDriverBiDiPipeDestination;

Object.defineProperty(globalThis, '__seleniumWebDriverBiDiPipeDestination', {
  configurable: false,
  enumerable: true,
  get() {
    return _pipe;
  },
  set(value: MessageHandler | undefined) {
    _pipe = value;
    tryFlushToPipe();
  }
});

tryFlushToPipe();

const messagePort = createMessagePort(ROOT_MESSAGE_PORT);

export { messagePort };
