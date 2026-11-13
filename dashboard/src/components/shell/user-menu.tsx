"use client";

import { Menu } from "@base-ui/react/menu";
import { ChevronDown, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { BACK } from "@/components/page-transition";
import { Avatar } from "@/components/patients/patient-bits";
import { useCaseload } from "@/hooks/use-caseload";
import { cn } from "@/lib/cn";
import { useSession } from "@/stores/session";

export function UserMenu() {
  const router = useRouter();
  const { clinician } = useCaseload();
  const signOut = useSession((state) => state.signOut);

  if (!clinician) return null;

  return (
    <Menu.Root>
      <Menu.Trigger
        className={cn(
          "flex h-11 cursor-pointer items-center gap-2 rounded-xl border border-line-strong bg-surface/60 pr-2.5 pl-1.5",
          "transition-[transform,translate,scale,background-color] duration-150 ease-out-strong",
          "hover:bg-surface active:scale-[0.97]",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
        )}
      >
        <Avatar name={clinician.name} size="sm" />
        <span className="hidden text-sm font-medium text-ink md:block">
          {clinician.name}
        </span>
        <span className="sr-only md:hidden">Account: {clinician.name}</span>
        <ChevronDown className="size-4 text-ink-subtle" aria-hidden="true" />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner align="end" sideOffset={8} className="z-50">
          <Menu.Popup
            className={cn(
              "glass-pop min-w-64 rounded-2xl border border-line p-1.5 outline-none",
              "origin-(--transform-origin) transition-[transform,translate,scale,opacity] duration-150 ease-out-strong",
              "data-[starting-style]:scale-95 data-[starting-style]:opacity-0",
              "data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[ending-style]:duration-100",
            )}
          >
            <div className="px-3 pt-2 pb-3">
              <p className="text-sm font-medium text-ink">{clinician.name}</p>
              <p className="text-xs text-ink-muted">{clinician.role}</p>
              <p className="mt-1 truncate text-xs text-ink-subtle">
                {clinician.email}
              </p>
            </div>
            <Menu.Separator className="mx-1.5 mb-1.5 h-px bg-line" />
            <Menu.Item
              onClick={() => {
                signOut();
                router.replace("/login", { transitionTypes: BACK });
              }}
              className="flex h-10 cursor-pointer items-center gap-2.5 rounded-xl px-3 text-sm text-ink outline-none data-[highlighted]:bg-inset"
            >
              <LogOut className="size-4 text-ink-muted" aria-hidden="true" />
              Sign out
            </Menu.Item>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}
