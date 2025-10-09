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
          <CardTitle className="text-xl">גישה נדחתה</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            אין לך הרשאה לגשת לדף זה.
          </p>
          <div className="space-y-2">
            <Button asChild className="w-full">
              <Link href="/">חזור לדף הבית</Link>
            </Button>
            <Button variant="outline" asChild className="w-full">
              <Link href="/login">התחבר</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}