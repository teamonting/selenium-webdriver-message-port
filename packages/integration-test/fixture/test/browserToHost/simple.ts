import { setup } from '@onting/selenium-webdriver-message-port/host';
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
        async () => ({ webDriver: await buildAndNavigate('browserToHost/simple.html') }),
        ({ webDriver }) => webDriver.quit()
      )
      .and(
        'its associated MessagePort',
        precondition => ({ ...precondition, ...setup(precondition.webDriver) }),
        ({ messagePort }) => messagePort.close()
      )
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
