import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/auth";

// Everything except the auth endpoints and static assets needs a session.
// Pages redirect to /login; API routes answer 401 so a fetch never follows a
// redirect into an HTML page.
export async function proxy(request: NextRequest) {
  const session = await auth();
  const { pathname } = request.nextUrl;

  if (!session) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Sign in to continue." }, { status: 401 });
    }
    if (pathname !== "/login") {
      const login = new URL("/login", request.url);
      if (pathname !== "/") login.searchParams.set("next", pathname);
      return NextResponse.redirect(login);
    }
  }

  if (session && pathname === "/login") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|icon.svg|manifest.webmanifest).*)"],
};
