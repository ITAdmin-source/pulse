import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Test routes - blocked in production
const isTestRoute = createRouteMatcher([
  "/test-auth",
  "/test-admin/(.*)",
  "/test-polls/(.*)",
  "/test-dashboard",
  "/test-analytics",
  "/test-services/(.*)"
]);

const isPublicRoute = createRouteMatcher([
  "/",
  "/polls/(.*)",
  "/api/polls/(.*)",
  "/login(.*)",
  "/signup(.*)",
  "/api/anonymous-users/(.*)"
]);

const isProtectedRoute = createRouteMatcher([
  "/dashboard/(.*)",
  "/admin/(.*)",
  "/api/admin/(.*)"
]);

export default clerkMiddleware(async (auth, req) => {
  // Block test routes in production
  if (isTestRoute(req) && process.env.NODE_ENV === 'production') {
    const unauthorizedUrl = new URL('/unauthorized', req.url);
    return NextResponse.redirect(unauthorizedUrl);
  }

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