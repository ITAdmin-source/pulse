import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/polls/(.*)",
  "/api/polls/(.*)",
  "/login",
  "/signup",
  "/api/anonymous-users/(.*)",
  "/api/webhooks/(.*)", // Allow webhooks to bypass authentication
  // Test interface routes - make all test pages public
  "/test-auth",
  "/test-admin/(.*)",
  "/test-polls/(.*)",
  "/test-dashboard",
  "/test-analytics",
  "/test-services/(.*)"
]);

const isProtectedRoute = createRouteMatcher([
  "/dashboard/(.*)",
  "/admin/(.*)",
  "/api/admin/(.*)"
]);

export default clerkMiddleware(async (auth, req) => {
  // Skip auth check for public routes to avoid hanging
  if (isPublicRoute(req)) {
    return NextResponse.next();
  }

  // Only check auth for protected routes
  if (isProtectedRoute(req)) {
    const authResult = await auth();
    if (!authResult.userId) {
      // Redirect to login for unauthenticated users on protected routes
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('redirect_url', req.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};