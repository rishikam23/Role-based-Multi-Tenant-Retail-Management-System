import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.AUTH_SECRET });
  const isAuth = !!token;
  const isAuthPage = req.nextUrl.pathname.startsWith('/login');

  if (isAuthPage) {
    if (isAuth) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
    return NextResponse.next();
  }

  if (!isAuth) {
    let from = req.nextUrl.pathname;
    if (req.nextUrl.search) {
      from += req.nextUrl.search;
    }
    return NextResponse.redirect(
      new URL(`/login?from=${encodeURIComponent(from)}`, req.url)
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/login']
};