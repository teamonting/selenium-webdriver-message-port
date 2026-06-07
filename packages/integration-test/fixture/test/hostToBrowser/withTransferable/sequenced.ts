import { bidi, setup } from '@onting/selenium-webdriver-message-port/host';
import { scenario } from '@testduet/given-when-then';
import { waitFor } from '@testduet/wait-for';
import { expect } from 'expect';
import * as NodeTest from 'node:test';
import { logging } from 'selenium-webdriver';
import buildAndNavigate from '../../../shared/buildAndNavigate.ts';
import flushBrowserLogs from '../../../shared/flushBrowserLogs.ts';

scenario(
  'hostToBrowser/withTransferable/sequenced',
  bdd => {
    bdd
      .given(
        'browser loading withTransferable/sequenced.html',
        async () => buildAndNavigate('hostToBrowser/withTransferable/sequenced.html'),
        ({ teardown }) => teardown()
      )
      .and.oneOf([
        [
          'MessagePort via executeScript',
          precondition => ({ ...precondition, ...setup(precondition.webDriver) }),
          ({ messagePort }) => messagePort.close()
        ],
        [
          'MessagePort via BiDi',
          async precondition => ({
            ...precondition,
            ...(await bidi(precondition.scriptManager, { realmId: precondition.realmInfo.realmId })),
            poll: () => Promise.resolve()
          }),
          ({ messagePort }) => messagePort.close()
        ]
      ])
      .and('modified WebDriver.executeScript() that throws if called simultaneously', precondition => {
        const { webDriver } = precondition;

        const originalExecuteScript = webDriver.executeScript.bind(webDriver);
        let isExecuteScriptBusy = false;

        webDriver.executeScript = async <T>(...args: Parameters<typeof originalExecuteScript<T>>): Promise<T> => {
          if (isExecuteScriptBusy) {
            throw new Error('WebDriver.executeScript() should not be called simultaneously');
          }

          isExecuteScriptBusy = true;
          let result: T;

          try {
            result = await originalExecuteScript<T>(...args);
          } finally {
            isExecuteScriptBusy = false;
          }

          return result;
        };

        return precondition;
      })
      .when(
        'a message is posted on the root port followed by the sub port',
        async ({ messagePort }) => {
          const { port1, port2 } = new MessageChannel();

          messagePort.postMessage('Hello, World!', [port2]);
          port1.postMessage('Aloha!');

          return port1;
        },
        (_, port) => port.close()
      )
      .then('should have logged root and sub message to console', async ({ webDriver }) => {
        let logs: readonly logging.Entry[] = [];

        await waitFor(async () => {
          logs = [...logs, ...(await flushBrowserLogs(webDriver))];

          expect(logs).toContainEqual(
            expect.objectContaining({
              level: logging.Level.INFO,
              message: expect.stringContaining(JSON.stringify('Hello, World!'))
            })
          );

          expect(logs).toContainEqual(
            expect.objectContaining({
              level: logging.Level.INFO,
              message: expect.stringContaining(JSON.stringify('Aloha!'))
            })
          );
        });
      });
  },
  NodeTest
);
