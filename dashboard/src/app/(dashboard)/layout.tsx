import { AlertNotifier } from "@/components/alerts/alert-notifier";
import { AuthGate } from "@/components/auth-gate";
import { FeedEngine } from "@/components/feed-engine";
import { AppShell } from "@/components/shell/app-shell";

export default function DashboardLayout({ children }: LayoutProps<"/">) {
  return (
    <AuthGate>
      <FeedEngine />
      <AlertNotifier />
      <AppShell>{children}</AppShell>
    </AuthGate>
  );
}
