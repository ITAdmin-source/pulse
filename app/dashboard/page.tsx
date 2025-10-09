"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardFooter, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Settings, BarChart3, Users } from "lucide-react";
import { getManagedPollsAction } from "@/actions/polls-actions";
import { useCurrentUser } from "@/hooks/use-current-user";
import { toast } from "sonner";
import type { Poll } from "@/db/schema/polls";

interface PollWithStats extends Poll {
  pendingCount?: number;
  voterCount?: number;
  isOwner?: boolean;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading: userLoading, isAuthenticated } = useCurrentUser();
  const [polls, setPolls] = useState<PollWithStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Redirect anonymous users
  useEffect(() => {
    if (!userLoading && !isAuthenticated) {
      router.push("/login?redirect=/dashboard");
    }
  }, [userLoading, isAuthenticated, router]);

  // Fetch managed polls
  useEffect(() => {
    const fetchPolls = async () => {
      if (!user?.id) return;

      setIsLoading(true);
      try {
        const result = await getManagedPollsAction(user.id);
        if (result.success && result.data) {
          setPolls(result.data);
        } else {
          toast.error("Failed to load polls");
        }
      } catch (error) {
        console.error("Error fetching managed polls:", error);
        toast.error("Failed to load polls");
      } finally {
        setIsLoading(false);
      }
    };

    if (user?.id) {
      fetchPolls();
    }
  }, [user?.id]);

  if (userLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <main className="container mx-auto px-4 py-8">
          <Skeleton className="h-12 w-64 mb-8" />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-64" />
            ))}
          </div>
        </main>
      </div>
    );
  }

  const ownedPolls = polls.filter(poll => poll.createdBy === user?.id);
  const managedPolls = polls.filter(poll => poll.createdBy !== user?.id);

  const getPollStatus = (poll: Poll): 'draft' | 'active' | 'scheduled' | 'closed' => {
    if (poll.status === 'draft') return 'draft';
    if (poll.status === 'closed') return 'closed';

    const now = new Date();

    if (poll.status === 'published') {
      if (poll.startTime && now < poll.startTime) return 'scheduled';
      if (poll.endTime && now > poll.endTime) return 'closed';
      return 'active';
    }

    return 'draft';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default">Active</Badge>;
      case 'draft':
        return <Badge variant="secondary">Draft</Badge>;
      case 'scheduled':
        return <Badge variant="outline">Scheduled</Badge>;
      case 'closed':
        return <Badge variant="destructive">Closed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const PollCard = ({ poll }: { poll: PollWithStats }) => {
    const status = getPollStatus(poll);
    const isOwner = poll.createdBy === user?.id;

    return (
      <Card className="flex flex-col hover:shadow-lg transition-shadow h-full">
        <CardHeader>
          <div className="flex items-start justify-between mb-2">
            {getStatusBadge(status)}
            {isOwner && (
              <Badge variant="outline" className="ms-2">
                Owner
              </Badge>
            )}
          </div>
          <CardTitle className="text-xl leading-tight line-clamp-2">
            {poll.question}
          </CardTitle>
          {poll.description && (
            <CardDescription className="line-clamp-2">
              {poll.description}
            </CardDescription>
          )}
        </CardHeader>

        <CardContent className="flex-grow">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Status</p>
              <p className="font-medium capitalize">{status}</p>
            </div>
            {poll.pendingCount !== undefined && poll.pendingCount > 0 && (
              <div>
                <p className="text-muted-foreground">Pending</p>
                <p className="font-medium text-amber-600">{poll.pendingCount} statements</p>
              </div>
            )}
            {poll.voterCount !== undefined && (
              <div>
                <p className="text-muted-foreground">Voters</p>
                <p className="font-medium">{poll.voterCount}</p>
              </div>
            )}
            <div>
              <p className="text-muted-foreground">Created</p>
              <p className="font-medium">
                {new Date(poll.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex gap-2">
          <Button asChild className="flex-1">
            <Link href={`/polls/${poll.slug}/manage`}>
              <Settings className="w-4 h-4 me-2" />
              Manage
            </Link>
          </Button>
          <Button asChild variant="outline" className="flex-1">
            <Link href={`/polls/${poll.slug}`}>
              <BarChart3 className="w-4 h-4 me-2" />
              View
            </Link>
          </Button>
        </CardFooter>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              My Polls Dashboard
            </h1>
            <p className="text-lg text-gray-600">
              Manage your polls and track engagement
            </p>
          </div>
          <Button asChild size="lg">
            <Link href="/polls/create">
              <Plus className="w-5 h-5 me-2" />
              Create Poll
            </Link>
          </Button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-80" />
            ))}
          </div>
        )}

        {/* Owned Polls Section */}
        {!isLoading && ownedPolls.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center mb-4">
              <Users className="w-5 h-5 me-2 text-gray-700" />
              <h2 className="text-2xl font-semibold text-gray-900">
                My Polls ({ownedPolls.length})
              </h2>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {ownedPolls.map((poll) => (
                <PollCard key={poll.id} poll={poll} />
              ))}
            </div>
          </section>
        )}

        {/* Managed Polls Section */}
        {!isLoading && managedPolls.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center mb-4">
              <Settings className="w-5 h-5 me-2 text-gray-700" />
              <h2 className="text-2xl font-semibold text-gray-900">
                Managed Polls ({managedPolls.length})
              </h2>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {managedPolls.map((poll) => (
                <PollCard key={poll.id} poll={poll} />
              ))}
            </div>
          </section>
        )}

        {/* Empty State */}
        {!isLoading && polls.length === 0 && (
          <div className="text-center py-16">
            <div className="bg-white rounded-lg shadow-sm p-12 max-w-md mx-auto">
              <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No polls yet
              </h3>
              <p className="text-gray-600 mb-6">
                Get started by creating your first poll
              </p>
              <Button asChild size="lg">
                <Link href="/polls/create">
                  <Plus className="w-5 h-5 me-2" />
                  Create Your First Poll
                </Link>
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
