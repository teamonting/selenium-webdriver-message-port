declare module '@ungap/structured-clone' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export function deserialize(target: any): any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export function serialize(target: any): any;
}
