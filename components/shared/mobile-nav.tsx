"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { X } from "lucide-react";
import { SignedIn, SignedOut, SignInButton, UserButton, useUser, useClerk } from "@clerk/nextjs";

interface MobileNavProps {
  open: boolean;
  onClose: () => void;
}

export function MobileNav({ open, onClose }: MobileNavProps) {
  const { user } = useUser();
  const { signOut } = useClerk();

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="left" className="w-72">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle>Menu</SheetTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </SheetHeader>

        <div className="flex flex-col gap-4 mt-6">
          {/* User Info */}
          <SignedIn>
            <div className="flex items-center gap-3 pb-4 border-b">
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
                    label="Sign out"
                    labelIcon={<span>🚪</span>}
                    onClick={() => signOut({ redirectUrl: "/" })}
                  />
                </UserButton.MenuItems>
              </UserButton>
              <span className="text-sm font-medium">
                {user?.firstName || user?.username || "User"}
              </span>
            </div>
          </SignedIn>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-2">
            <Link
              href="/polls"
              onClick={onClose}
              className="text-gray-700 hover:text-gray-900 py-2 px-3 rounded-md hover:bg-gray-100"
            >
              Browse Polls
            </Link>

            <SignedIn>
              <Link
                href="/polls/create"
                onClick={onClose}
                className="text-gray-700 hover:text-gray-900 py-2 px-3 rounded-md hover:bg-gray-100"
              >
                Create Poll
              </Link>
              <Link
                href="/admin/dashboard"
                onClick={onClose}
                className="text-gray-700 hover:text-gray-900 py-2 px-3 rounded-md hover:bg-gray-100"
              >
                Admin Dashboard
              </Link>
            </SignedIn>
          </nav>

          {/* Auth Buttons */}
          <SignedOut>
            <div className="flex flex-col gap-2 pt-4 border-t">
              <SignInButton mode="modal">
                <Button variant="outline" className="w-full">
                  Sign In
                </Button>
              </SignInButton>
              <Button asChild className="w-full">
                <Link href="/signup" onClick={onClose}>
                  Sign Up
                </Link>
              </Button>
            </div>
          </SignedOut>
        </div>
      </SheetContent>
    </Sheet>
  );
}
