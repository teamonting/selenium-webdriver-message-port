import { bidi, setup } from '@onting/selenium-webdriver-message-port/host';
import { scenario } from '@testduet/given-when-then';
import { waitFor } from '@testduet/wait-for';
import { expect } from 'expect';
import * as NodeTest from 'node:test';
import { logging } from 'selenium-webdriver';
import buildAndNavigate from '../../shared/buildAndNavigate.ts';
import flushBrowserLogs from '../../shared/flushBrowserLogs.ts';

scenario(
  'hostToBrowser/simple',
  bdd => {
    bdd
      .given(
        'browser loading simple.html',
        async () => buildAndNavigate('hostToBrowser/simple.html'),
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
      .when('a message is posted', async ({ messagePort }) => messagePort.postMessage('Hello, World!'))
      .then('should have logged the message to console', async ({ webDriver }) => {
        await waitFor(async () => {
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
