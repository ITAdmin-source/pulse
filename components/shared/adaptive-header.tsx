"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignedIn, UserButton, useClerk } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { MobileNav } from "./mobile-nav";
import { ShareButton } from "./share-button";
import { getPollBySlugAction } from "@/actions/polls-actions";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type HeaderVariant = "cross-poll" | "poll-specific" | "management" | "admin";

export function AdaptiveHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [pollTitle, setPollTitle] = useState<string | null>(null);
  const [pollSlug, setPollSlug] = useState<string | null>(null);
  const { signOut } = useClerk();
  const pathname = usePathname();

  // Auto-detect variant based on route
  const variant = detectVariantFromRoute(pathname);

  // Extract poll slug from pathname and fetch poll data for poll-specific pages
  useEffect(() => {
    if (variant === "poll-specific" || variant === "management") {
      const slugMatch = pathname.match(/\/polls\/([^\/]+)/);
      if (slugMatch && slugMatch[1]) {
        const slug = slugMatch[1];
        setPollSlug(slug);

        // Fetch poll data
        getPollBySlugAction(slug).then((result) => {
          if (result.success && result.data) {
            setPollTitle(result.data.question);
          }
        }).catch((error) => {
          console.error("Error fetching poll for header:", error);
        });
      }
    } else {
      setPollTitle(null);
      setPollSlug(null);
    }
  }, [pathname, variant]);

  // Cross-Poll Variant - Landing, Polls List, Auth Pages
  if (variant === "cross-poll") {
    return (
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center justify-between">
            {/* Share Button - Landing Page */}
            <ShareButton url="/" title="Pulse" description="בחר חפיסה, מיין קלפים וגלה את נקודת המבט שלך" />

            {/* App Logo/Title */}
            <Link href="/" className="text-lg font-bold text-gray-900">
              Pulse
            </Link>

            {/* Hamburger Menu */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        <MobileNav
          open={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
        />
      </header>
    );
  }

  // Poll-Specific Variant - All poll pages except management
  if (variant === "poll-specific") {
    const shareUrl = pollSlug ? `/polls/${pollSlug}` : pathname;
    const displayTitle = pollTitle || "...";

    return (
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center justify-between gap-2">
            {/* Share Button - Poll Entry Page */}
            <ShareButton url={shareUrl} title={pollTitle || undefined} description="בוא לבחור קלפים ולגלות את נקודת המבט שלך" />

            {/* Poll Title (Truncated with Tooltip) */}
            {pollTitle ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex-1 text-center min-w-0">
                      <h1 className="text-sm font-medium text-gray-800 truncate" dir="auto">
                        {displayTitle}
                      </h1>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs" dir="auto">{displayTitle}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              <div className="flex-1 text-center min-w-0">
                <div className="h-4 w-32 bg-gray-200 animate-pulse rounded mx-auto" />
              </div>
            )}

            {/* Hamburger Menu */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 flex-shrink-0"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        <MobileNav
          open={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
        />
      </header>
    );
  }

  // Management Variant - Poll Management Pages (Keep Existing)
  if (variant === "management") {
    return (
      <header className="border-b-2 border-stone-200 bg-white/95 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Back Button */}
            <Button variant="ghost" size="sm" asChild>
              <Link href="/polls">
                חזרה לסקרים
              </Link>
            </Button>

            {/* Title/Badge */}
            {pollTitle && (
              <div className="flex-1 mx-4">
                <span className="text-sm font-medium text-gray-700">{pollTitle}</span>
              </div>
            )}

            {/* User Button */}
            <div className="flex items-center gap-2">
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

  // Admin Variant - Admin Dashboard and Pages (Keep Existing)
  if (variant === "admin") {
    return (
      <header className="border-b-2 border-stone-200 bg-white/95 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Back Button */}
            <Button variant="ghost" size="sm" asChild>
              <Link href="/polls">
                חזרה
              </Link>
            </Button>

            {/* Title */}
            <h1 className="text-xl font-bold text-gray-900">לוח ניהול</h1>

            {/* Spacer for centering */}
            <div className="w-32"></div>
          </div>
        </div>
      </header>
    );
  }

  // Fallback (shouldn't happen)
  return null;
}

/**
 * Auto-detect header variant based on current route
 */
function detectVariantFromRoute(pathname: string): HeaderVariant {
  // Admin pages
  if (pathname.startsWith("/admin")) {
    return "admin";
  }

  // Poll management pages
  if (pathname.includes("/manage")) {
    return "management";
  }

  // Poll-specific pages (vote, insights, results, closed, entry)
  // Match /polls/[slug] but not just /polls
  if (pathname.startsWith("/polls/") && pathname !== "/polls") {
    return "poll-specific";
  }

  // Cross-poll pages (landing, polls list, auth)
  // Includes: /, /polls, /login, /signup
  return "cross-poll";
}
