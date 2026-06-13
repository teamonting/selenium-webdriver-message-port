import { viaBiDi } from '@onting/selenium-webdriver-message-port/host.js';
import { scenario } from '@testduet/given-when-then';
import { waitFor } from '@testduet/wait-for';
import { expect } from 'expect';
import * as NodeTest from 'node:test';
import buildAndNavigate from '../shared/buildAndNavigate.ts';

scenario(
  'rapidClose',
  bdd => {
    bdd
      .given(
        'browser loading rapidClose.html',
        async () => buildAndNavigate('rapidClose.html'),
        ({ teardown }) => teardown()
      )
      .and(
        'MessagePort via BiDi',
        async precondition => ({
          ...precondition,
          ...(await viaBiDi(precondition.scriptManager, { realmId: precondition.realmInfo.realmId })),
          poll: () => Promise.resolve()
        }),
        ({ messagePort }) => messagePort.close()
      )
      .and('ScriptManager of worker', async precondition => {
        const workerRealmInfo = await waitFor(async () => {
          const realms: readonly { readonly realmType?: string | undefined }[] =
            await precondition.scriptManager.getAllRealms();
          const workerRealm = realms.find(realm => realm.realmType === 'dedicated-worker');

          expect(workerRealm).toBeTruthy();

          return workerRealm;
        });

        return { ...precondition, workerRealmInfo };
      })
      .and('worker is terminated', precondition => {
        precondition.messagePort.postMessage('terminate');

        return precondition;
      })
      .when(
        'creating MessagePort via BiDi to terminated worker',
        async precondition => {
          try {
            await viaBiDi(precondition.scriptManager, { realmId: precondition.workerRealmInfo.realmId });
          } catch (error) {
            return error;
          }

          return;
        },
        () => {
          // Intentionally left blank.
          // We are not calling MessagePort.close() here.
          // When viaBiDi() failed prematurely, it should close MessagePort itself.
        }
      )
      .then('should throw', (_, error) => {
        expect(error).toBeTruthy();
      });
  },
  NodeTest
);
