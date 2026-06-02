/// <reference types="../env.d.ts" />

import type { WebDriver } from 'selenium-webdriver';
import { v7 } from 'uuid';
import { ROOT_MESSAGE_PORT } from '../constant.ts';
import { marshal, unmarshal } from '../marshal.ts';
import type { SerializedMessage } from '../types.ts';
import createSequencer from './createSequencer.ts';

function setup(webDriver: WebDriver): {
  messagePort: MessagePort;
  poll(): Promise<void>;
} {
  const portMap = new Map<string, MessagePort>();

  // `executeScript()` calls (and all calls) are not queued in `selenium-webdriver`, they are HTTP POST in parallel.
  // Thus, multiple `executeScript()` calls could be processed in random order.
  // Thus, `MessagePort` could be used before they are transferred.
  // We need to sequence all `executeScript()` calls.
  const executeScriptSequencer = createSequencer();

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
      void executeScriptSequencer(async () => {
        await webDriver.executeScript<void>(
          (message: SerializedMessage) => {
            if (!globalThis.__messagePortFacility) {
              throw new Error('The page does not have harness installed, cannot send message');
            }

            globalThis.__messagePortFacility.sendToBrowser(message);
          },
          {
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
          } satisfies SerializedMessage
        );
      }).catch(error => console.error(error));
    });

    port.start();
  };

  const poll = async () => {
    const entries = await webDriver.executeScript<SerializedMessage[]>(() => {
      if (!globalThis.__messagePortFacility) {
        throw new Error('The page does not have harness installed');
      }

      return globalThis.__messagePortFacility.flushAll();
    });

    for (const { data, portId, transferPortIds } of entries) {
      const port = portMap.get(portId);

      if (!port) {
        console.warn(`Browser should not send to unbound port "${portId}"`);

        continue;
      }

      // postMessage() will neuter MessagePort after sent, thus, every port received must be new transfer.
      const transfer = transferPortIds.map(transferPortId => createMessagePort(transferPortId));

      port.postMessage(unmarshal(data, transfer), transfer);
    }
  };

  return Object.freeze({
    messagePort: createMessagePort(ROOT_MESSAGE_PORT),
    poll
  });
}

export default setup;
