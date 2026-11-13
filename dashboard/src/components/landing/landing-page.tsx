"use client";

import NumberFlow from "@number-flow/react";
import {
  motion,
  useInView,
  useMotionValueEvent,
  useScroll,
  useTransform,
} from "motion/react";
import Link from "next/link";
import { useRef, useState, type ReactNode } from "react";
import { Reveal, RevealWords } from "@/components/landing/reveal";
import { SceneStage } from "@/components/landing/scene-stage";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/cn";
import { getClinician } from "@/lib/data/patients";
import { useSession } from "@/stores/session";

const EASE_OUT = [0.23, 1, 0.32, 1] as const;

const STEPS = [
  {
    title: "Sensors stream",
    body: "Each patient's wearable sends heart rate, blood oxygen, blood pressure, temperature and, for patients with diabetes, glucose. A new reading arrives every few seconds.",
    tag: "Live feed",
  },
  {
    title: "Every reading is checked",
    body: "Dropouts, duplicates and impossible values are filtered out first. What remains is scored Normal, Warning or Critical against limits set for that patient.",
    tag: "Warning",
  },
  {
    title: "The right clinician is told",
    body: "A Critical reading raises one alert, only for the clinician caring for that patient, with who, when and what went wrong. An alert left unacknowledged escalates.",
    tag: "Critical",
  },
  {
    title: "Trends tell the story",
    body: "History and trend charts show how a patient got here, so decisions rest on the pattern and not on a single number.",
    tag: "Recovered",
  },
];

const STATS = [
  { value: 5, label: "vital signs watched for every patient" },
  { value: 3, suffix: " s", label: "between readings in the live simulation" },
  { value: 1, label: "alert per Critical episode, never a flood" },
  { value: 0, label: "real patient records, at any stage" },
];

const SAFEGUARDS = [
  {
    title: "Only your patients",
    body: "A clinician sees the patients assigned to them and no one else. Another clinician's patient is refused, even by direct link.",
  },
  {
    title: "Faulty sensors stay quiet",
    body: "A dropped or impossible reading never raises a false alarm, and a missing signal never counts as recovery.",
  },
  {
    title: "Calm by design",
    body: "One notification at a time, alerts grouped into episodes, and escalation only when nobody has responded.",
  },
  {
    title: "No real data",
    body: "Every patient is simulated. The system is built with UK GDPR principles in mind from the first line.",
  },
];

function SectionLabel({ index, children }: { index: string; children: ReactNode }) {
  return (
    <p className="flex items-center gap-3 font-mono text-xs tracking-[0.18em] text-l-muted uppercase">
      <span className="text-l-clay">{index}</span>
      <span aria-hidden="true" className="h-px w-8 bg-l-line" />
      {children}
    </p>
  );
}

function PrimaryLink({ href, children, inverted = false }: { href: string; children: ReactNode; inverted?: boolean }) {
  return (
    <Link
      href={href}
      className={cn(
        "group inline-flex h-12 items-center gap-3 rounded-full px-6 text-sm font-medium",
        "transition-[transform,translate,scale,background-color,box-shadow] duration-200 ease-out-strong",
        "active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-l-clay",
        inverted
          ? "bg-l-band-ink text-l-band hover:shadow-[0_12px_30px_-12px_var(--l-band-ink)]"
          : "bg-l-ink text-l-bg hover:shadow-[0_14px_34px_-14px_var(--l-ink)]",
      )}
    >
      {children}
      <span aria-hidden="true" className="arrow-nudge">→</span>
    </Link>
  );
}

function Nav({ signedIn }: { signedIn: boolean }) {
  const { scrollY } = useScroll();
  const [raised, setRaised] = useState(false);
  useMotionValueEvent(scrollY, "change", (y) => setRaised(y > 24));

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-30 transition-[background-color,border-color,backdrop-filter] duration-300 ease-out",
        raised ? "border-b border-l-line bg-l-raised backdrop-blur-xl" : "border-b border-transparent",
      )}
    >
      <nav aria-label="Main" className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-5 sm:px-8">
        <Link href="/" className="flex items-center gap-2.5 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-l-clay">
          <span className="flex size-8 items-center justify-center rounded-lg bg-l-ink text-l-bg">
            <svg viewBox="0 0 24 24" className="size-4.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M2 12h4l2.5-6 4 12 3-9 1.5 3H22" />
            </svg>
          </span>
          <span className="text-sm font-semibold tracking-tight">Smart Vitals</span>
        </Link>
        <div className="hidden items-center gap-7 text-sm text-l-muted md:flex">
          {[
            ["#how", "How it works"],
            ["#numbers", "In numbers"],
            ["#safeguards", "Safeguards"],
          ].map(([href, label]) => (
            <a key={href} href={href} className="transition-colors duration-200 hover:text-l-ink">
              {label}
            </a>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link
            href={signedIn ? "/dashboard" : "/login"}
            className="group inline-flex h-11 items-center gap-2 rounded-full border border-l-line px-4 text-sm font-medium transition-[background-color,border-color,scale] duration-200 ease-out-strong hover:border-l-ink active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-l-clay"
          >
            {signedIn ? "Open dashboard" : "Sign in"}
            <span aria-hidden="true" className="arrow-nudge">→</span>
          </Link>
        </div>
      </nav>
    </header>
  );
}

function Hero({ signedIn }: { signedIn: boolean }) {
  return (
    <section className="relative flex min-h-dvh items-center px-5 pt-16 sm:px-8">
      <div className="mx-auto w-full max-w-7xl">
        <div className="max-w-2xl">
          <Reveal>
            <SectionLabel index="00">Remote patient monitoring</SectionLabel>
          </Reveal>
          <h1 className="mt-6 text-5xl leading-[1.02] font-semibold tracking-[-0.035em] text-balance sm:text-7xl">
            <RevealWords text="Vital signs, watched over." />
          </h1>
          <Reveal delay={0.25}>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-l-muted">
              A prototype for MedLink Community Health Trust. Live readings from wearable sensors,
              checked as they arrive, with a clear alert to the right clinician when something is wrong.
            </p>
          </Reveal>
          <Reveal delay={0.35} className="mt-9 flex flex-wrap items-center gap-4">
            <PrimaryLink href={signedIn ? "/dashboard" : "/login"}>
              {signedIn ? "Open the dashboard" : "Sign in to the dashboard"}
            </PrimaryLink>
            <a href="#how" className="group inline-flex h-12 items-center gap-2 px-2 text-sm font-medium text-l-muted transition-colors duration-200 hover:text-l-ink">
              See how it works
              <span aria-hidden="true" className="arrow-nudge arrow-nudge-down">↓</span>
            </a>
          </Reveal>
        </div>
      </div>
      <motion.div
        aria-hidden="true"
        className="absolute bottom-8 left-1/2 hidden -translate-x-1/2 font-mono text-[11px] tracking-[0.2em] text-l-muted uppercase sm:block"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.6 }}
      >
        Scroll
      </motion.div>
    </section>
  );
}

function StoryStep({ index, step }: { index: number; step: (typeof STEPS)[number] }) {
  const ref = useRef<HTMLDivElement>(null);
  const active = useInView(ref, { margin: "-45% 0px -45% 0px" });
  return (
    <div ref={ref} className="flex min-h-[90vh] items-center">
      <motion.article
        animate={{ opacity: active ? 1 : 0.28, y: active ? 0 : 12 }}
        transition={{ duration: 0.5, ease: EASE_OUT }}
        className="rounded-3xl border border-l-line bg-l-raised p-7 backdrop-blur-xl sm:p-9"
      >
        <SectionLabel index={String(index + 1).padStart(2, "0")}>{step.tag}</SectionLabel>
        <h3 className="mt-5 text-3xl font-semibold tracking-[-0.025em] sm:text-4xl">{step.title}</h3>
        <p className="mt-4 text-base leading-relaxed text-l-muted sm:text-lg">{step.body}</p>
      </motion.article>
    </div>
  );
}

function Stats() {
  const ref = useRef<HTMLDivElement>(null);
  const seen = useInView(ref, { once: true, margin: "0px 0px -15% 0px" });
  return (
    <section id="numbers" className="scroll-mt-20 px-5 py-28 sm:px-8 sm:py-36">
      <div className="mx-auto max-w-7xl">
        <Reveal>
          <SectionLabel index="05">In numbers</SectionLabel>
        </Reveal>
        <h2 className="mt-6 max-w-3xl text-4xl font-semibold tracking-[-0.03em] text-balance sm:text-5xl">
          <RevealWords text="Built to be calm when nothing is wrong." />
        </h2>
        <div ref={ref} className="mt-14 grid gap-px overflow-hidden rounded-3xl border border-l-line bg-l-line sm:grid-cols-2 lg:grid-cols-4">
          {STATS.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 16 }}
              animate={seen ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, ease: EASE_OUT, delay: index * 0.07 }}
              className="group bg-l-bg p-8 transition-colors duration-300 hover:bg-l-raised"
            >
              <p className="text-6xl font-semibold tracking-[-0.04em] text-l-ink">
                <NumberFlow value={seen ? stat.value : 0} suffix={stat.suffix} className="numeric" />
              </p>
              <p className="mt-4 max-w-[16rem] text-sm leading-relaxed text-l-muted">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Safeguards() {
  return (
    <section id="safeguards" className="scroll-mt-20 px-5 pb-28 sm:px-8 sm:pb-36">
      <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1fr_1.4fr]">
        <div>
          <Reveal>
            <SectionLabel index="06">Safeguards</SectionLabel>
          </Reveal>
          <h2 className="mt-6 text-4xl font-semibold tracking-[-0.03em] text-balance sm:text-5xl">
            <RevealWords text="Trust is the first feature." />
          </h2>
          <Reveal delay={0.2}>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-l-muted">
              A monitoring system is only useful if clinicians believe its alerts. These are the rules it never breaks.
            </p>
          </Reveal>
        </div>
        <ol className="border-t border-l-line">
          {SAFEGUARDS.map((item, index) => (
            <Reveal key={item.title} delay={index * 0.06}>
              <li className="group relative grid grid-cols-[3rem_1fr] gap-4 border-b border-l-line py-7 sm:grid-cols-[4rem_1fr]">
                <span aria-hidden="true" className="absolute inset-y-0 left-0 w-full origin-left scale-x-0 bg-l-raised transition-[scale] duration-500 ease-out-strong group-hover:scale-x-100" />
                <span className="relative font-mono text-sm text-l-clay">{String(index + 1).padStart(2, "0")}</span>
                <div className="relative">
                  <h3 className="text-xl font-semibold tracking-tight transition-[translate] duration-300 ease-out-strong group-hover:translate-x-1.5">
                    {item.title}
                  </h3>
                  <p className="mt-2 max-w-xl leading-relaxed text-l-muted">{item.body}</p>
                </div>
              </li>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}

function CallToAction({ signedIn }: { signedIn: boolean }) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "center center"] });
  const scale = useTransform(scrollYProgress, [0, 1], [0.94, 1]);
  const radius = useTransform(scrollYProgress, [0, 1], [56, 28]);

  return (
    <section ref={ref} className="px-3 pb-3 sm:px-5 sm:pb-5">
      <motion.div
        style={{ scale, borderRadius: radius }}
        className="mx-auto max-w-[96rem] bg-l-band px-6 py-24 text-l-band-ink sm:px-14 sm:py-32"
      >
        <div className="mx-auto max-w-4xl text-center">
          <p className="font-mono text-xs tracking-[0.18em] text-l-band-muted uppercase">07 · Try it</p>
          <h2 className="mt-6 text-4xl font-semibold tracking-[-0.03em] text-balance sm:text-6xl">
            See it working on a live, simulated caseload.
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-l-band-muted">
            Sign in with a demo clinician account, open a patient and press Simulate deterioration to watch an alert arrive.
          </p>
          <div className="mt-10 flex justify-center">
            <PrimaryLink href={signedIn ? "/dashboard" : "/login"} inverted>
              {signedIn ? "Open the dashboard" : "Sign in"}
            </PrimaryLink>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

export function LandingPage() {
  const story = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: story, offset: ["start start", "end end"] });
  const sceneOpacity = useTransform(scrollYProgress, [0.93, 1], [1, 0]);
  const signedIn = useSession((state) => state.hydrated && getClinician(state.clinicianId) !== null);

  return (
    <div className="landing min-h-dvh overflow-x-clip">
      <Nav signedIn={signedIn} />
      <main id="main">
        <div ref={story} className="relative">
          <div className="absolute inset-0">
            <motion.div style={{ opacity: sceneOpacity }} className="sticky top-0 h-dvh">
              <SceneStage progress={scrollYProgress} />
            </motion.div>
          </div>
          <div className="pointer-events-none relative [&_a]:pointer-events-auto [&_article]:pointer-events-auto">
            <Hero signedIn={signedIn} />
            <section id="how" className="scroll-mt-16 px-5 sm:px-8">
              <div className="mx-auto grid max-w-7xl md:grid-cols-2">
                <div className="hidden md:block" />
                <div className="pb-[10vh]">
                  {STEPS.map((step, index) => (
                    <StoryStep key={step.title} index={index} step={step} />
                  ))}
                </div>
              </div>
            </section>
          </div>
        </div>
        <Stats />
        <Safeguards />
        <CallToAction signedIn={signedIn} />
      </main>
      <footer className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-10 text-sm text-l-muted sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <p>Smart Vitals · CMS22301 Intelligent Systems prototype</p>
        <p>Simulated data only. No real patient data is used.</p>
      </footer>
    </div>
  );
}
