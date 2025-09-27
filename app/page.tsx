import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Pulse - Democratic Polling Platform
          </h1>
          <p className="text-xl text-gray-600 mb-6">
            Comprehensive Test Interface for Business Logic Validation
          </p>
          <Badge variant="destructive" className="text-lg px-4 py-2">
            🧪 TEMPORARY TEST UI - Will be deleted after testing
          </Badge>
        </div>

        {/* Test Interface Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Authentication Testing */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🔐 Authentication
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-gray-600">
                Test user creation, anonymous sessions, and Clerk integration
              </p>
              <Button asChild className="w-full">
                <Link href="/test-auth">Test Auth System</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Poll Management */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                📊 Poll Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-gray-600">
                Create, edit, and manage poll lifecycle (draft→published→closed)
              </p>
              <Button asChild className="w-full">
                <Link href="/test-admin/polls">Manage Polls</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Statement Moderation */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                📝 Statement System
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-gray-600">
                Test statement creation, approval workflow, and moderation queue
              </p>
              <Button asChild className="w-full">
                <Link href="/test-admin/statements">Moderate Statements</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Voting Interface */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🗳️ Voting Experience
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-gray-600">
                Test the core voting flow, progress tracking, and vote updates
              </p>
              <Button asChild className="w-full">
                <Link href="/test-polls">Vote on Polls</Link>
              </Button>
            </CardContent>
          </Card>

          {/* User Dashboard */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                👤 User Dashboard
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-gray-600">
                Test user profiles, demographics, insights, and participation history
              </p>
              <Button asChild className="w-full">
                <Link href="/test-dashboard">User Dashboard</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Analytics & Admin */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                📈 Analytics & Admin
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-gray-600">
                Test analytics, user management, role assignment, and system stats
              </p>
              <Button asChild className="w-full">
                <Link href="/test-analytics">Analytics Dashboard</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Service Testing Panel */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>🔧 Direct Service Testing</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Direct access to test individual service methods and server actions
            </p>
            <div className="grid md:grid-cols-4 gap-4">
              <Button variant="outline" asChild>
                <Link href="/test-services/user">UserService</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/test-services/poll">PollService</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/test-services/voting">VotingService</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/test-services/statement">StatementService</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-12 p-6 bg-white rounded-lg shadow-sm">
          <p className="text-gray-600 mb-2">
            This test interface exercises all business logic in the Pulse platform
          </p>
          <p className="text-sm text-gray-500">
            All test pages are prefixed with &quot;test-&quot; for easy cleanup after real UI is ready
          </p>
        </div>
      </div>
    </div>
  );
}
