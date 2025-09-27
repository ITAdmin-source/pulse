"use client";

import { useState } from "react";
import { TestLayout } from "@/components/test/TestLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUser } from "@clerk/nextjs";
import { SignInButton, SignOutButton, SignUpButton } from "@clerk/nextjs";
import { User, UserPlus, LogOut, TestTube, Info } from "lucide-react";

export default function TestAuthPage() {
  const { isSignedIn, user } = useUser();
  const [sessionId, setSessionId] = useState("");
  const [testResults, setTestResults] = useState<Array<{
    timestamp: string;
    test: string;
    result: unknown;
    success: boolean;
  }>>([]);

  const addTestResult = (test: string, result: unknown, success: boolean) => {
    const timestamp = new Date().toLocaleTimeString();
    setTestResults(prev => [{
      timestamp,
      test,
      result,
      success
    }, ...prev]);
  };

  const testAnonymousUser = async () => {
    try {
      // This would test anonymous user creation
      // For now, we'll simulate it
      const mockSessionId = `anon_${Date.now()}`;
      setSessionId(mockSessionId);
      addTestResult("Anonymous User Creation", {
        sessionId: mockSessionId,
        status: "Created anonymous session"
      }, true);
    } catch (error) {
      addTestResult("Anonymous User Creation", error, false);
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <TestLayout
      title="🔐 Authentication Testing"
      description="Test user authentication, anonymous sessions, and Clerk integration"
    >
      <div className="space-y-6">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            This page tests the dual authentication system: anonymous users (session-based)
            and authenticated users (Clerk). Test the seamless upgrade path from anonymous to authenticated.
          </AlertDescription>
        </Alert>

        <Tabs defaultValue="clerk" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="clerk">Clerk Auth</TabsTrigger>
            <TabsTrigger value="anonymous">Anonymous Users</TabsTrigger>
            <TabsTrigger value="results">Test Results</TabsTrigger>
          </TabsList>

          {/* Clerk Authentication Testing */}
          <TabsContent value="clerk" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Clerk Authentication System
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isSignedIn ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-green-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className="bg-green-600">Authenticated</Badge>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div><strong>Name:</strong> {user?.fullName || user?.firstName}</div>
                        <div><strong>Email:</strong> {user?.primaryEmailAddress?.emailAddress}</div>
                        <div><strong>User ID:</strong> <code className="bg-white px-1 rounded">{user?.id}</code></div>
                        <div><strong>Created:</strong> {user?.createdAt?.toLocaleString()}</div>
                        <div><strong>Last Sign In:</strong> {user?.lastSignInAt?.toLocaleString()}</div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <SignOutButton>
                        <Button className="w-full">
                          <LogOut className="h-4 w-4 mr-2" />
                          Sign Out
                        </Button>
                      </SignOutButton>
                      <Button
                        variant="outline"
                        onClick={() => addTestResult("User Data Fetch", user, true)}
                        className="w-full"
                      >
                        <TestTube className="h-4 w-4 mr-2" />
                        Log User Data to Results
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 bg-orange-50 rounded-lg">
                      <Badge variant="secondary" className="mb-2">Not Authenticated</Badge>
                      <p className="text-sm text-gray-600">
                        Test the Clerk authentication flow. Users can sign in with existing accounts
                        or create new ones.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <SignInButton>
                        <Button className="w-full">
                          <User className="h-4 w-4 mr-2" />
                          Sign In
                        </Button>
                      </SignInButton>
                      <SignUpButton>
                        <Button variant="outline" className="w-full">
                          <UserPlus className="h-4 w-4 mr-2" />
                          Sign Up
                        </Button>
                      </SignUpButton>
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-2">Test Scenarios:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Sign up with new email address</li>
                    <li>• Sign in with existing account</li>
                    <li>• Test user data persistence</li>
                    <li>• Test session management</li>
                    <li>• Verify user roles and permissions</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Anonymous User Testing */}
          <TabsContent value="anonymous" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5" />
                  Anonymous User System
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-3">
                    Anonymous users can participate in polls using browser session-based identification.
                    They can later upgrade to authenticated accounts without losing their voting history.
                  </p>
                  {sessionId && (
                    <div className="mt-2">
                      <strong>Current Session ID:</strong>
                      <code className="block bg-white p-2 mt-1 rounded text-xs">{sessionId}</code>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <Button onClick={testAnonymousUser} className="w-full">
                    <TestTube className="h-4 w-4 mr-2" />
                    Test Anonymous User Creation
                  </Button>

                  <div className="grid grid-cols-1 gap-2">
                    <Label htmlFor="session-input">Manual Session ID Test</Label>
                    <div className="flex gap-2">
                      <Input
                        id="session-input"
                        value={sessionId}
                        onChange={(e) => setSessionId(e.target.value)}
                        placeholder="Enter session ID..."
                      />
                      <Button
                        variant="outline"
                        onClick={() => addTestResult("Session ID Set", { sessionId }, true)}
                      >
                        Test
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-2">Test Scenarios:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Create anonymous user session</li>
                    <li>• Vote on polls as anonymous user</li>
                    <li>• Upgrade anonymous user to authenticated</li>
                    <li>• Verify data transfer during upgrade</li>
                    <li>• Test session persistence across browser refresh</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Test Results */}
          <TabsContent value="results" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TestTube className="h-5 w-5" />
                    Authentication Test Results
                  </div>
                  <Button variant="outline" size="sm" onClick={clearResults}>
                    Clear Results
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {testResults.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No test results yet. Run some tests to see results here.
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {testResults.map((result, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-lg border-l-4 ${
                          result.success ? 'border-l-green-500 bg-green-50' : 'border-l-red-500 bg-red-50'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="font-medium">{result.test}</div>
                          <div className="text-xs text-gray-500">{result.timestamp}</div>
                        </div>
                        <pre className="text-xs bg-white p-2 rounded overflow-x-auto">
                          {JSON.stringify(result.result, null, 2)}
                        </pre>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </TestLayout>
  );
}