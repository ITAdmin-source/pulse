import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

interface PollCardProps {
  slug: string;
  question: string;
  description?: string | null;
  status: "draft" | "published" | "closed";
  voterCount: number;
  statementCount: number;
  endTime?: Date | null;
}

export function PollCard({
  slug,
  question,
  description,
  status,
  voterCount,
  statementCount,
  endTime,
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
      <CardHeader>
        <div className="flex items-start justify-between mb-2">
          <Badge variant={statusColors[status]}>
            {statusLabels[status]}
          </Badge>
        </div>
        <CardTitle className="text-xl leading-tight">
          {question}
        </CardTitle>
        {description && (
          <CardDescription className="line-clamp-2">
            {description}
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="flex-grow">
        <div className="flex gap-4 text-sm text-gray-600">
          <span>{voterCount} voters</span>
          <span>{statementCount} statements</span>
        </div>
        {status === "published" && endTime && (
          <p className="text-sm text-gray-500 mt-2">
            Ends {new Date(endTime).toLocaleDateString()}
          </p>
        )}
      </CardContent>

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
