import type { WebDriver } from 'selenium-webdriver';
import { ImprovisedGlobalThis, SymbolMessagePortFacility } from '../internal.ts';
import type { MessagePortFacility } from '../types.ts';
import createEngine from './createEngine.ts';
import createSequencer from './createSequencer.ts';

function viaExecuteScript(webDriver: WebDriver): {
  readonly messagePort: MessagePort;
  readonly poll: () => Promise<void>;
} {
  // `executeScript()` calls (and all calls) are not queued in `selenium-webdriver`, they are HTTP POST in parallel.
  // Thus, multiple `executeScript()` calls could be processed in random order.
  // Thus, `MessagePort` could be used before they are transferred.
  // We need to sequence all `executeScript()` calls.
  const executeScriptSequencer = createSequencer();

  const { messagePort, processIncomingMessage } = createEngine(async (fn, [data]) => {
    await executeScriptSequencer(async () => {
      await webDriver.executeScript(fn, data);
    });
  });

  const poll = async () => {
    const entries = await webDriver.executeAsyncScript<readonly string[]>(
      (symbolDescriptionNameForMessagePortFacility: string, callback: (returnValue: readonly string[]) => void) => {
        (async () => {
          const facility: MessagePortFacility | undefined = (globalThis as ImprovisedGlobalThis)[
            Symbol.for(symbolDescriptionNameForMessagePortFacility) as typeof SymbolMessagePortFacility
          ];

          if (!facility) {
            throw new Error('The page does not have harness installed, cannot send message');
          }

          return facility.flushAll();
        })().then(callback as (returnValue: readonly string[]) => void);
      },
      SymbolMessagePortFacility.description!
    );

    for (const message of entries) {
      processIncomingMessage(message);
    }
  };

  return { messagePort, poll };
}

export default viaExecuteScript;
