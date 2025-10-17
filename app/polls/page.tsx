"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
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
import { PollCardGradient } from "@/components/polls-v2/poll-card-gradient";
import { SignUpBanner } from "@/components/banners/sign-up-banner";
import { pollsList } from "@/lib/strings/he";
import { colors } from "@/lib/design-tokens-v2";

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
  totalVoters: number;
  totalVotes: number;
}

export default function PollsPage() {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<PollStatus>("active");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("recent");
  const [dismissedBanner, setDismissedBanner] = useState(false);

  // Load banner dismissal state from localStorage
  useEffect(() => {
    const dismissed = localStorage.getItem('signUpBannerDismissed');
    if (dismissed === 'true') {
      setDismissedBanner(true);
    }
  }, []);

  // Fetch polls on mount
  useEffect(() => {
    const fetchPolls = async () => {
      setIsLoading(true);
      try {
        const result = await getPublishedPollsAction();
        if (result.success && result.data) {
          setPolls(result.data);
        } else {
          toast.error("נכשל לטעון סקרים");
        }
      } catch (error) {
        console.error("Error fetching polls:", error);
        toast.error("נכשל לטעון סקרים");
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
    <div className={`min-h-screen ${colors.background.page.className}`}>
      {/* Sticky Auth Header */}
      <header className="sticky top-0 z-50 bg-gradient-header backdrop-blur-md border-b border-primary-500-20">
        <div className="container mx-auto px-4 py-3 flex justify-end items-center">
          {/* Auth Controls */}
          <SignedOut>
            <div className="flex gap-2">
              <SignInButton mode="modal">
                <Button variant="ghost" size="sm" className="text-white hover-bg-primary-700 hover:text-white">
                  כניסה
                </Button>
              </SignInButton>
              <SignUpButton mode="modal">
                <Button variant="outline" size="sm" className="bg-white-95 border-primary-400-40 text-primary-700 hover-bg-primary-700 hover:text-white hover:border-primary-400-60">
                  הצטרפות
                </Button>
              </SignUpButton>
            </div>
          </SignedOut>

          <SignedIn>
            <UserButton
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  userButtonAvatarBox: "w-9 h-9",
                  userButtonPopoverCard: "z-[60]"
                }
              }}
            />
          </SignedIn>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        {/* Welcome Section */}
        <section className="mb-12 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4 tracking-tight">
            {pollsList.appTitle}
          </h1>
          <p className="text-lg sm:text-xl text-white-80 max-w-2xl mx-auto font-light">
            {pollsList.heroHeadline}
          </p>
        </section>

        {/* Filters */}
        <section className="mb-8 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex gap-2">
            <Button
              variant={statusFilter === "active" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("active")}
              className={statusFilter === "active" ? "btn-primary" : "bg-transparent border-white-20 text-white hover-bg-white-10"}
            >
              {pollsList.filterActive}
            </Button>
            <Button
              variant={statusFilter === "closed" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("closed")}
              className={statusFilter === "closed" ? "btn-primary" : "bg-transparent border-white-20 text-white hover-bg-white-10"}
            >
              {pollsList.filterClosed}
            </Button>
            <Button
              variant={statusFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("all")}
              className={statusFilter === "all" ? "btn-primary" : "bg-transparent border-white-20 text-white hover-bg-white-10"}
            >
              {pollsList.filterAll}
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            <Input
              type="search"
              placeholder={pollsList.searchPlaceholder}
              className="w-full md:w-64 bg-white-10 border-white-20 text-white placeholder-white-60"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortBy)}>
              <SelectTrigger className="w-full sm:w-40 bg-white-10 border-white-20 text-white">
                <SelectValue placeholder={pollsList.sortByLabel} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">{pollsList.sortRecent}</SelectItem>
                <SelectItem value="popular">{pollsList.sortPopular}</SelectItem>
                <SelectItem value="ending">{pollsList.sortEnding}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </section>

        {/* Loading State */}
        {isLoading && (
          <section className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="w-full h-80">
                <Skeleton className="w-full h-full rounded-2xl bg-white-10" />
              </div>
            ))}
          </section>
        )}

        {/* Poll Grid */}
        {!isLoading && filteredPolls.length > 0 && (
          <section className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
            {filteredPolls.map((poll) => {
              const displayStatus = getPollStatus(poll);
              return (
                <PollCardGradient
                  key={poll.id}
                  slug={poll.slug}
                  question={poll.question}
                  emoji={poll.emoji}
                  status={displayStatus}
                  voteCount={poll.totalVotes}
                  voterCount={poll.totalVoters}
                />
              );
            })}
          </section>
        )}

        {/* Empty State */}
        {!isLoading && filteredPolls.length === 0 && (
          <div className="text-center py-16">
            <p className="text-xl text-white mb-4">{pollsList.emptyStateTitle}</p>
            <p className="text-white-70 mb-6">
              {searchQuery ? pollsList.emptyStateSearchHint : pollsList.emptyStateFilterHint}
            </p>
            <SignedIn>
              <Button variant="outline" asChild className="border-white-20 text-white hover-bg-white-10">
                <Link href="/polls/create">{pollsList.createPollCta}</Link>
              </Button>
            </SignedIn>
          </div>
        )}

        {/* Sign Up Banner */}
        <SignedOut>
          {!dismissedBanner && (
            <section className="mt-8 sm:mt-12">
              <SignUpBanner
                onDismiss={() => {
                  setDismissedBanner(true);
                  localStorage.setItem('signUpBannerDismissed', 'true');
                }}
              />
            </section>
          )}
        </SignedOut>
      </main>
    </div>
  );
}
