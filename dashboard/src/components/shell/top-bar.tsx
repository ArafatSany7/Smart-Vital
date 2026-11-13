import { AlertBell } from "@/components/alerts/alert-bell";
import { Brand } from "@/components/shell/brand";
import { UserMenu } from "@/components/shell/user-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { FeedIndicator } from "@/components/vitals/feed-indicator";

export function TopBar() {
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between gap-4 glass-panel border-b border-line px-4 sm:px-6">
      <div className="flex min-w-0 items-center">
        <Brand href="/dashboard" compact className="lg:hidden" />
        <p className="hidden text-sm text-ink-muted lg:block">
          Clinician dashboard
        </p>
      </div>
      <div className="flex items-center gap-2 sm:gap-3">
        <FeedIndicator />
        <AlertBell />
        <ThemeToggle />
        <UserMenu />
      </div>
    </header>
  );
}
