// TODO: Merge this with setup().
/// <reference types="node" />

import { ChannelValue, LocalValue } from 'selenium-webdriver/bidi/protocolValue.js';
import type { ScriptManager } from 'selenium-webdriver/bidi/scriptManager.js';
import { v7 } from 'uuid';
import { BIDI_CHANNEL_NAME_PREFIX, ROOT_MESSAGE_PORT } from '../constant.ts';
import { marshal, unmarshal } from '../marshal.ts';
import type { MessageHandler, SerializedMessage } from '../types.ts';
import createSequencer from './createSequencer.ts';

type BiDiOptions = {
  realmId: string;
};

async function setup(
  scriptManager: ScriptManager,
  options: BiDiOptions
): Promise<{ readonly messagePort: MessagePort }> {
  const channelName = `${BIDI_CHANNEL_NAME_PREFIX}${v7()}`;
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
        await scriptManager.callFunctionInRealm(
          options.realmId,
          '' +
            ((messageJSON: string) => {
              const message = JSON.parse(messageJSON) as SerializedMessage;

              if (!globalThis.__seleniumWebDriverMessagePortFacility) {
                throw new Error('The page does not have harness installed, cannot send message');
              }

              globalThis.__seleniumWebDriverMessagePortFacility.sendToBrowser(message);
            }),
          false,
          [
            LocalValue.createStringValue(
              JSON.stringify({
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
        );
      }).catch(error => console.error(error));
    });

    port.start();
  };

  const messagePort = createMessagePort(ROOT_MESSAGE_PORT);

  await scriptManager.onMessage(event => {
    if (event.channel !== channelName) {
      return;
    }

    const { data, portId, transferPortIds } = JSON.parse((event.data as any).value);

    const port = portMap.get(portId);

    if (!port) {
      console.warn(`Browser should not send to unbound port "${portId}"`);

      return;
    }

    // postMessage() will neuter MessagePort after sent, thus, every port received must be new transfer.
    const transfer = transferPortIds.map((transferPortId: string) => createMessagePort(transferPortId));

    port.postMessage(unmarshal(data, transfer), transfer);
  });

  await scriptManager.callFunctionInRealm(
    options.realmId,
    '' +
      ((sendMessage: MessageHandler) => {
        globalThis.__seleniumWebDriverBiDiPipeDestination = sendMessage;
      }),
    true,
    [LocalValue.createChannelValue(new ChannelValue(channelName))]
  );

  return Object.freeze({
    messagePort
  });
}

export default setup;
