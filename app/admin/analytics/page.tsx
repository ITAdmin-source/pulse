"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { HeatmapDashboard } from "@/components/analytics/heatmap-dashboard";
import { getAllPollsForAdminAction } from "@/actions/admin-actions";
import { ArrowLeft, BarChart3, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useCurrentUser } from "@/hooks/use-current-user";

interface Poll {
  id: string;
  slug: string;
  question: string;
  status: string;
}

export default function AdminAnalyticsPage() {
  const { user } = useCurrentUser();
  const [polls, setPolls] = useState<Poll[]>([]);
  const [selectedPollId, setSelectedPollId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPolls();
  }, []);

  const loadPolls = async () => {
    setLoading(true);
    try {
      const result = await getAllPollsForAdminAction();
      if (result.success && result.data) {
        const publishedPolls = result.data.filter(p => p.status === "published" || p.status === "closed");
        setPolls(publishedPolls);

        // Auto-select first poll if available
        if (publishedPolls.length > 0 && !selectedPollId) {
          setSelectedPollId(publishedPolls[0].id);
        }
      } else {
        toast.error(result.error || "Failed to load polls");
      }
    } catch (error) {
      console.error("Error loading polls:", error);
      toast.error("Failed to load polls");
    } finally {
      setLoading(false);
    }
  };

  const selectedPoll = polls.find(p => p.id === selectedPollId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/dashboard">
                <ArrowLeft className="h-4 w-4 me-2" />
                Back to Dashboard
              </Link>
            </Button>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Demographic Analytics
            </h1>
            <div className="w-32"></div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="space-y-6">
          {/* Poll Selector */}
          <Card>
            <CardHeader>
              <CardTitle>Select Poll</CardTitle>
              <CardDescription>
                Choose a poll to view demographic analytics
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                </div>
              ) : polls.length === 0 ? (
                <div className="text-center py-6 text-gray-500">
                  <p>No published or closed polls available</p>
                  <Button variant="link" asChild className="mt-2">
                    <Link href="/polls/create">Create your first poll</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <Select value={selectedPollId} onValueChange={setSelectedPollId}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a poll..." />
                    </SelectTrigger>
                    <SelectContent>
                      {polls.map((poll) => (
                        <SelectItem key={poll.id} value={poll.id}>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{poll.question}</span>
                            <span className="text-xs text-gray-500">({poll.status})</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {selectedPoll && (
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/polls/${selectedPoll.slug}/manage`}>
                          Manage Poll
                        </Link>
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/polls/${selectedPoll.slug}/results`}>
                          View Results
                        </Link>
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Demographic Heatmap Dashboard */}
          {selectedPollId && (
            <HeatmapDashboard
              pollId={selectedPollId}
              title="מפת חום דמוגרפית - תצוגת מנהל"
              description="התפלגות הסכמה מפורטת להצהרות לפי קבוצות דמוגרפיות"
              defaultAttribute="gender"
              autoRefreshInterval={30000}
            />
          )}

          {!selectedPollId && !loading && polls.length > 0 && (
            <Card>
              <CardContent className="py-12 text-center text-gray-500">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-lg">Select a poll to view analytics</p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
