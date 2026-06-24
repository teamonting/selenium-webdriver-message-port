import { ChannelValue, LocalValue } from 'selenium-webdriver/bidi/protocolValue.js';
import type { ScriptManager } from 'selenium-webdriver/bidi/scriptManager.js';
import { v7 } from 'uuid';
import { array, literal, object, parse, string } from 'valibot';
import { BIDI_CHANNEL_NAME_PREFIX } from '../constant.ts';
import { type ImprovisedGlobalThis, SymbolBiDiNotify, SymbolMessagePortFacility } from '../internal.ts';
import type { NotifyHandler } from '../types.ts';
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
    const poll = async () => {
      const callResult = await scriptManager.callFunctionInRealm(
        options.realmId,
        '' +
          ((symbolDescriptionForMessagePortFacility: string) => {
            return (
              (globalThis as ImprovisedGlobalThis)[
                Symbol.for(symbolDescriptionForMessagePortFacility) as typeof SymbolMessagePortFacility
              ]?.flushAll() ?? []
            );
          }),
        true,
        [LocalValue.createStringValue(SymbolMessagePortFacility.description!)]
      );

      if (callResult.resultType === 'exception') {
        throw callResult.exceptionDetails;
      }

      const schema = object({
        type: literal('array'),
        value: array(
          object({
            type: literal('string'),
            value: string()
          })
        )
      });

      for (const { value } of parse(schema, callResult.result).value) {
        processIncomingMessage(value);
      }
    };

    await scriptManager.onMessage(event => {
      if (!event || !('channel' in event) || event.channel !== channelName) {
        return;
      }

      void poll();
    });

    await scriptManager.callFunctionInRealm(
      options.realmId,
      '' +
        (async (SymbolDescriptionForBiDiNotify: string, notify: NotifyHandler) => {
          {
            (globalThis as ImprovisedGlobalThis)[
              Symbol.for(SymbolDescriptionForBiDiNotify) as typeof SymbolBiDiNotify
            ] = notify;
          }
        }),
      true,
      [
        LocalValue.createStringValue(SymbolBiDiNotify.description!),
        LocalValue.createChannelValue(new ChannelValue(channelName))
      ]
    );

    await poll();
  } catch (error) {
    messagePort.close();

    throw error;
  }

  return { messagePort };
}

export default viaBiDi;
