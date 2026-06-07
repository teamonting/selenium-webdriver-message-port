import { bidi, setup } from '@onting/selenium-webdriver-message-port/host';
import { scenario } from '@testduet/given-when-then';
import { waitFor } from '@testduet/wait-for';
import { expect } from 'expect';
import { messagePortRPC } from 'message-port-rpc';
import * as NodeTest from 'node:test';
import { logging } from 'selenium-webdriver';
import buildAndNavigate from '../../../shared/buildAndNavigate.ts';
import flushBrowserLogs from '../../../shared/flushBrowserLogs.ts';

scenario(
  'hostToBrowser/rpc/call',
  bdd => {
    bdd
      .given(
        'browser loading rpc/call.html',
        async () => buildAndNavigate('hostToBrowser/rpc/call.html'),
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
      .when('the server stub is configured', precondition => ({
        ...precondition,
        serverStub: messagePortRPC<() => string>(precondition.messagePort, () => 'Hello, World!')
      }))
      .then('should have logged the return value to console', async ({ poll, webDriver }) => {
        await waitFor(async () => {
          await poll();

          expect(await flushBrowserLogs(webDriver)).toContainEqual(
            expect.objectContaining({
              level: logging.Level.INFO,
              message: expect.stringContaining(JSON.stringify('Hello, World!'))
            })
          );
        });
      });
  },
  NodeTest
);
