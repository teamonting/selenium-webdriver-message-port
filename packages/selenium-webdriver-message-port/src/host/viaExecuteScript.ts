import type { WebDriver } from 'selenium-webdriver';
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
    const entries = await webDriver.executeAsyncScript<readonly string[]>(callback => {
      (async () => {
        // Intentionally break bundler.
        const messagePortFacility = (
          await import(['@onting', 'selenium-webdriver-message-port', 'internal.js'].join('/'))
        ).getMessagePortFacility();

        if (!messagePortFacility) {
          throw new Error('The page does not have harness installed');
        }

        return messagePortFacility.flushAll();
      })().then(callback as (returnValue: readonly string[]) => void);
    });

    for (const message of entries) {
      processIncomingMessage(message);
    }
  };

  return { messagePort, poll };
}

export default viaExecuteScript;
