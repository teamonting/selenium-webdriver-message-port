import { viaBiDi, viaExecuteScript } from '@onting/selenium-webdriver-message-port/host.js';
import { scenario } from '@testduet/given-when-then';
import { waitFor } from '@testduet/wait-for';
import { expect } from 'expect';
import * as NodeTest from 'node:test';
import buildAndNavigate from '../../shared/buildAndNavigate.ts';

scenario(
  'browserToHost/simple',
  bdd => {
    bdd
      .given(
        'browser loading simple.html',
        async () => buildAndNavigate('browserToHost/simple.html'),
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
      .when('listening to "message" event once', precondition => {
        const messageEvents: MessageEvent[] = [];

        precondition.messagePort.addEventListener('message', event => messageEvents.push(event), { once: true });
        precondition.messagePort.start();

        return messageEvents;
      })
      .then('should receive a message', async ({ poll }, messageEvents) => {
        await waitFor(async () => {
          await poll();

          expect(messageEvents).toContainEqual(
            expect.objectContaining({
              data: 'Hello, World!',
              ports: []
            })
          );
        });
      });
  },
  NodeTest
);
