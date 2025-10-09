"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignedIn, SignedOut, SignInButton, UserButton, useClerk } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Menu, ArrowRight } from "lucide-react";
import { MobileNav } from "./mobile-nav";
import { useHeader, type HeaderVariant } from "@/contexts/header-context";
import { useCurrentUser } from "@/hooks/use-current-user";
import { canCreatePoll, isSystemAdmin, hasAnyManagementRole } from "@/lib/utils/permissions";
import { cn } from "@/lib/utils";

export function AdaptiveHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { signOut } = useClerk();
  const { config } = useHeader();
  const pathname = usePathname();
  const { user: dbUser, userRoles } = useCurrentUser();

  // Check user permissions
  const userCanCreatePoll = userRoles.length > 0 && canCreatePoll(userRoles);
  const userIsSystemAdmin = userRoles.length > 0 && isSystemAdmin(userRoles);
  const userHasManagementRole = userRoles.length > 0 && hasAnyManagementRole(userRoles);

  // Auto-detect variant based on route if not explicitly set
  const detectedVariant = detectVariantFromRoute(pathname);
  const variant = config.variant || detectedVariant;

  // Hidden variant - don't render header at all
  if (variant === "hidden") {
    return null;
  }

  // Minimal variant - auth pages, results, insights
  if (variant === "minimal") {
    return (
      <header className="border-b-2 border-indigo-100 bg-white/95 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Back Button */}
            {config.backUrl && (
              <Button variant="ghost" size="sm" asChild>
                <Link href={config.backUrl}>
                  <ArrowRight className="h-4 w-4 me-2" />
                  {config.backLabel || "חזרה"}
                </Link>
              </Button>
            )}

            {/* Logo/Title */}
            <div className="flex-1 text-center">
              {config.showLogo !== false && (
                <Link href="/" className="text-2xl font-bold text-gray-900">
                  Pulse
                </Link>
              )}
            </div>

            {/* Auth Buttons / User Menu */}
            <div className="flex items-center gap-2">
              {config.actions}
              <SignedOut>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/login">כניסה</Link>
                </Button>
              </SignedOut>
              <SignedIn>
                <UserButton
                  afterSignOutUrl="/"
                  appearance={{
                    elements: {
                      userButtonAvatarBox: "w-9 h-9"
                    }
                  }}
                >
                  <UserButton.MenuItems>
                    <UserButton.Action
                      label="יציאה"
                      labelIcon={<span>🚪</span>}
                      onClick={() => signOut({ redirectUrl: "/" })}
                    />
                  </UserButton.MenuItems>
                </UserButton>
              </SignedIn>
            </div>
          </div>

          {/* Custom content below header */}
          {config.customContent}
        </div>
      </header>
    );
  }

  // Voting variant - special header for voting interface
  if (variant === "voting") {
    return (
      <header className="border-b-2 border-indigo-100 bg-white/95 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex-1 min-w-0">
              {config.title && (
                <h2 className="text-sm font-medium text-gray-700 truncate">
                  {config.title}
                </h2>
              )}
              {config.subtitle && (
                <p className="text-xs text-gray-500 mt-0.5">
                  {config.subtitle}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {config.actions}
            </div>
          </div>
          {/* Custom content (progress bar, etc.) */}
          {config.customContent}
        </div>
      </header>
    );
  }

  // Management variant - poll owner/manager interface
  if (variant === "management") {
    return (
      <header className="border-b-2 border-indigo-100 bg-white/95 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Back Button */}
            {config.backUrl && (
              <Button variant="ghost" size="sm" asChild>
                <Link href={config.backUrl}>
                  <ArrowRight className="h-4 w-4 me-2" />
                  {config.backLabel || "חזרה לסקרים"}
                </Link>
              </Button>
            )}

            {/* Title/Badge */}
            {config.title && (
              <div className="flex-1 mx-4">
                <span className="text-sm font-medium text-gray-700">{config.title}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2">
              {config.actions}
              <SignedIn>
                <UserButton
                  afterSignOutUrl="/"
                  appearance={{
                    elements: {
                      userButtonAvatarBox: "w-9 h-9"
                    }
                  }}
                >
                  <UserButton.MenuItems>
                    <UserButton.Action
                      label="יציאה"
                      labelIcon={<span>🚪</span>}
                      onClick={() => signOut({ redirectUrl: "/" })}
                    />
                  </UserButton.MenuItems>
                </UserButton>
              </SignedIn>
            </div>
          </div>
        </div>
      </header>
    );
  }

  // Admin variant - admin dashboard and pages
  if (variant === "admin") {
    return (
      <header className="border-b-2 border-indigo-100 bg-white/95 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Back Button */}
            {config.backUrl && (
              <Button variant="ghost" size="sm" asChild>
                <Link href={config.backUrl}>
                  <ArrowRight className="h-4 w-4 me-2" />
                  {config.backLabel || "חזרה"}
                </Link>
              </Button>
            )}

            {/* Title */}
            {config.title && (
              <h1 className="text-xl font-bold text-gray-900">{config.title}</h1>
            )}

            {/* Spacer for centering title */}
            {!config.actions && <div className="w-32"></div>}

            {/* Actions */}
            {config.actions && (
              <div className="flex items-center gap-2">
                {config.actions}
              </div>
            )}
          </div>
        </div>
      </header>
    );
  }

  // Default variant - standard public/authenticated navigation
  return (
    <header className="border-b-2 border-indigo-100 bg-white/95 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="text-2xl font-bold text-gray-900">
            Pulse
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/polls" className="text-gray-700 hover:text-gray-900">
              סקרים
            </Link>
            <SignedIn>
              {/* Dashboard - visible only to users who own/manage polls */}
              {userHasManagementRole && (
                <Link href="/dashboard" className="text-gray-700 hover:text-gray-900">
                  לוח בקרה
                </Link>
              )}
              {/* Create Poll - visible to System Admins, Poll Creators, Poll Managers */}
              {userCanCreatePoll && (
                <Link href="/polls/create" className="text-gray-700 hover:text-gray-900">
                  יצירת סקר
                </Link>
              )}
              {/* Admin Dashboard - visible only to System Admins */}
              {userIsSystemAdmin && (
                <Link href="/admin/dashboard" className="text-gray-700 hover:text-gray-900">
                  פאנל ניהול
                </Link>
              )}
            </SignedIn>
            {/* Custom navigation items */}
            {config.customContent}
          </nav>

          {/* Auth Buttons / User Menu */}
          <div className="hidden md:flex items-center gap-2">
            {config.actions}
            <SignedOut>
              <SignInButton mode="modal">
                <Button variant="ghost">כניסה</Button>
              </SignInButton>
              <Button asChild>
                <Link href="/signup">הצטרפות</Link>
              </Button>
            </SignedOut>
            <SignedIn>
              <UserButton
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    userButtonAvatarBox: "w-9 h-9"
                  }
                }}
              >
                <UserButton.MenuItems>
                  <UserButton.Action
                    label="יציאה"
                    labelIcon={<span>🚪</span>}
                    onClick={() => signOut({ redirectUrl: "/" })}
                  />
                </UserButton.MenuItems>
              </UserButton>
            </SignedIn>
          </div>

          {/* Mobile Menu Button */}
          {config.showMobileMenu !== false && (
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>

      {/* Mobile Navigation */}
      {config.showMobileMenu !== false && (
        <MobileNav
          open={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
        />
      )}
    </header>
  );
}

/**
 * Auto-detect header variant based on current route
 */
function detectVariantFromRoute(pathname: string): HeaderVariant {
  // Auth pages
  if (pathname.startsWith("/login") || pathname.startsWith("/signup")) {
    return "minimal";
  }

  // Voting interface
  if (pathname.includes("/vote")) {
    return "voting";
  }

  // Management interface
  if (pathname.includes("/manage")) {
    return "management";
  }

  // Admin pages
  if (pathname.startsWith("/admin")) {
    return "admin";
  }

  // Results and insights
  if (pathname.includes("/insights") || pathname.includes("/results") || pathname.includes("/closed")) {
    return "minimal";
  }

  // Default for everything else
  return "default";
}
