import Link from "next/link";
import { Brand } from "@/components/shell/brand";
import { button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 p-6 text-center">
      <Brand />
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Page not found</h1>
        <p className="mt-2 max-w-sm text-sm text-ink-muted">
          That address does not match anything in the dashboard.
        </p>
      </div>
      <Link href="/dashboard" className={button({ intent: "secondary" })}>
        Back to your patients
      </Link>
    </main>
  );
}
