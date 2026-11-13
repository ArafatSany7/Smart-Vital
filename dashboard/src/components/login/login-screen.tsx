"use client";

import { Eye, EyeOff, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useLayoutEffect,
  useState,
  type CSSProperties,
  type FormEvent,
} from "react";
import { EcgLine } from "@/components/login/ecg-line";
import { BACK, FORWARD } from "@/components/page-transition";
import { Avatar } from "@/components/patients/patient-bits";
import { Brand } from "@/components/shell/brand";
import { ThemeToggle } from "@/components/theme-toggle";
import { SectionLabel } from "@/components/ui/section-label";
import { Button, button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import { useHydrated } from "@/hooks/use-hydrated";
import { DEMO_PASSCODE } from "@/lib/auth/mock-auth";
import { cn } from "@/lib/cn";
import { getClinician } from "@/lib/data/patients";
import { CLINICIANS } from "@/lib/vitals/roster";
import { useSession } from "@/stores/session";

const POINTS = [
  "Live vital signs from each patient's sensors",
  "An alert to you when a reading is Critical",
  "Only the patients assigned to you",
];

const enter = (step: number) =>
  ({ "--i": step }) as CSSProperties;

export function LoginScreen() {
  const router = useRouter();
  const signIn = useSession((state) => state.signIn);
  const alreadySignedIn = useSession(
    (state) => state.hydrated && getClinician(state.clinicianId) !== null,
  );

  const hydrated = useHydrated();

  const [email, setEmail] = useState("");
  const [passcode, setPasscode] = useState("");
  const [showPasscode, setShowPasscode] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (alreadySignedIn) router.replace("/dashboard", { transitionTypes: FORWARD });
  }, [alreadySignedIn, router]);

  useLayoutEffect(() => {
    return () => {
      setEmail("");
      setPasscode("");
      setShowPasscode(false);
      setError(null);
    };
  }, []);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = signIn(email, passcode);
    if (!result.ok) setError(result.error);
  }

  return (
    <main className="grid min-h-dvh lg:grid-cols-[1.1fr_1fr]">
      <section className="relative hidden flex-col justify-between overflow-hidden glass-panel border-r border-line p-10 lg:flex">
        <Brand />
        <div>
          <EcgLine className="w-full max-w-xl" />
          <SectionLabel index="00" className="mt-10">Clinician access</SectionLabel>
          <h2 className="mt-5 max-w-lg text-4xl leading-[1.05] font-semibold tracking-[-0.03em] text-balance text-ink">
            Remote monitoring for the patients in your care.
          </h2>
          <ol className="mt-8 border-t border-line">
            {POINTS.map((point, index) => (
              <li
                key={point}
                className="flex items-center gap-5 border-b border-line py-3.5 text-sm text-ink-muted"
              >
                <span className="font-mono text-xs text-l-clay">{String(index + 1).padStart(2, "0")}</span>
                {point}
              </li>
            ))}
          </ol>
        </div>
        <p className="flex items-center gap-2 text-xs text-ink-subtle">
          <ShieldCheck className="size-4 shrink-0" aria-hidden="true" />
          Prototype. Simulated data only: no real patient data is used.
        </p>
      </section>
      <section className="flex flex-col px-4 py-4 sm:px-6">
        <div className="flex items-center justify-between">
          <Brand className="lg:invisible" />
          <ThemeToggle />
        </div>
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">
          <div className="tile-enter" style={enter(0)}>
            <Link
              href="/"
              transitionTypes={BACK}
              className="group mb-8 inline-flex h-9 items-center gap-2 rounded-lg text-sm text-ink-muted transition-colors duration-200 hover:text-ink"
            >
              <span aria-hidden="true" className="arrow-nudge arrow-nudge-back">←</span>
              Back to Smart Vitals
            </Link>
            <h1 className="text-4xl font-semibold tracking-[-0.03em] text-ink">
              Sign in
            </h1>
            <p className="mt-1 text-sm text-ink-muted">
              Use your MedLink clinician account.
            </p>
          </div>
          <form
            method="post"
            onSubmit={handleSubmit}
            noValidate
            className="tile-enter mt-8 space-y-4"
            style={enter(1)}
          >
            <TextField
              label="Email"
              type="email"
              name="email"
              autoComplete="username"
              inputMode="email"
              spellCheck={false}
              required
              value={email}
              invalid={error !== null}
              onChange={(event) => {
                setEmail(event.target.value);
                setError(null);
              }}
            />
            <TextField
              label="Passcode"
              type={showPasscode ? "text" : "password"}
              name="passcode"
              autoComplete="current-password"
              required
              value={passcode}
              invalid={error !== null}
              onChange={(event) => {
                setPasscode(event.target.value);
                setError(null);
              }}
              trailing={
                <button
                  type="button"
                  onClick={() => setShowPasscode((shown) => !shown)}
                  aria-label={showPasscode ? "Hide passcode" : "Show passcode"}
                  aria-pressed={showPasscode}
                  className={button({ intent: "ghost", size: "icon" })}
                >
                  {showPasscode ? (
                    <EyeOff className="size-[18px]" aria-hidden="true" />
                  ) : (
                    <Eye className="size-[18px]" aria-hidden="true" />
                  )}
                </button>
              }
            />
            <p
              role="alert"
              className={cn(
                "text-sm text-critical",
                error === null && "sr-only",
              )}
            >
              {error}
            </p>
            <Button type="submit" className="w-full" disabled={!hydrated}>
              Sign in
            </Button>
          </form>
          <div className="tile-enter mt-10" style={enter(2)}>
            <h2 className="text-xs font-medium tracking-wide text-ink-subtle uppercase">
              Demo accounts
            </h2>
            <ul className="mt-3 space-y-2">
              {CLINICIANS.map((clinician) => (
                <li key={clinician.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setEmail(clinician.email);
                      setPasscode(DEMO_PASSCODE);
                      setError(null);
                    }}
                    className={cn(
                      "flex w-full cursor-pointer items-center gap-3 rounded-xl border border-line bg-glass p-2.5 text-left backdrop-blur-md",
                      "transition-[transform,translate,scale,border-color,background-color] duration-150 ease-out-strong",
                      "hover:border-accent/40 hover:bg-surface/80 active:scale-[0.98]",
                      "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
                    )}
                  >
                    <Avatar name={clinician.name} />
                    <span className="min-w-0 flex-1 leading-tight">
                      <span className="block truncate text-sm font-medium text-ink">
                        {clinician.name}
                      </span>
                      <span className="block truncate text-xs text-ink-muted">
                        {clinician.role}
                      </span>
                    </span>
                    <span className="pr-1 text-xs text-ink-subtle">Fill in</span>
                  </button>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-ink-subtle">
              Every demo account uses the passcode{" "}
              <code className="rounded-md border border-line bg-inset px-1.5 py-0.5 font-mono text-ink-muted">
                {DEMO_PASSCODE}
              </code>
              . Each one sees a different set of patients.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
