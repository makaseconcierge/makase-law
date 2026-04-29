export type JsonPrimitive = boolean | number | string | null;
export type JsonArray = JsonValue[];
export type JsonObject = { [x: string]: JsonValue | undefined };
export type JsonValue = JsonArray | JsonObject | JsonPrimitive;
