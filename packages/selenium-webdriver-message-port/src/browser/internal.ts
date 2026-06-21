/// <reference types="../env.d.ts" />

import { v7 } from 'uuid';
import { parse } from 'valibot';
import { marshal, unmarshal } from '../marshal.ts';
import { serializedMessageSchema, type SerializedMessage } from '../SerializedMessage.ts';
import type { MessageHandler } from '../types.js';

const portMap = new Map<string, MessagePort>();
const queue: string[] = [];

function flushAll(): readonly string[] {
  return Object.freeze(queue.splice(0));
}

function tryFlushToPipe() {
  const pipingMessageHandler = getBiDiPipeDestination();

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
      JSON.stringify(
        parse(serializedMessageSchema, {
          data: marshal(data, ports),
          portId,
          transferPortIds
        } satisfies SerializedMessage)
      )
    );

    // Flush to pipe if there is a destination assigned.
    tryFlushToPipe();
  });

  port.start();
}

function sendToBrowser(data: string): void {
  const { data: payload, portId, transferPortIds } = parse(serializedMessageSchema, JSON.parse(data));

  const port = portMap.get(portId);

  if (!port) {
    console.warn(`Host should not send to unbound port "${portId}"`);

    return;
  }

  // postMessage() will neuter MessagePort after sent, thus, every port received must be new transfer.
  const transfer = transferPortIds.map(transferPortId => createMessagePort(transferPortId));

  port.postMessage(unmarshal(payload, transfer), transfer);
}

let biDiPipeDestination: MessageHandler | undefined;

function getBiDiPipeDestination() {
  return biDiPipeDestination;
}

function setBiDiPipeDestination(handler: MessageHandler) {
  biDiPipeDestination = handler;

  // Flush to pipe when it is being assigned.
  tryFlushToPipe();
}

// Flush to pipe when it was assigned initially before this module is loaded.
tryFlushToPipe();

export { createMessagePort, flushAll, getBiDiPipeDestination, sendToBrowser, setBiDiPipeDestination };
