"use client";

import { useUser } from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SignInButton, SignOutButton, UserButton } from "@clerk/nextjs";
import { User, UserX, Shield } from "lucide-react";

export function TestAuthStatus() {
  const { isSignedIn, user, isLoaded } = useUser();

  if (!isLoaded) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Loading Auth Status...
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-4 w-4" />
          Authentication Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isSignedIn ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <UserButton />
              <div>
                <div className="font-medium">{user.fullName || user.firstName}</div>
                <div className="text-sm text-gray-500">
                  {user.primaryEmailAddress?.emailAddress}
                </div>
              </div>
              <Badge className="ml-auto">
                <User className="h-3 w-3 mr-1" />
                Authenticated
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <strong>User ID:</strong>
                <div className="font-mono bg-gray-100 p-1 rounded text-xs">
                  {user.id}
                </div>
              </div>
              <div>
                <strong>Created:</strong>
                <div className="text-gray-600">
                  {user.createdAt?.toLocaleDateString()}
                </div>
              </div>
            </div>

            <SignOutButton>
              <Button variant="outline" size="sm" className="w-full">
                Sign Out
              </Button>
            </SignOutButton>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                <UserX className="h-4 w-4 text-gray-500" />
              </div>
              <div>
                <div className="font-medium text-gray-600">Not signed in</div>
                <div className="text-sm text-gray-500">Anonymous session</div>
              </div>
              <Badge variant="secondary" className="ml-auto">
                Anonymous
              </Badge>
            </div>

            <div className="text-xs text-gray-600 bg-blue-50 p-2 rounded">
              <strong>Test Mode:</strong> You can test both anonymous and authenticated user flows.
              Anonymous users can participate in polls and later upgrade to authenticated accounts.
            </div>

            <SignInButton>
              <Button size="sm" className="w-full">
                Sign In to Test Authenticated Features
              </Button>
            </SignInButton>
          </div>
        )}

        <div className="pt-2 border-t text-xs text-gray-500">
          <div><strong>Session Info:</strong></div>
          <div className="mt-1 font-mono bg-gray-50 p-2 rounded">
            Status: {isSignedIn ? "Authenticated" : "Anonymous"}<br/>
            Loaded: {isLoaded.toString()}<br/>
            Timestamp: {new Date().toISOString()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}