import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  const { pathname } = request.nextUrl;

  const publicPaths = [
    "/",
    "/login",
    "/register",
    "/forgot-password",
    "/tools",
    "/dorkar-link",
    "/pricing",
    "/reviews",
  ];

  const isPublicPath = publicPaths.includes(pathname);

  // ১. টোকেন না থাকলে এবং প্রাইভেট পেজে যেতে চাইলে সরাসরি /login এ রিডাইরেক্ট করবে
  if (!token && !isPublicPath) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // ২. অলরেডি টোকেন থাকলে এবং /login বা /register এ গেলে ড্যাশবোর্ডে নিয়ে যাবে
  if (token && (pathname === "/login" || pathname === "/register")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * স্ট্যাটিক ফাইল, ইমেজ, আইকন এবং API বাদে সব রুটে মিডলওয়্যার রান হবে
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
