import Link from "next/link";
import {
  Activity,
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  Globe2,
  LockKeyhole,
  Rocket,
  UploadCloud,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const marquee = [
  "Post to TikTok & Instagram together",
  "No-code, no devs needed",
  "Auto-post while you work or sleep",
  "Media + captions stay in sync",
  "Live status with safe retries",
  "Built for busy owners & managers",
];

const featureCards = [
  {
    title: "One calendar, two platforms",
    body: "Plan once—AutoPoster publishes to TikTok and Instagram on time, together.",
    icon: <Rocket className="h-5 w-5 text-primary" />,
  },
  {
    title: "Drag-and-drop friendly",
    body: "Upload photos/videos or paste a simple plan file. We check times and media for you.",
    icon: <UploadCloud className="h-5 w-5 text-primary" />,
  },
  {
    title: "Resilient publishes",
    body: "If TikTok or Instagram hiccups, we retry automatically so your posts still go out.",
    icon: <Activity className="h-5 w-5 text-primary" />,
  },
  {
    title: "Security-first",
    body: "Safe by default. Login-only access; tokens stay server-side and teammates see just what they need.",
    icon: <LockKeyhole className="h-5 w-5 text-primary" />,
  },
];

const steps = [
  "Connect TikTok and Instagram once (we guide you—no code).",
  "Upload photos or videos, add captions, set times.",
  "AutoPoster posts for you. Watch status in the dashboard.",
];

const metrics = [
  { label: "Setup time", value: "~10 min", detail: "We guide you, step by step" },
  { label: "Time saved weekly", value: "5+ hours", detail: "Batch schedule, then relax" },
  { label: "Peace of mind", value: "Retries on by default", detail: "We handle hiccups" },
];

export default function LandingPage() {
  return (
    <div className="space-y-16 pb-12">
      <section className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-[#0f1729] via-[#1b1d3b] to-[#301834] px-6 py-16 shadow-[0_40px_90px_rgba(0,0,0,0.28)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_25%,rgba(241,91,181,0.18),transparent_35%),radial-gradient(circle_at_85%_15%,rgba(99,102,241,0.18),transparent_30%),radial-gradient(circle_at_50%_80%,rgba(248,217,233,0.12),transparent_40%)]" />
        <div className="relative grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="space-y-6 text-white">
            <Badge variant="secondary" className="bg-white/15 text-white backdrop-blur">
              otoPublisher · Multi-platform
            </Badge>
            <h1 className="text-4xl font-semibold leading-tight md:text-5xl">
              Keep TikTok & Instagram posting while you focus on the business.
            </h1>
            <p className="max-w-xl text-lg text-white/80">
              Made for owners and community managers: drop your posts in once, and otoPublisher publishes with smart
              retries, clear status, and zero dev work.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/login">
                  Get started <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="secondary" className="bg-white/20 text-white hover:bg-white/30">
                <Link href="/settings/platforms">Book a setup call</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white/40 text-white hover:border-white">
                <Link href="/dashboard">View dashboard</Link>
              </Button>
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-white/75">
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-lime-300" />
                No-code scheduling
              </span>
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-lime-300" />
                Auto-posts with retries
              </span>
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-lime-300" />
                Live status & health
              </span>
            </div>
          </div>

          <Card className="relative border-white/10 bg-white/95 backdrop-blur">
            <div className="absolute left-6 top-6 rounded-full bg-[#f15bb5]/15 px-3 py-1 text-xs font-semibold text-[#f15bb5]">
              Preview
            </div>
            <CardHeader className="pt-10">
              <CardTitle className="text-lg">A glimpse of the control room</CardTitle>
              <p className="text-sm text-muted-foreground">
                Status, cadence, and tokens at a glance—mirrors the in-app dashboard.
              </p>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="rounded-xl border bg-muted/60 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Scheduled posts</span>
                  <span className="text-2xl font-semibold">24</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">Targets: TikTok, Instagram</p>
              </div>
              <div className="rounded-xl border bg-muted/60 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Next run ETA</span>
                  <span className="text-lg font-semibold">03:12</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">Heartbeat + manual trigger ready.</p>
              </div>
              <div className="rounded-xl border bg-muted/60 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Tokens</span>
                  <div className="flex gap-2">
                    <Badge variant="secondary">TikTok</Badge>
                    <Badge variant="secondary">Instagram</Badge>
                  </div>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">Expiry tracked with warnings.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border bg-card">
        <div className="flex animate-[marquee_22s_linear_infinite] gap-6 whitespace-nowrap px-6 py-3 text-xs text-muted-foreground [--tw-translate-x:0%]">
          {[...marquee, ...marquee].map((item, idx) => (
            <span key={idx} className="inline-flex items-center gap-2">
              <BadgeCheck className="h-3.5 w-3.5 text-primary" />
              {item}
            </span>
          ))}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {featureCards.map((feature) => (
          <Card key={feature.title} className="h-full">
            <CardHeader className="flex flex-row items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10">
                {feature.icon}
              </div>
              <CardTitle className="text-base">{feature.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{feature.body}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {metrics.map((metric) => (
          <Card key={metric.label} className="h-full border-primary/10">
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">{metric.label}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-3xl font-semibold">{metric.value}</p>
              <p className="text-xs text-muted-foreground">{metric.detail}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="rounded-2xl border bg-card px-6 py-8 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <Badge variant="secondary">Launch in 3 steps</Badge>
            <h2 className="mt-2 text-2xl font-semibold">From tokens to first publish</h2>
            <p className="text-sm text-muted-foreground">
              Follow this quick path—no engineering needed.
            </p>
          </div>
          <Button asChild>
            <Link href="/settings/platforms">Open platform settings</Link>
          </Button>
        </div>
        <ol className="mt-6 grid gap-4 md:grid-cols-3">
          {steps.map((step, idx) => (
            <li key={idx} className="rounded-xl border bg-muted/40 p-4 text-sm text-muted-foreground">
              <div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                {idx + 1}
              </div>
              {step}
            </li>
          ))}
        </ol>
      </section>

      <section className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <Card className="h-full">
          <CardHeader>
            <Badge variant="outline">Why people use otoPublisher</Badge>
            <CardTitle className="mt-2 text-xl">Made for non-technical teams</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p className="flex items-start gap-2">
              <LockKeyhole className="mt-0.5 h-4 w-4 text-primary" /> Safe by default: tokens stay on the server;
              you just click “Post”.
            </p>
            <p className="flex items-start gap-2">
              <Activity className="mt-0.5 h-4 w-4 text-primary" /> Clear status: see what’s queued, posted, or
              needs attention, without digging into logs.
            </p>
            <p className="flex items-start gap-2">
              <Globe2 className="mt-0.5 h-4 w-4 text-primary" /> Works on desktop or phone; no installs, no coding.
            </p>
          </CardContent>
        </Card>

        <Card className="h-full border-dashed bg-muted/40">
          <CardHeader className="space-y-2">
            <Badge className="w-fit" variant="secondary">
              Help for small teams
            </Badge>
            <CardTitle className="text-xl">We’ll get you set up</CardTitle>
            <p className="text-sm text-muted-foreground">
              Short on time? We can walk you through connecting accounts and running your first post.
            </p>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
              Guided token connection for TikTok and Instagram.
            </p>
            <p className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
              We’ll import your first calendar or create one with you.
            </p>
            <p className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
              Live test publish to confirm everything works—then you’re hands-off.
            </p>
            <p className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
              Ongoing reminders for expiring tokens so nothing stalls.
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="rounded-2xl border bg-card px-6 py-8 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <Badge variant="outline">FAQs</Badge>
            <CardTitle className="mt-2 text-xl">Quick answers for busy teams</CardTitle>
            <p className="text-sm text-muted-foreground">
              The essentials you need to know—no tech-speak.
            </p>
          </div>
          <Button asChild variant="secondary">
            <Link href="/settings/platforms">Book a setup call</Link>
          </Button>
        </div>
        <CardContent className="mt-4 space-y-3 text-sm">
          <div className="grid gap-3 md:grid-cols-2">
            {[
              {
                q: "Do I need a public domain?",
                a: "For TikTok/Instagram sign-in, a live HTTPS link helps. Start locally, then switch to your domain— we’ll guide you.",
              },
              {
                q: "Where are my tokens stored?",
                a: "On the server only, inside Supabase. Browsers never see them; teammates only see status.",
              },
              {
                q: "Do I need a developer?",
                a: "No. Everything is point-and-click. We can hop on a short call to connect your accounts.",
              },
              {
                q: "Can I pause or edit a scheduled post?",
                a: "Yes. Disable, retry, or republish from the dashboard with one click.",
              },
              {
                q: "What if a post fails?",
                a: "Auto retries kick in. You’ll see the reason and can retry after fixing tokens or media.",
              },
              {
                q: "Can my team collaborate?",
                a: "Yes. Invite teammates; roles keep tokens safe while everyone can see status.",
              },
              {
                q: "Does it work with videos?",
                a: "Yes—upload video or image files. We handle posting to both platforms.",
              },
              {
                q: "Do I need to keep my laptop on?",
                a: "No. Once scheduled, posts go out from the server—even if you’re offline.",
              },
            ].map(({ q, a }) => (
              <details
                key={q}
                className="group rounded-lg border bg-muted/40 px-3 py-2 transition hover:border-primary/40"
              >
                <summary className="flex cursor-pointer items-center justify-between text-foreground">
                  <span className="font-medium">{q}</span>
                  <span className="text-xs text-muted-foreground group-open:hidden">+</span>
                  <span className="text-xs text-muted-foreground hidden group-open:inline">–</span>
                </summary>
                <p className="mt-2 text-sm text-muted-foreground">{a}</p>
              </details>
            ))}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/30 px-3 py-3 text-xs text-muted-foreground">
            <span>Need hands-on help? We’ll connect your accounts and run a test post with you.</span>
            <Button asChild size="sm" variant="outline">
              <Link href="mailto:ops@example.com">Email us</Link>
            </Button>
          </div>
        </CardContent>
      </section>

      <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border bg-gradient-to-r from-emerald-50 to-sky-50 px-6 py-6">
        <div>
          <h3 className="text-xl font-semibold">Ready to ship on schedule?</h3>
          <p className="text-sm text-muted-foreground">
            Sign in, paste tokens, and run a test publish. The scheduler and logs will guide the rest.
          </p>
        </div>
        <div className="flex gap-3">
          <Button asChild>
            <Link href="/login">Sign in</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard">View dashboard</Link>
          </Button>
        </div>
      </section>

      <footer className="mt-4 rounded-2xl border bg-card px-6 py-6 text-sm text-muted-foreground">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <p className="text-foreground font-semibold">otoPublisher</p>
            <p>Multi-platform social scheduler built with Next.js + Supabase.</p>
          </div>
          <div className="flex flex-wrap gap-6">
            <div className="space-y-1">
              <p className="text-foreground font-medium">Product</p>
              <Link className="block hover:text-foreground" href="/dashboard">
                Dashboard
              </Link>
              <Link className="block hover:text-foreground" href="/settings/platforms">
                Platform settings
              </Link>
            </div>
            <div className="space-y-1">
              <p className="text-foreground font-medium">Support</p>
              <Link className="block hover:text-foreground" href="/import">
                Import guide
              </Link>
              <a className="block hover:text-foreground" href="mailto:ops@example.com">
                ops@example.com
              </a>
            </div>
          </div>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          © {new Date().getFullYear()} otoPublisher. Built for teams that can’t miss a slot.
        </p>
      </footer>
    </div>
  );
}
