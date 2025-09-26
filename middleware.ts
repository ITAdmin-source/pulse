import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/polls/(.*)",
  "/api/polls/(.*)",
  "/login",
  "/signup",
  "/api/anonymous-users/(.*)"
]);

const isProtectedRoute = createRouteMatcher([
  "/dashboard/(.*)",
  "/admin/(.*)",
  "/api/admin/(.*)"
]);

export default clerkMiddleware(async (auth, req: NextRequest) => {
  const { userId } = await auth();

  if (isProtectedRoute(req) && !userId) {
    const signInUrl = new URL("/login", req.url);
    signInUrl.searchParams.set("redirect_url", req.url);
    return NextResponse.redirect(signInUrl);
  }

  if (!isPublicRoute(req) && !userId) {
    const signInUrl = new URL("/login", req.url);
    signInUrl.searchParams.set("redirect_url", req.url);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};