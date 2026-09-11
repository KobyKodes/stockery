// Client-side fetch wrapper. Every route answers JSON; on failure the body
// carries an `error` sentence meant to be shown as-is.

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
    const message =
      data && typeof data === "object" && "error" in data && typeof data.error === "string"
        ? data.error
        : res.status === 401
          ? "Sign in to continue."
          : "Something went wrong. Try again.";
    throw new RequestError(res.status, message);
  }
  return data as T;
}
