import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

interface PollCardProps {
  slug: string;
  question: string;
  status: "draft" | "published" | "closed";
}

export function PollCard({
  slug,
  question,
  status,
}: PollCardProps) {
  const statusColors = {
    draft: "secondary" as const,
    published: "default" as const,
    closed: "secondary" as const,
  };

  const statusLabels = {
    draft: "Draft",
    published: "Active",
    closed: "Closed",
  };

  return (
    <Card className="flex flex-col hover:shadow-lg transition-shadow h-full">
      <CardHeader className="flex-grow">
        <div className="flex items-start justify-between mb-2">
          <Badge variant={statusColors[status]}>
            {statusLabels[status]}
          </Badge>
        </div>
        <CardTitle className="text-xl leading-tight">
          {question}
        </CardTitle>
      </CardHeader>

      <CardFooter>
        <Button asChild className="w-full">
          <Link href={status === "closed" ? `/polls/${slug}/closed` : `/polls/${slug}`}>
            {status === "published" ? "Vote Now" : "View Results"}
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
