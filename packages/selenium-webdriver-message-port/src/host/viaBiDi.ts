import { ChannelValue, LocalValue } from 'selenium-webdriver/bidi/protocolValue.js';
import type { ScriptManager } from 'selenium-webdriver/bidi/scriptManager.js';
import { v7 } from 'uuid';
import { BIDI_CHANNEL_NAME_PREFIX } from '../constant';
import type { MessageHandler } from '../types';
import createEngine from './createEngine';

type BiDiOptions = {
  realmId: string;
};

async function viaBiDi(
  scriptManager: ScriptManager,
  options: BiDiOptions
): Promise<{
  readonly messagePort: MessagePort;
}> {
  const channelName = `${BIDI_CHANNEL_NAME_PREFIX}${v7()}`;

  const { messagePort, processIncomingMessage } = createEngine(async (fn, [data]) => {
    await scriptManager.callFunctionInRealm(options.realmId, '' + fn, false, [LocalValue.createStringValue(data)]);
  });

  await scriptManager.onMessage(event => {
    if (event.channel !== channelName) {
      return;
    }

    if (event.data.type !== 'string') {
      console.warn('Received message must be of type string, probably version mismatch.');

      return;
    }

    processIncomingMessage(event.data.value);
  });

  await scriptManager.callFunctionInRealm(
    options.realmId,
    '' +
      ((sendMessage: MessageHandler) => {
        globalThis.__seleniumWebDriverMessagePortBiDiPipeDestination = sendMessage;
      }),
    true,
    [LocalValue.createChannelValue(new ChannelValue(channelName))]
  );

  return { messagePort };
}

export default viaBiDi;
