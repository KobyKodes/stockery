import { NextResponse } from "next/server";
import { ZodError, type ZodType } from "zod";
import { auth } from "@/auth";

// Small helpers shared by every route handler: auth, body validation, and
// consistent error shapes. Errors say what happened in plain words.

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export async function requireSession() {
  const session = await auth();
  if (!session) throw new ApiError(401, "Sign in to continue.");
  return session;
}

export async function parseBody<T>(request: Request, schema: ZodType<T>): Promise<T> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    throw new ApiError(400, "The request body isn't valid JSON.");
  }
  const result = schema.safeParse(raw);
  if (!result.success) {
    const first = result.error.issues[0];
    const where = first?.path.length ? `${first.path.join(".")}: ` : "";
    throw new ApiError(400, `${where}${first?.message ?? "Invalid request."}`);
  }
  return result.data;
}

export function parseQuery<T>(url: URL, schema: ZodType<T>): T {
  const raw = Object.fromEntries(url.searchParams.entries());
  const result = schema.safeParse(raw);
  if (!result.success) {
    const first = result.error.issues[0];
    throw new ApiError(400, first?.message ?? "Invalid query.");
  }
  return result.data;
}

/** Wraps a handler so thrown ApiErrors and Zod errors become JSON responses. */
export function handle<Ctx>(fn: (request: Request, ctx: Ctx) => Promise<Response>) {
  return async (request: Request, ctx: Ctx): Promise<Response> => {
    try {
      await requireSession();
      return await fn(request, ctx);
    } catch (err) {
      if (err instanceof ApiError) {
        return NextResponse.json({ error: err.message }, { status: err.status });
      }
      if (err instanceof ZodError) {
        return NextResponse.json({ error: err.issues[0]?.message ?? "Invalid request." }, { status: 400 });
      }
      console.error(err);
      return NextResponse.json({ error: "Something went wrong on the server. Try again." }, { status: 500 });
    }
  };
}

export type RouteContext<P extends Record<string, string>> = { params: Promise<P> };
