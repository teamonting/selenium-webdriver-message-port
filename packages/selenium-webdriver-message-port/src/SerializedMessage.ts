import { array, object, pipe, readonly, string, unknown, type InferOutput } from 'valibot';

const serializedMessageSchema = object({
  data: unknown(),
  portId: string(),
  transferPortIds: pipe(array(string()), readonly())
});

type SerializedMessage = InferOutput<typeof serializedMessageSchema>;

export { type SerializedMessage, serializedMessageSchema };
