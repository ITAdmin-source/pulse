import type { Poll } from "@/db/schema/polls";

/**
 * Poll with aggregate statistics
 * Used in poll listing pages to display voter counts and total vote counts
 */
export type PollWithStats = Poll & {
  totalVoters: number;
  totalVotes: number;
};
