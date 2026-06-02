import { setup } from '@onting/selenium-webdriver-message-port/host';
import { scenario } from '@testduet/given-when-then';
import { waitFor } from '@testduet/wait-for';
import { expect } from 'expect';
import { forGenerator } from 'message-port-rpc';
import * as NodeTest from 'node:test';
import buildAndNavigate from '../../../shared/buildAndNavigate.ts';

scenario(
  'browserToHost/rpc/iterator',
  bdd => {
    bdd
      .given(
        'browser loading rpc/iterator.html',
        async () => ({ webDriver: await buildAndNavigate('browserToHost/rpc/iterator.html') }),
        ({ webDriver }) => webDriver.quit()
      )
      .and(
        'its associated MessagePort',
        precondition => ({ ...precondition, ...setup(precondition.webDriver) }),
        ({ messagePort }) => messagePort.close()
      )
      .and('client stub', precondition => ({
        ...precondition,
        clientStub: forGenerator<() => Generator<number>>(precondition.messagePort)
      }))
      .when('the calling the stub', precondition => {
        const values: number[] = [];

        (async () => {
          for await (const value of precondition.clientStub()) {
            values.push(value);
          }
        })();

        return values;
      })
      .then('should receive return value', async ({ poll }, values) => {
        await waitFor(async () => {
          await poll();

          expect(values).toEqual([1, 2, 3]);
        });
      });
  },
  NodeTest
);
