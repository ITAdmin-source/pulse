"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { getPublishedPollsAction } from "@/actions/polls-actions";
import { toast } from "sonner";
import { PollDeckCard } from "@/components/polls/poll-deck-card";

type PollStatus = "all" | "active" | "closed";
type SortBy = "recent" | "popular" | "ending";

interface Poll {
  id: string;
  slug: string;
  question: string;
  description?: string | null;
  emoji?: string | null;
  status: string;
  endTime?: Date | null;
  createdAt: Date;
  totalVoters?: number;
  statementCount?: number;
}

export default function PollsPage() {
  const { isSignedIn } = useUser();
  const [polls, setPolls] = useState<Poll[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<PollStatus>("active");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("recent");

  // Fetch polls on mount
  useEffect(() => {
    const fetchPolls = async () => {
      setIsLoading(true);
      try {
        const result = await getPublishedPollsAction();
        if (result.success && result.data) {
          setPolls(result.data);
        } else {
          toast.error("Failed to load polls");
        }
      } catch (error) {
        console.error("Error fetching polls:", error);
        toast.error("Failed to load polls");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPolls();
  }, []);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Filter, search, and sort polls
  const filteredPolls = useMemo(() => {
    let result = [...polls];

    // Apply status filter
    if (statusFilter === "active") {
      result = result.filter(poll => {
        if (poll.status !== "published") return false;
        if (!poll.endTime) return true;
        return new Date(poll.endTime) > new Date();
      });
    } else if (statusFilter === "closed") {
      result = result.filter(poll => {
        if (poll.status === "closed") return true;
        if (poll.endTime && new Date(poll.endTime) <= new Date()) return true;
        return false;
      });
    }

    // Apply search filter (debounced)
    if (debouncedSearchQuery.trim()) {
      const query = debouncedSearchQuery.toLowerCase();
      result = result.filter(poll =>
        poll.question.toLowerCase().includes(query) ||
        (poll.description && poll.description.toLowerCase().includes(query))
      );
    }

    // Apply sorting
    if (sortBy === "recent") {
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sortBy === "popular") {
      result.sort((a, b) => (b.totalVoters || 0) - (a.totalVoters || 0));
    } else if (sortBy === "ending") {
      result.sort((a, b) => {
        // Polls without end time go to the end
        if (!a.endTime && !b.endTime) return 0;
        if (!a.endTime) return 1;
        if (!b.endTime) return -1;
        // Sort by end time ascending (soonest first)
        return new Date(a.endTime).getTime() - new Date(b.endTime).getTime();
      });
    }

    return result;
  }, [polls, statusFilter, debouncedSearchQuery, sortBy]);

  // Determine poll display status
  const getPollStatus = (poll: Poll) => {
    if (poll.status === "closed") return "closed";
    if (poll.endTime && new Date(poll.endTime) <= new Date()) return "closed";
    return "active";
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Main Content - Header is handled by AdaptiveHeader */}
      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <section className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Pick a Deck to Explore
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Choose a deck, sort the cards, and discover your unique perspective.
          </p>
        </section>

        {/* Filters */}
        <section className="mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex gap-2">
            <Button
              variant={statusFilter === "active" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("active")}
            >
              Active
            </Button>
            <Button
              variant={statusFilter === "closed" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("closed")}
            >
              Closed
            </Button>
            <Button
              variant={statusFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("all")}
            >
              All
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            <Input
              type="search"
              placeholder="Search polls..."
              className="w-full md:w-64"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortBy)}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Most Recent</SelectItem>
                <SelectItem value="popular">Most Popular</SelectItem>
                <SelectItem value="ending">Ending Soon</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </section>

        {/* Loading State */}
        {isLoading && (
          <section className="grid gap-8 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="w-full aspect-[2/3]">
                <Skeleton className="w-full h-full rounded-3xl" />
              </div>
            ))}
          </section>
        )}

        {/* Poll Deck Grid */}
        {!isLoading && filteredPolls.length > 0 && (
          <section className="grid gap-8 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {filteredPolls.map((poll) => {
              const displayStatus = getPollStatus(poll);
              return (
                <PollDeckCard
                  key={poll.id}
                  slug={poll.slug}
                  question={poll.question}
                  status={displayStatus}
                  emoji={poll.emoji}
                />
              );
            })}
          </section>
        )}

        {/* Empty State */}
        {!isLoading && filteredPolls.length === 0 && (
          <div className="text-center py-16">
            <p className="text-xl text-gray-600 mb-4">No polls found</p>
            <p className="text-gray-500 mb-6">
              {searchQuery ? "Try adjusting your search or filters" : "Try adjusting your filters or check back later"}
            </p>
            {isSignedIn && (
              <Button variant="outline" asChild>
                <Link href="/polls/create">Create a Poll</Link>
              </Button>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
