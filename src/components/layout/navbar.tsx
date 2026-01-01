import Link from "next/link";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { UserMenu } from "@/components/auth/user-menu";
import { requireApproved } from "@/lib/auth-helpers";
import { BarChart3 } from "lucide-react";

export async function Navbar() {
  const { user } = await requireApproved();

  return (
    <nav className="border-b">
      <div className="container mx-auto flex h-16 items-center px-4">
        <Link href="/dashboard" className="flex items-center space-x-2">
          <BarChart3 className="h-6 w-6" />
          <span className="font-semibold text-lg">Performance Dashboard</span>
        </Link>
        <div className="ml-auto flex items-center space-x-4">
          <Link
            href="/dashboard"
            className="text-sm font-medium transition-colors hover:text-primary"
          >
            Dashboard
          </Link>
          <Link
            href="/upload"
            className="text-sm font-medium transition-colors hover:text-primary"
          >
            Upload
          </Link>
          <Link
            href="/metrics"
            className="text-sm font-medium transition-colors hover:text-primary"
          >
            Metrics
          </Link>
          <Link
            href="/visualize"
            className="text-sm font-medium transition-colors hover:text-primary"
          >
            Visualize
          </Link>
          <ThemeToggle />
          <UserMenu userEmail={user.email} userName={user.name} />
        </div>
      </div>
    </nav>
  );
}
