/**
 * Opinion Map Page - Privacy-Preserving Clustering Visualization
 * Route: /polls/[slug]/opinionmap
 *
 * Shows group boundaries, centroids, and current user's position ONLY
 * Does NOT show individual positions of other users (privacy protection)
 */

import { redirect } from "next/navigation";
import { OpinionMapClient } from "@/components/clustering/opinion-map-client";
import { getPollBySlugAction } from "@/actions/polls-actions";
import { checkClusteringEligibilityAction } from "@/actions/clustering-actions";

interface OpinionMapPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function OpinionMapPage({ params }: OpinionMapPageProps) {
  const resolvedParams = await params;

  // Fetch poll data server-side
  const pollResult = await getPollBySlugAction(resolvedParams.slug);

  if (!pollResult.success || !pollResult.data) {
    redirect("/polls");
  }

  const poll = pollResult.data;

  // Check clustering eligibility server-side
  const eligibilityResult = await checkClusteringEligibilityAction(poll.id);

  if (!eligibilityResult.success || !eligibilityResult.data) {
    redirect(`/polls/${poll.slug}`);
  }

  const eligibility = eligibilityResult.data;

  // Pass server-fetched data to client component
  return <OpinionMapClient poll={poll} eligibility={eligibility} />;
}
