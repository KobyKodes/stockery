import { NextResponse } from "next/server";
import { ZodError, type ZodType } from "zod";
import { auth } from "@/auth";
import { msg, resolveMessage } from "@/lib/i18n/message";
import { getT } from "@/lib/i18n/server";

// Small helpers shared by every route handler: auth, body validation, and
// consistent error shapes. Errors say what happened in plain words.

export class ApiError extends Error {
  constructor(
    public status: number,
    /** Either a sentence or a token from `msg()`, resolved by `handle`. */
    message: string,
    /** The field the message is about, when a schema names one. */
    public field?: string,
  ) {
    super(message);
  }
}

export async function requireSession() {
  const session = await auth();
  if (!session) throw new ApiError(401, msg("error.signIn"));
  return session;
}

export async function parseBody<T>(request: Request, schema: ZodType<T>): Promise<T> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    throw new ApiError(400, msg("error.badJson"));
  }
  const result = schema.safeParse(raw);
  if (!result.success) {
    const first = result.error.issues[0];
    const where = first?.path.length ? first.path.join(".") : undefined;
    throw new ApiError(400, first?.message ?? msg("error.invalidRequest"), where);
  }
  return result.data;
}

export function parseQuery<T>(url: URL, schema: ZodType<T>): T {
  const raw = Object.fromEntries(url.searchParams.entries());
  const result = schema.safeParse(raw);
  if (!result.success) {
    const first = result.error.issues[0];
    throw new ApiError(400, first?.message ?? msg("error.invalidQuery"));
  }
  return result.data;
}

/**
 * Wraps a handler so thrown ApiErrors and Zod errors become JSON responses.
 *
 * This is where a message token becomes a sentence: the request carries the
 * caller's language cookie, so the error comes back already written in it and
 * the browser can show it as-is.
 */
export function handle<Ctx>(fn: (request: Request, ctx: Ctx) => Promise<Response>) {
  return async (request: Request, ctx: Ctx): Promise<Response> => {
    try {
      await requireSession();
      return await fn(request, ctx);
    } catch (err) {
      if (err instanceof ApiError) {
        const t = await getT();
        const text = resolveMessage(err.message, t);
        return NextResponse.json(
          { error: err.field ? `${err.field}: ${text}` : text },
          { status: err.status },
        );
      }
      if (err instanceof ZodError) {
        const t = await getT();
        const first = err.issues[0]?.message;
        return NextResponse.json(
          { error: first ? resolveMessage(first, t) : t("error.invalidRequest") },
          { status: 400 },
        );
      }
      console.error(err);
      const t = await getT();
      return NextResponse.json({ error: t("error.server") }, { status: 500 });
    }
  };
}

export type RouteContext<P extends Record<string, string>> = { params: Promise<P> };
