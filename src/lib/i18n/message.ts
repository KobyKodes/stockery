import type { MessageKey } from "@/lib/i18n/en";
import type { Params, Translate } from "@/lib/i18n/translate";

// Some sentences are produced where there is no language to produce them in:
// a Zod schema, a thrown ApiError, a movement note written into the database.
//
// `msg` packs the key and its values into one opaque string that travels as
// the message. `resolveMessage` unpacks it at the point where the reader's
// language is finally known. Anything that is not a token is passed straight
// through, so plain strings and rows written before this existed still read.

const PREFIX = "i18n:";

export function msg(key: MessageKey, params?: Params): string {
  return params ? `${PREFIX}${key}:${JSON.stringify(params)}` : `${PREFIX}${key}`;
}

export function isMessageToken(value: string): boolean {
  return value.startsWith(PREFIX);
}

export function resolveMessage(raw: string, t: Translate): string {
  if (!raw.startsWith(PREFIX)) return raw;
  const rest = raw.slice(PREFIX.length);
  const sep = rest.indexOf(":");
  if (sep === -1) return t(rest as MessageKey);
  const key = rest.slice(0, sep) as MessageKey;
  try {
    return t(key, JSON.parse(rest.slice(sep + 1)) as Params);
  } catch {
    return t(key);
  }
}
