import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/auth";
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale } from "@/lib/i18n/config";
import { createTranslator } from "@/lib/i18n/translate";

// Everything except the auth endpoints and static assets needs a session.
// Pages redirect to /login; API routes answer 401 so a fetch never follows a
// redirect into an HTML page.
export async function proxy(request: NextRequest) {
  const session = await auth();
  const { pathname } = request.nextUrl;

  if (!session) {
    if (pathname.startsWith("/api/")) {
      // This reply never passes through handle(), so it reads the cookie itself.
      const cookie = request.cookies.get(LOCALE_COOKIE)?.value;
      const t = createTranslator(isLocale(cookie) ? cookie : DEFAULT_LOCALE);
      return NextResponse.json({ error: t("error.signIn") }, { status: 401 });
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

// The manifest and every icon it names stay public: a phone fetches them
// before anyone signs in, and an icon redirected to /login installs as a blank
// square on the home screen.
export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico|icon.png|apple-icon.png|icons/|manifest.webmanifest).*)",
  ],
};
