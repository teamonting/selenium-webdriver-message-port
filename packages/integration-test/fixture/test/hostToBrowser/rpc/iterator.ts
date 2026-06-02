import { setup } from '@onting/selenium-webdriver-message-port/host';
import { scenario } from '@testduet/given-when-then';
import { waitFor } from '@testduet/wait-for';
import { expect } from 'expect';
import { forGenerator } from 'message-port-rpc';
import * as NodeTest from 'node:test';
import { logging } from 'selenium-webdriver';
import buildAndNavigate from '../../../shared/buildAndNavigate.ts';
import flushBrowserLogs from '../../../shared/flushBrowserLogs.ts';

scenario(
  'hostToBrowser/rpc/iterator',
  bdd => {
    bdd
      .given(
        'browser loading rpc/iterator.html',
        async () => ({ webDriver: await buildAndNavigate('hostToBrowser/rpc/iterator.html') }),
        ({ webDriver }) => webDriver.quit()
      )
      .and(
        'its associated MessagePort',
        precondition => ({ ...precondition, ...setup(precondition.webDriver) }),
        ({ messagePort }) => messagePort.close()
      )
      .when('the server stub is configured', precondition => ({
        ...precondition,
        serverStub: forGenerator<() => Generator<number>>(precondition.messagePort, function* () {
          yield 1;
          yield 2;
          yield 3;
        })
      }))
      .then('should have logged the return value to console', async ({ poll, webDriver }) => {
        await waitFor(async () => {
          await poll();

          expect(await flushBrowserLogs(webDriver)).toContainEqual(
            expect.objectContaining({
              level: logging.Level.INFO,
              message: expect.stringContaining(JSON.stringify('[1,2,3]'))
            })
          );
        });
      });
  },
  NodeTest
);
