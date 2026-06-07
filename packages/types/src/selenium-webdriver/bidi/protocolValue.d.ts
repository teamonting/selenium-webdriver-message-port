declare module 'selenium-webdriver/bidi/protocolValue.js' {
  export class ChannelValue {
    channel: string;
    options?: SerializationOptions;
    resultOwnership?: 'none' | 'root';

    constructor(channel: string, options?: SerializationOptions, resultOwnership?: 'none' | 'root');
  }

  export class LocalValue {
    type: string;
    value?: unknown;

    constructor(type: string, value?: unknown);

    asMap(): Record<string, unknown>;
    static createArrayValue(value: unknown[]): LocalValue;
    static createBigIntValue(value: bigint | string): LocalValue;
    static createBooleanValue(value: boolean): LocalValue;
    static createChannelValue(value: ChannelValue): LocalValue;
    static createDateValue(value: string): LocalValue;
    static createMapValue(map: Record<string, unknown>): LocalValue;
    static createNullValue(): LocalValue;
    static createNumberValue(value: number): LocalValue;
    static createObjectValue(object: Record<string, unknown>): LocalValue;
    static createReferenceValue(handle: string, sharedId?: string): LocalValue;
    static createRegularExpressionValue(value: { flags?: string; pattern: string }): LocalValue;
    static createSetValue(value: unknown[]): LocalValue;
    static createSpecialNumberValue(value: number): LocalValue;
    static createStringValue(value: string): LocalValue;
    static createUndefinedValue(): LocalValue;
  }

  export class SerializationOptions {
    constructor(maxDomDepth?: number, maxObjectDepth?: number | null, includeShadowTree?: 'all' | 'none' | 'open');
  }
}
