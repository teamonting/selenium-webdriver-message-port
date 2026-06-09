import { viaBiDi, viaExecuteScript } from '@onting/selenium-webdriver-message-port/host.js';
import { scenario } from '@testduet/given-when-then';
import { waitFor } from '@testduet/wait-for';
import { expect } from 'expect';
import * as NodeTest from 'node:test';
import buildAndNavigate from '../../../shared/buildAndNavigate.ts';

scenario(
  'browserToHost/withTransferable/browserToHost',
  bdd => {
    bdd
      .given(
        'browser loading withTransferable/browserToHost.html',
        async () => buildAndNavigate('browserToHost/withTransferable/browserToHost.html'),
        ({ teardown }) => teardown()
      )
      .and.oneOf([
        [
          'MessagePort via executeScript',
          precondition => ({
            ...precondition,
            ...viaExecuteScript(precondition.webDriver)
          }),
          ({ messagePort }) => messagePort.close()
        ],
        [
          'MessagePort via BiDi',
          async precondition => ({
            ...precondition,
            ...(await viaBiDi(precondition.scriptManager, { realmId: precondition.realmInfo.realmId })),
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
      .then('should receive a message with a sub-MessagePort', async ({ poll }, messageEvents) => {
        await waitFor(async () => {
          await poll();

          expect(messageEvents).toContainEqual(
            expect.objectContaining({ data: 'Hello, World!', ports: [expect.any(MessagePort)] })
          );
        });
      })
      .when(
        'listening to sub-MessagePort',
        async ({ poll }, messageEvents) => {
          // TODO: `given-when-then` should run `then` in `after()` to keep the test sequential.
          //       We should be able to remove the following `waitFor()`.
          await waitFor(async () => {
            await poll();

            expect(messageEvents).toHaveLength(1);
          });

          const subMessageEvents: MessageEvent[] = [];
          const subMessagePort = messageEvents[0]!.ports[0]!;

          subMessagePort.addEventListener('message', event => subMessageEvents.push(event), { once: true });
          subMessagePort.start();

          return subMessageEvents;
        },
        (_, subMessageEvents) => subMessageEvents.forEach(event => event.ports.forEach(port => port.close()))
      )
      .then('should receive a sub-message', async ({ poll }, subMessageEvents) => {
        await waitFor(async () => {
          await poll();

          expect(subMessageEvents).toContainEqual(expect.objectContaining({ data: 'Aloha!', ports: [] }));
        });
      });
  },
  NodeTest
);
