import { bidi, setup } from '@onting/selenium-webdriver-message-port/host';
import { scenario } from '@testduet/given-when-then';
import { waitFor } from '@testduet/wait-for';
import { expect } from 'expect';
import * as NodeTest from 'node:test';
import { logging } from 'selenium-webdriver';
import buildAndNavigate from '../../../shared/buildAndNavigate.ts';
import flushBrowserLogs from '../../../shared/flushBrowserLogs.ts';

scenario(
  'browserToHost/withTransferable/hostToBrowser',
  bdd => {
    bdd
      .given(
        'browser loading withTransferable/hostToBrowser.html',
        async () => buildAndNavigate('browserToHost/withTransferable/hostToBrowser.html'),
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
      .when(
        'listening to "message" event once',
        precondition => {
          const messageEvents: MessageEvent[] = [];

          precondition.messagePort.addEventListener('message', event => messageEvents.push(event), { once: true });
          precondition.messagePort.start();

          return messageEvents;
        },
        (_, messageEvents) => messageEvents.forEach(event => event.ports.forEach(port => port.close()))
      )
      .then('should receive "Hello, World!" with a sub-MessagePort', async ({ poll }, messageEvents) => {
        await waitFor(async () => {
          await poll();

          expect(messageEvents).toContainEqual(
            expect.objectContaining({
              data: 'Hello, World!',
              ports: [expect.any(MessagePort)]
            })
          );
        });
      })
      .when(
        'sending a message via the sub-MessagePort',
        async ({ poll }, messageEvents) => {
          // TODO: `given-when-then` should run `then` in `after()` to keep the test sequential.
          //       We should be able to remove the following `waitFor()`.
          await waitFor(async () => {
            await poll();

            expect(messageEvents).toHaveLength(1);
          });

          const subMessagePort = messageEvents[0]!.ports[0]!;

          subMessagePort.postMessage('Aloha!');

          return subMessagePort;
        },
        (_, subMessagePort) => subMessagePort.close()
      )
      .then('should have logged the message to console', async ({ webDriver }) => {
        await waitFor(async () => {
          expect(await flushBrowserLogs(webDriver)).toContainEqual(
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
