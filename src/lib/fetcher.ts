import { DEFAULT_LOCALE, isLocale } from "@/lib/i18n/config";
import { createTranslator } from "@/lib/i18n/translate";

// Client-side fetch wrapper. Every route answers JSON; on failure the body
// carries an `error` sentence, already written in the caller's language,
// meant to be shown as-is.

/**
 * The two fallbacks below fire when there is no body to read, which is too
 * early for a React hook. The language is on <html lang>, put there by the
 * root layout, so read it from the document.
 */
function translator() {
  const lang = typeof document === "undefined" ? "" : document.documentElement.lang;
  return createTranslator(isLocale(lang) ? lang : DEFAULT_LOCALE);
}

export class RequestError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export async function api<T = unknown>(
  url: string,
  init: Omit<RequestInit, "body"> & { body?: unknown } = {},
): Promise<T> {
  const { body, headers, ...rest } = init;
  const isForm = body instanceof FormData;
  const res = await fetch(url, {
    ...rest,
    headers: isForm ? headers : { "Content-Type": "application/json", ...(headers ?? {}) },
    body: isForm ? body : body === undefined ? undefined : JSON.stringify(body),
  });
  if (res.status === 204) return undefined as T;
  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    // no body
  }
  if (!res.ok) {
    const fromBody =
      data && typeof data === "object" && "error" in data && typeof data.error === "string" ? data.error : null;
    const t = translator();
    const message = fromBody ?? (res.status === 401 ? t("error.signIn") : t("error.generic"));
    throw new RequestError(res.status, message);
  }
  return data as T;
}
