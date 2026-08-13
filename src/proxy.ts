import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedRoutes = [
  "/home",
  "/discover",
  "/recommendations",
  "/watchlist",
  "/diary",
  "/lists",
  "/profile",
  "/favourites",
  "/settings",
  "/onboarding",
  "/watched",
  "/liked",
];

const authRoutes = [
  "/login",
  "/signup",
];

function matchesRoute(
  pathname: string,
  routes: string[],
) {
  return routes.some(
    (route) =>
      pathname === route ||
      pathname.startsWith(`${route}/`),
  );
}

export function proxy(
  request: NextRequest,
) {
  const { pathname } =
    request.nextUrl;

  const hasSessionCookie = Boolean(
    request.cookies.get(
      "memento_session",
    )?.value,
  );

  const isProtectedRoute =
    matchesRoute(
      pathname,
      protectedRoutes,
    );

  const isAuthRoute =
    matchesRoute(
      pathname,
      authRoutes,
    );

  /*
   * Logged-out user attempts to access
   * a protected page.
   *
   * Example:
   *
   * /lists/123
   *      ↓
   * /login?next=/lists/123
   */
  if (
    isProtectedRoute &&
    !hasSessionCookie
  ) {
    const loginUrl =
      new URL(
        "/login",
        request.url,
      );

    loginUrl.searchParams.set(
      "next",
      `${pathname}${request.nextUrl.search}`,
    );

    return NextResponse.redirect(
      loginUrl,
    );
  }

  /*
   * Already authenticated users don't
   * need login/signup pages.
   */
  if (
    isAuthRoute &&
    hasSessionCookie
  ) {
    return NextResponse.redirect(
      new URL(
        "/home",
        request.url,
      ),
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/home/:path*",
    "/discover/:path*",
    "/recommendations/:path*",
    "/watchlist/:path*",
    "/diary/:path*",
    "/lists/:path*",
    "/profile/:path*",
    "/favourites/:path*",
    "/settings/:path*",
    "/onboarding/:path*",
    "/watched/:path*",
    "/liked/:path*",

    "/login",
    "/signup",
  ],
};