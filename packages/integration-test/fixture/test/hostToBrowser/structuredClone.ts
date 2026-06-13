import { viaBiDi, viaExecuteScript } from '@onting/selenium-webdriver-message-port/host.js';
import { scenario } from '@testduet/given-when-then';
import { waitFor } from '@testduet/wait-for';
import { expect } from 'expect';
import * as NodeTest from 'node:test';
import { logging } from 'selenium-webdriver';
import buildAndNavigate from '../../shared/buildAndNavigate.ts';
import flushBrowserLogs from '../../shared/flushBrowserLogs.ts';

scenario(
  'hostToBrowser/structuredClone',
  bdd => {
    bdd
      .given(
        'browser loading hostToBrowser/structuredClone.html',
        async () => buildAndNavigate('hostToBrowser/structuredClone.html'),
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const one = {} as any;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const two = {} as any;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const three = {} as any;

        one.two = two;
        two.three = three;
        three.one = one;

        precondition.messagePort.postMessage(one);
      })
      .then('should have logged "true"', async ({ webDriver }) => {
        await waitFor(async () => {
          expect(await flushBrowserLogs(webDriver)).toContainEqual(
            expect.objectContaining({
              level: logging.Level.INFO,
              message: expect.stringContaining(JSON.stringify(true))
            })
          );
        });
      });
  },
  NodeTest
);
