// TODO: Not used, can be removed.

const DEFAULT_REASON = new Error('Timed out');

export default function timeout(durationInMS: number, reason: unknown = DEFAULT_REASON): Promise<never> {
  return new Promise((_, reject) => setTimeout(() => reject(reason), durationInMS));
}
