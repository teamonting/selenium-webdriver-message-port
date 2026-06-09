import { viaBiDi, viaExecuteScript } from '@onting/selenium-webdriver-message-port/host.js';
import { scenario } from '@testduet/given-when-then';
import { waitFor } from '@testduet/wait-for';
import { expect } from 'expect';
import { messagePortRPC } from 'message-port-rpc';
import * as NodeTest from 'node:test';
import buildAndNavigate from '../../../shared/buildAndNavigate.ts';

scenario(
  'browserToHost/rpc/call',
  bdd => {
    bdd
      .given(
        'browser loading rpc/call.html',
        async () => buildAndNavigate('browserToHost/rpc/call.html'),
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
      .and('client stub', precondition => ({
        ...precondition,
        clientStub: messagePortRPC<() => string>(precondition.messagePort)
      }))
      .when('the calling the stub', precondition => ({ promise: precondition.clientStub() }))
      .then('should receive return value', async ({ poll }, { promise }) => {
        await waitFor(async () => {
          await poll();

          expect(
            await Promise.race([
              promise,
              new Promise((_, reject) => reject(new Error('Timed out while waiting for return value')))
            ])
          ).toBe('Hello, World!');
        });
      });
  },
  NodeTest
);
