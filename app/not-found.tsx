import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Compass } from "lucide-react";
import { errorPages } from "@/lib/strings/he";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-page">
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center space-y-4">
            {/* Large 404 Number */}
            <div className="text-7xl font-bold text-primary-600 leading-none">
              {errorPages.notFound.errorCode}
            </div>

            {/* Compass Icon */}
            <Compass className="h-16 w-16 text-primary-600 mx-auto" />

            {/* Title */}
            <CardTitle className="text-2xl">
              {errorPages.notFound.title}
            </CardTitle>

            {/* Subtitle */}
            <p className="text-lg text-muted-foreground">
              {errorPages.notFound.subtitle}
            </p>
          </CardHeader>

          <CardContent className="text-center space-y-4">
            {/* Description */}
            <p className="text-sm text-muted-foreground">
              {errorPages.notFound.description}
            </p>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2">
              <Button asChild className="w-full" size="lg">
                <Link href="/">
                  {errorPages.notFound.homeButton}
                </Link>
              </Button>
              <Button variant="outline" asChild className="w-full" size="lg">
                <Link href="/polls">
                  {errorPages.notFound.pollsButton}
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
