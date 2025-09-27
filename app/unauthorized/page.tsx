import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldX } from "lucide-react";
import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-screen">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <ShieldX className="h-12 w-12 text-destructive mx-auto mb-4" />
          <CardTitle className="text-xl">Access Denied</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            You don&apos;t have permission to access this page.
          </p>
          <div className="space-y-2">
            <Button asChild className="w-full">
              <Link href="/">Go Home</Link>
            </Button>
            <Button variant="outline" asChild className="w-full">
              <Link href="/login">Sign In</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}