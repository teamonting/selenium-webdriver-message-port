/// <reference types="../env.d.ts" />

import { v7 } from 'uuid';
import { ROOT_MESSAGE_PORT } from '../constant.ts';
import { marshal, unmarshal } from '../marshal.ts';
import type { MessagePortFacility, SerializedMessage } from '../types.js';

const portMap = new Map<string, MessagePort>();
const queue: SerializedMessage[] = [];

function flushAll(): readonly SerializedMessage[] {
  return Object.freeze(queue.splice(0));
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
      Object.freeze({
        data: marshal(data, ports),
        portId,
        transferPortIds
      })
    );
  });

  port.start();
}

function sendToBrowser(message: SerializedMessage): void {
  const { data, portId, transferPortIds } = message;

  const port = portMap.get(portId);

  if (!port) {
    console.warn(`Host should not send to unbound port "${portId}"`);

    return;
  }

  // postMessage() will neuter MessagePort after sent, thus, every port received must be new transfer.
  const transfer = transferPortIds.map(transferPortId => createMessagePort(transferPortId));

  port.postMessage(unmarshal(data, transfer), transfer);
}

globalThis.__seleniumWebDriverMessagePortFacility = Object.freeze({
  flushAll,
  sendToBrowser
} satisfies MessagePortFacility);

const messagePort = createMessagePort(ROOT_MESSAGE_PORT);

export { messagePort };
