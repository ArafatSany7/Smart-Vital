import { Brand } from "@/components/shell/brand";
import { UserMenu } from "@/components/shell/user-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { FeedIndicator } from "@/components/vitals/feed-indicator";

export function TopBar() {
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between gap-4 border-b border-line bg-canvas/80 px-4 backdrop-blur-md sm:px-6">
      <div className="flex min-w-0 items-center">
        <Brand href="/" className="lg:hidden" />
        <p className="hidden text-sm text-ink-muted lg:block">
          Clinician dashboard
        </p>
      </div>
      <div className="flex items-center gap-2 sm:gap-3">
        <FeedIndicator />
        <ThemeToggle />
        <UserMenu />
      </div>
    </header>
  );
}
