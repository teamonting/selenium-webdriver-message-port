/// <reference types="../env.d.ts" />

import { v7 } from 'uuid';
import { parse } from 'valibot';
import { ROOT_MESSAGE_PORT } from '../constant.ts';
import { marshal, unmarshal } from '../marshal.ts';
import { serializedMessageSchema, type SerializedMessage } from '../SerializedMessage.ts';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ExecuteFn<T extends (...args: readonly any[]) => any> = (fn: T, args: Parameters<T>) => Promise<void>;

function createEngine(executeFn: ExecuteFn<(data: string) => void>): {
  messagePort: MessagePort;
  processIncomingMessage: (data: string) => void;
} {
  const portMap = new Map<string, MessagePort>();

  const createMessagePort = (id: string): MessagePort => {
    if (portMap.has(id)) {
      throw new Error(`MessagePort with id "${id}" is already registered, cannot register again`);
    }

    const { port1, port2 } = new MessageChannel();

    registerMessagePort(port1, id);

    return port2;
  };

  const registerMessagePort = (port: MessagePort, portId: string): void => {
    if (portMap.has(portId)) {
      throw new Error(`MessagePort with id "${portId}" is already registered, cannot register again`);
    }

    portMap.set(portId, port);

    port.addEventListener('message', ({ data, ports }) => {
      void executeFn(
        async (data: string) => {
          // Intentionally break bundler because the code is running inside browser, should not be bundled.
          (
            (await import(
              ['@onting', 'selenium-webdriver-message-port', 'internal.js'].join('/')
            )) as typeof import('../browser/internal.js')
          ).sendToBrowser(data);
        },
        [
          JSON.stringify(
            parse(serializedMessageSchema, {
              data: marshal(data, ports),
              portId,
              transferPortIds: ports.map(port => {
                // Because MessagePort will be neutered on transfer, thus, postMessage() cannot transfer the same MessagePort twice.
                // We don't need to check if the port already have an ID or not, it must be new.
                // Otherwise postMessage() would have already fail and should never reach this code block.
                const id = v7();

                registerMessagePort(port, id);

                return id;
              })
            } satisfies SerializedMessage)
          )
        ]
      ).catch(error => console.error(error));
    });

    port.start();
  };

  const processIncomingMessage = (data: string) => {
    const { data: payload, portId, transferPortIds } = parse(serializedMessageSchema, JSON.parse(data));

    const port = portMap.get(portId);

    if (!port) {
      console.warn(`Browser should not send to unbound port "${portId}"`);

      return;
    }

    // postMessage() will neuter MessagePort after sent, thus, every port received must be new transfer.
    const transfer = transferPortIds.map((transferPortId: string) => createMessagePort(transferPortId));

    port.postMessage(unmarshal(payload, transfer), transfer);
  };

  return Object.freeze({
    messagePort: createMessagePort(ROOT_MESSAGE_PORT),
    processIncomingMessage
  });
}

export default createEngine;
