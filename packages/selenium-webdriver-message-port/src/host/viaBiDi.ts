import { ChannelValue, LocalValue } from 'selenium-webdriver/bidi/protocolValue.js';
import type { ScriptManager } from 'selenium-webdriver/bidi/scriptManager.js';
import { v7 } from 'uuid';
import { BIDI_CHANNEL_NAME_PREFIX } from '../constant.ts';
import type { MessageHandler } from '../types.ts';
import createEngine from './createEngine.ts';

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

  try {
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
        (async (sendMessage: MessageHandler) => {
          // Intentionally break bundler because the code is running inside browser, should not be bundled.
          (
            (await import(
              ['@onting', 'selenium-webdriver-message-port', 'internal.js'].join('/')
            )) as typeof import('../browser/internal.ts')
          ).setBiDiPipeDestination(sendMessage);
        }),
      true,
      [LocalValue.createChannelValue(new ChannelValue(channelName))]
    );
  } catch (error) {
    messagePort.close();

    throw error;
  }

  return { messagePort };
}

export default viaBiDi;
