"use client";

import { useRouter } from "next/navigation";
import { CardDeckPackage } from "./card-deck-package";

interface ClickableCardDeckProps {
  pollSlug: string;
  pollQuestion: string;
  allowUserStatements?: boolean;
  description?: string;
  navigateTo: "vote" | "insights" | "results";
}

export function ClickableCardDeck({
  pollSlug,
  pollQuestion,
  allowUserStatements = false,
  description,
  navigateTo,
}: ClickableCardDeckProps) {
  const router = useRouter();

  const handleClick = () => {
    const path = navigateTo === "vote"
      ? `/polls/${pollSlug}/vote`
      : navigateTo === "insights"
      ? `/polls/${pollSlug}/insights`
      : `/polls/${pollSlug}/results`;

    router.push(path);
  };

  return (
    <CardDeckPackage
      pollQuestion={pollQuestion}
      allowUserStatements={allowUserStatements}
      description={description}
      onClick={handleClick}
    />
  );
}
