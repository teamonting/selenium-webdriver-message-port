import { workthru } from 'workthru';

const MESSAGE_PORT = '@@__SELENIUM_WEBDRIVER_MESSAGE_PORT__@@';

/**
 * Marshals the data and mask `MessagePort` into ['@@__SELENIUM_WEBDRIVER_MESSAGE_PORT__@@', 1].
 *
 * MessagePort cannot be sent directly across WebDriver.executeScript.
 *
 * We are walking the postMessage(data) and turning MessagePort into ['@@__SELENIUM_WEBDRIVER_MESSAGE_PORT__@@', 1].
 *
 * The second argument is the index of the MessagePort as they appear in Transferable[].
 *
 * @param target
 * @param transferable
 * @returns
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function marshal(target: any, transferable: readonly Transferable[]): any {
  return workthru(target, value => {
    if (value instanceof MessagePort) {
      const index = transferable.indexOf(value);

      if (index === -1) {
        throw new Error('Cannot marshal MessagePort: it must be included in the transfer list');
      }

      return [MESSAGE_PORT, index] as const;
    }

    return value;
  });
}

/**
 * Unmarshals the data and unmask ['@@__SELENIUM_WEBDRIVER_MESSAGE_PORT__@@', 1] into `MessagePort`.
 *
 * MessagePort cannot be sent directly across WebDriver.executeScript.
 *
 * We are walking the postMessage(data) and turning MessagePort into ['@@__SELENIUM_WEBDRIVER_MESSAGE_PORT__@@', 1].
 *
 * The second argument is the index of the MessagePort as they appear in Transferable[].
 *
 * @param target
 * @param transferable
 * @returns
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function unmarshal(target: any, transferable: readonly Transferable[]): any {
  return workthru(target, value => {
    if (Array.isArray(value) && value[0] === MESSAGE_PORT) {
      const index = value[1];

      if (typeof index !== 'number' || !Number.isInteger(index) || index < 0 || index >= transferable.length) {
        throw new Error(`Cannot unmarshal MessagePort: invalid transfer index ${String(index)}`);
      }

      return transferable[index];
    }

    return value;
  });
}

export { marshal, unmarshal };
