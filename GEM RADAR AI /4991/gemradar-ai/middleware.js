import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    if (pathname.startsWith("/admin") && token?.role !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
  },
  {
    callbacks: { authorized: ({ token }) => !!token },
    pages: { signIn: "/login" }
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/scanner/:path*",
    "/research/:path*",
    "/watchlist/:path*",
    "/alerts/:path*",
    "/portfolio/:path*",
    "/smart-money/:path*",
    "/token/:path*",
    "/market/:path*",
    "/reports/:path*",
    "/profile/:path*",
    "/settings/:path*",
    "/subscription/:path*",
    "/settings/:path*",
    "/admin/:path*"
  ]
};
