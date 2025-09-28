"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/hooks/use-current-user";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { User, UserCheck, UserX, Shield, Database } from "lucide-react";

function AuthTestContent() {
  const { user, isLoading, isAuthenticated, isAnonymous, refresh } = useCurrentUser();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Loading user data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Authentication Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              {isAuthenticated ? (
                <UserCheck className="h-4 w-4 text-green-600" />
              ) : (
                <UserX className="h-4 w-4 text-orange-600" />
              )}
              <span className="font-medium">
                {isAuthenticated ? "Authenticated" : "Anonymous"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              <span>User in DB: {user ? "Yes" : "No"}</span>
            </div>
          </div>

          <div className="space-y-2">
            <Badge variant={isAuthenticated ? "default" : "secondary"}>
              {isAuthenticated ? "Clerk User" : "Session User"}
            </Badge>
            {isAnonymous && (
              <Badge variant="outline">Can upgrade to authenticated</Badge>
            )}
          </div>

          {user && (
            <div className="p-3 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">Database User Record:</h4>
              <div className="text-sm space-y-1">
                <div><strong>ID:</strong> {user.id}</div>
                <div><strong>Clerk ID:</strong> {user.clerkUserId || "None"}</div>
                <div><strong>Session ID:</strong> {user.sessionId || "None"}</div>
                <div><strong>Created:</strong> {new Date(user.createdAt).toLocaleString()}</div>
                {user.lastSyncedAt && (
                  <div><strong>Last Synced:</strong> {new Date(user.lastSyncedAt).toLocaleString()}</div>
                )}
                {user.cachedMetadata ? (
                  <div><strong>Cached Metadata:</strong> <pre>{JSON.stringify(user.cachedMetadata, null, 2)}</pre></div>
                ) : null}
              </div>
            </div>
          )}

          <Button onClick={refresh} variant="outline" className="w-full">
            Refresh User Data
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Protected Content Test</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            This content should be visible to all users (no protection).
          </p>

          <ProtectedRoute requireAuth={true}>
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 font-medium">
                🔐 This content requires authentication and should only be visible to logged-in users!
              </p>
            </div>
          </ProtectedRoute>

          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-800">
              💡 If you&apos;re anonymous, you won&apos;t see the green protected content above.
              Sign in to test the authentication flow!
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AuthFlowTestPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Auth Flow Test Page</h1>
          <p className="text-muted-foreground">
            Test the authentication system with both anonymous and authenticated users.
          </p>
        </div>

        <AuthTestContent />
      </div>
    </div>
  );
}