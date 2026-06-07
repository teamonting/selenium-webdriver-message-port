import { bidi, setup } from '@onting/selenium-webdriver-message-port/host';
import { scenario } from '@testduet/given-when-then';
import { expect } from 'expect';
import { forGenerator } from 'message-port-rpc';
import * as NodeTest from 'node:test';
import buildAndNavigate from '../../../shared/buildAndNavigate.ts';

scenario(
  'browserToHost/rpc/generator',
  bdd => {
    bdd
      .given(
        'browser loading rpc/generator.html',
        async () => buildAndNavigate('browserToHost/rpc/generator.html'),
        ({ teardown }) => teardown()
      )
      .and.oneOf([
        [
          'MessagePort via executeScript',
          precondition => {
            const { messagePort, poll } = setup(precondition.webDriver);

            const act = <T>(fn: () => Promise<T>): Promise<T> => {
              const abortController = new AbortController();
              let lastPollPromise: Promise<void> | undefined;

              (async () => {
                while (!abortController.signal.aborted) {
                  try {
                    lastPollPromise = poll().catch(() => {});

                    await lastPollPromise;

                    lastPollPromise = undefined;
                  } catch {}

                  await new Promise(resolve => setTimeout(resolve, 100));
                }
              })();

              return fn().then(
                async result => {
                  abortController.abort();

                  await lastPollPromise;

                  return result;
                },
                async reason => {
                  abortController.abort();

                  await lastPollPromise;

                  return Promise.reject(reason);
                }
              );
            };

            return { ...precondition, act, messagePort, poll };
          },
          ({ messagePort }) => messagePort.close()
        ],
        [
          'MessagePort via BiDi',
          async precondition => ({
            ...precondition,
            ...(await bidi(precondition.scriptManager, { realmId: precondition.realmInfo.realmId })),
            act: <T>(fn: () => Promise<T>): Promise<T> => fn(),
            poll: () => Promise.resolve()
          }),
          ({ messagePort }) => messagePort.close()
        ]
      ])
      .and('client stub', precondition => ({
        ...precondition,
        clientStub: forGenerator<(value: number) => Generator<number>>(precondition.messagePort)
      }))
      .and(
        'generator',
        precondition => ({
          ...precondition,
          generator: precondition.clientStub(1)
        }),
        async ({ act, generator }) => {
          await act(async () => {
            await generator[Symbol.asyncDispose]();
          });
        }
      )
      .when('next() is called', async precondition => {
        return await precondition.act(() => precondition.generator.next());
      })
      .then('should return { done: false, value: 10 }', (_, value) => {
        expect(value).toEqual({ done: false, value: 10 });
      })
      .when('next(2) is called', async precondition => {
        return await precondition.act(() => precondition.generator.next(2));
      })
      .then('should return { done: true, value: 200 }', (_, value) => {
        expect(value).toEqual({ done: true, value: 200 });
      })
      .when('next() is called', async precondition => {
        return await precondition.act(() => precondition.generator.next());
      })
      .then('should return { done: true, value: undefined }', (_, value) => {
        expect(value).toEqual({ done: true, value: undefined });
      });
  },
  NodeTest
);
