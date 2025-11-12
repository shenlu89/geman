import { getSessionCookie } from "better-auth/cookies";
import { type NextRequest, NextResponse } from "next/server";

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};

export default async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const sessionCookie = getSessionCookie(req);
  const authRequiredPaths = ["/", "/keys", "/account", "/settings"];

  // Logged-in users visiting login/register → redirect to home
  if (
    sessionCookie &&
    (pathname.startsWith("/login") || pathname.startsWith("/register"))
  ) {
    const nextUrl = req.nextUrl.searchParams.get("next");
    return NextResponse.redirect(new URL(nextUrl || "/", req.url));
  }

  // Unauthenticated users visiting protected pages → redirect to login
  if (
    !sessionCookie &&
    authRequiredPaths.some((p) => pathname === p || pathname.startsWith(p + "/"))
  ) {
    return NextResponse.redirect(
      new URL(`/login?next=${pathname}${search}`, req.url)
    );
  }

  return NextResponse.next();
}
