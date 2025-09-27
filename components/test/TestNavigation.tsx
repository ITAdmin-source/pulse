"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Home,
  Shield,
  BarChart3,
  FileText,
  Vote,
  User,
  TrendingUp,
  Settings,
  ChevronLeft
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const navItems: NavItem[] = [
  {
    href: "/",
    label: "Home",
    icon: <Home className="h-4 w-4" />,
    description: "Main test interface"
  },
  {
    href: "/test-auth",
    label: "Authentication",
    icon: <Shield className="h-4 w-4" />,
    description: "User auth & sessions"
  },
  {
    href: "/test-admin/polls",
    label: "Poll Management",
    icon: <BarChart3 className="h-4 w-4" />,
    description: "CRUD & lifecycle"
  },
  {
    href: "/test-admin/statements",
    label: "Statement System",
    icon: <FileText className="h-4 w-4" />,
    description: "Moderation queue"
  },
  {
    href: "/test-polls",
    label: "Voting Experience",
    icon: <Vote className="h-4 w-4" />,
    description: "Core voting flow"
  },
  {
    href: "/test-dashboard",
    label: "User Dashboard",
    icon: <User className="h-4 w-4" />,
    description: "Profile & insights"
  },
  {
    href: "/test-analytics",
    label: "Analytics",
    icon: <TrendingUp className="h-4 w-4" />,
    description: "Stats & admin tools"
  },
];

export function TestNavigation() {
  const pathname = usePathname();

  return (
    <Card className="p-4 bg-white border-l-4 border-l-blue-500">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-semibold text-lg">Test Navigation</h2>
          <Badge variant="destructive" className="mt-1">
            Temporary Test UI
          </Badge>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/" className="flex items-center gap-1">
            <ChevronLeft className="h-4 w-4" />
            Main
          </Link>
        </Button>
      </div>

      <nav className="space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                isActive
                  ? "bg-blue-50 text-blue-700 border border-blue-200"
                  : "hover:bg-gray-50 text-gray-700"
              }`}
            >
              <div className="flex-shrink-0">
                {item.icon}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-medium text-sm">{item.label}</div>
                <div className="text-xs text-gray-500 truncate">
                  {item.description}
                </div>
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="mt-6 pt-4 border-t">
        <div className="text-xs text-gray-500 mb-2">Direct Service Testing</div>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/test-services/user">UserService</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/test-services/poll">PollService</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/test-services/voting">VotingService</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/test-services/statement">StatementService</Link>
          </Button>
        </div>
      </div>
    </Card>
  );
}