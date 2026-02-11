 "use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { FiClock, FiRefreshCcw, FiShield, FiSmile } from "react-icons/fi";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const marquee = [
  "No-code posting",
  "Built for owners & managers",
  "Smart retries",
  "Happy tokens, happy team",
  "Auto-post to TikTok + Instagram",
];

const features = [
  {
    title: "One plan, two platforms",
    body: "Drop media + captions once; we sync to TikTok and Instagram together.",
    icon: <FiSmile size={18} color="#ff7fbf" />,
  },
  {
    title: "Gentle alerts",
    body: "Tokens expiring? We warn early so you never miss a slot.",
    icon: <FiClock size={18} color="#55d6ff" />,
  },
  {
    title: "Safe by default",
    body: "Tokens stay server-side; teammates see only what they need.",
    icon: <FiShield size={18} color="#ffc857" />,
  },
  {
    title: "Retry magic",
    body: "Network wobble? We retry with backoff and log every step.",
    icon: <FiRefreshCcw size={18} color="#8bf7c1" />,
  },
];

const steps = [
  "Connect TikTok + Instagram (paste tokens or add via guided flow).",
  "Upload media or use storage; add captions and times.",
  "Start the scheduler. Watch the happy logs roll in.",
];

const workflow = [
  { title: "Plan", detail: "Drag in media and captions, set times once for both platforms." },
  { title: "Validate", detail: "We check media availability, schedule windows, and token freshness." },
  { title: "Publish", detail: "Scheduler posts with retries and updates logs instantly." },
  { title: "Celebrate", detail: "See permalinks, warnings, and next-run ETA in one dashboard." },
];

const faqs = [
  { q: "Do I need a developer?", a: "No. It’s click-to-connect and paste tokens. We guide you if anything feels technical." },
  { q: "Does it work with videos?", a: "Yes—TikTok and Instagram video support, with upload and pull-from-URL options." },
  { q: "What if a post fails?", a: "Auto backoff + retries. You’ll see the reason and can requeue with one click." },
  { q: "Is my data safe?", a: "Tokens stay on the server; logs show status only. Roles keep sensitive fields limited." },
];

const testimonials = [
  { name: "Amira, café owner", quote: "I plan Sundays, and otoPublisher keeps both feeds busy all week." },
  { name: "Leo, community manager", quote: "Retries and clear logs mean I sleep through post time." },
  { name: "Céline, boutique founder", quote: "Finally, no copy-pasting between apps. One plan, done." },
];

const pricing = [
  { name: "Starter", price: "$19/mo", points: ["Solo operator", "Up to 2 platforms", "Email alerts"] },
  { name: "Team", price: "$49/mo", points: ["Up to 5 seats", "Priority retries", "Slack-style alerts (soon)"] },
  { name: "Ops", price: "Let’s talk", points: ["SLA support", "Custom webhooks", "Onboarding help"] },
];

export default function LandingPage() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    gsap.registerPlugin(ScrollTrigger);
    const elements = gsap.utils.toArray<HTMLElement>("[data-anim]");
    elements.forEach((el, idx) => {
      gsap.fromTo(
        el,
        { opacity: 0, y: 24 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          delay: idx * 0.05,
          ease: "power2.out",
          scrollTrigger: {
            trigger: el,
            start: "top 82%",
          },
        },
      );
    });
    return () => ScrollTrigger.getAll().forEach((t) => t.kill());
  }, []);

  return (
    <div className="stack" style={{ gap: 24 }}>
      <section
        className="surface section hero-blob anim"
        data-anim
        style={{
          minHeight: "92vh",
          maxHeight: "100vh",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          alignItems: "center",
          gap: 24,
          paddingBlock: 56,
        }}
      >
        <div className="stack" style={{ gap: 18 }}>
          <div className="pill badge-strong" style={{ width: "fit-content" }}>
            Joyful social autopilot
          </div>
          <h1 style={{ margin: 0, fontSize: 42, lineHeight: 1.1 }}>
            Never miss a TikTok or Instagram slot again.
          </h1>
          <p style={{ margin: 0, fontSize: 17, color: "var(--muted)", maxWidth: 560 }}>
            otoPublisher watches your tokens, validates media, retries when APIs wobble, and shows live status—so busy owners and community managers can relax.
          </p>
          <div className="cta">
            <Button asChild size="lg">
              <Link href="/login">Start scheduling</Link>
            </Button>
            <Button asChild variant="ghost" size="lg">
              <Link href="/settings/platforms">Platform setup</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/dashboard">See dashboard</Link>
            </Button>
          </div>
          <div className="pillbar">
            {marquee.map((item) => (
              <span key={item} className="pill">
                {item}
              </span>
            ))}
          </div>
          <div className="grid-2">
            <div className="surface section stack">
              <p style={{ margin: 0, color: "var(--muted)", fontSize: 13 }}>Live scheduler</p>
              <p style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Every 60s with backoff</p>
              <p style={{ margin: 0, color: "var(--muted)", fontSize: 12 }}>Retries + heartbeats</p>
            </div>
            <div className="surface section stack">
              <p style={{ margin: 0, color: "var(--muted)", fontSize: 13 }}>Tokens</p>
              <p style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>TikTok · Instagram</p>
              <p style={{ margin: 0, color: "var(--muted)", fontSize: 12 }}>Expiry watched with alerts</p>
            </div>
          </div>
        </div>

        <div className="card stack" style={{ gap: 12 }}>
          <div className="surface" style={{ borderRadius: 20, overflow: "hidden" }}>
            <Image
              src="/images/hero.png"
              alt="People scheduling posts happily"
              width={1000}
              height={720}
              priority
              style={{ width: "100%", height: "auto", objectFit: "cover", maxHeight: "64vh" }}
            />
          </div>
          <div className="surface section stack">
            <div className="row-between">
              <span className="badge-strong badge">Preview</span>
              <span className="badge">24 scheduled</span>
            </div>
            <div className="grid-2">
              <div className="stack" style={{ gap: 4 }}>
                <p style={{ margin: 0, color: "var(--muted)", fontSize: 13 }}>Next run ETA</p>
                <p style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>03:12</p>
              </div>
              <div className="stack" style={{ gap: 4 }}>
                <p style={{ margin: 0, color: "var(--muted)", fontSize: 13 }}>Tokens</p>
                <p style={{ margin: 0, fontSize: 14 }}>Happy · Expiry watched</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid-2" data-anim>
        {features.map((f) => (
          <Card key={f.title}>
            <CardHeader>
              <CardTitle className="row" style={{ gap: 8 }}>
                {f.icon}
                {f.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p style={{ margin: 0, color: "var(--muted)" }}>{f.body}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="surface section stack anim" data-anim>
        <div className="row-between">
          <div className="stack" style={{ gap: 6 }}>
            <Badge variant="subtle">Happy path</Badge>
            <h2 style={{ margin: 0 }}>How otoPublisher runs the show</h2>
            <p style={{ margin: 0, color: "var(--muted)" }}>From upload to celebrate—four calm steps.</p>
          </div>
          <Button asChild variant="outline">
            <Link href="/dashboard">View dashboard</Link>
          </Button>
        </div>
        <div className="grid-2">
          {workflow.map((item) => (
            <div key={item.title} className="surface section stack">
              <p style={{ margin: 0, fontWeight: 700 }}>{item.title}</p>
              <p style={{ margin: 0, color: "var(--muted)" }}>{item.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="surface section stack">
        <div className="row-between">
          <div className="stack" style={{ gap: 6 }}>
            <Badge variant="subtle">Launch in 3 steps</Badge>
            <h2 style={{ margin: 0 }}>From tokens to first publish</h2>
            <p style={{ margin: 0, color: "var(--muted)" }}>Follow these steps—no manuals required.</p>
          </div>
          <Button asChild variant="primary">
            <Link href="/settings/platforms">Open settings</Link>
          </Button>
        </div>
        <ol className="stack" style={{ gap: 10, paddingLeft: 18, margin: 0 }}>
          {steps.map((s, i) => (
            <li key={s} style={{ color: "var(--muted)", lineHeight: 1.6 }}>
              <strong style={{ color: "var(--ink)" }}>{i + 1}.</strong> {s}
            </li>
          ))}
        </ol>
      </section>

      <section className="grid-3" data-anim>
        <Card>
          <CardHeader>
            <CardTitle>Empty state preview</CardTitle>
          </CardHeader>
          <CardContent className="stack">
            <div className="surface" style={{ borderRadius: 16, overflow: "hidden" }}>
              <Image
                src="/images/dashboard_empty_state.png"
                alt="Cute robot delivering posts"
                width={700}
                height={520}
                style={{ width: "100%", height: "auto" }}
              />
            </div>
            <p style={{ margin: 0, color: "var(--muted)" }}>
              Friendly robot drops your posts into the queue.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Testimonials collage</CardTitle>
          </CardHeader>
          <CardContent className="stack">
            <div className="surface" style={{ borderRadius: 16, overflow: "hidden" }}>
              <Image
                src="/images/Testimonials_collage.png"
                alt="Happy customers collage"
                width={700}
                height={520}
                style={{ width: "100%", height: "auto" }}
              />
            </div>
            <p style={{ margin: 0, color: "var(--muted)" }}>Real smiles from owners and managers.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Icon set</CardTitle>
          </CardHeader>
          <CardContent className="stack">
            <div className="row" style={{ gap: 14, flexWrap: "wrap" }}>
              {[
                { src: "/images/clock_icon.png", alt: "Clock icon" },
                { src: "/images/shield_icon.png", alt: "Shield icon" },
                { src: "/images/paper_plane_icon.png", alt: "Paper plane icon" },
                { src: "/images/film_clapperboard_icon.png", alt: "Clapperboard icon" },
                { src: "/images/linked_circles_icon.png", alt: "Linked circles icon" },
              ].map((icon) => (
                <div key={icon.src} className="surface" style={{ padding: 10, borderRadius: 14 }}>
                  <Image src={icon.src} alt={icon.alt} width={64} height={64} />
                </div>
              ))}
            </div>
            <p style={{ margin: 0, color: "var(--muted)" }}>Use across features and tooltips.</p>
          </CardContent>
        </Card>
      </section>

      <section className="surface section stack anim" data-anim>
        <div className="row-between">
          <div className="stack" style={{ gap: 6 }}>
            <Badge variant="strong">People are smiling</Badge>
            <h2 style={{ margin: 0 }}>Trusted by non-technical teams</h2>
            <p style={{ margin: 0, color: "var(--muted)" }}>Owners, creators, and managers who’d rather not babysit posts.</p>
          </div>
          <Button asChild variant="ghost">
            <Link href="/settings/platforms">See platform setup</Link>
          </Button>
        </div>
        <div className="grid-3">
          {testimonials.map((t) => (
            <Card key={t.name}>
              <CardContent className="stack" style={{ gap: 8 }}>
                <p style={{ margin: 0, fontWeight: 700 }}>{t.name}</p>
                <p style={{ margin: 0, color: "var(--muted)" }}>&ldquo;{t.quote}&rdquo;</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="grid-3" data-anim>
        {pricing.map((tier) => (
          <Card key={tier.name} className="surface section stack">
            <div className="row-between">
              <h3 style={{ margin: 0 }}>{tier.name}</h3>
              <Badge variant="strong">{tier.price}</Badge>
            </div>
            <ul className="list-clean stack" style={{ gap: 6, color: "var(--muted)" }}>
              {tier.points.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
            <Button variant={tier.name === "Team" ? "primary" : "outline"}>Choose {tier.name}</Button>
          </Card>
        ))}
      </section>

      <section className="surface section stack anim" data-anim>
        <div className="row-between">
          <div className="stack" style={{ gap: 6 }}>
            <Badge variant="subtle">FAQs</Badge>
            <h2 style={{ margin: 0 }}>Quick answers</h2>
          </div>
        </div>
        <div className="grid-2">
          {faqs.map((f) => (
            <div key={f.q} className="surface section stack">
              <p style={{ margin: 0, fontWeight: 700 }}>{f.q}</p>
              <p style={{ margin: 0, color: "var(--muted)" }}>{f.a}</p>
            </div>
          ))}
        </div>
      </section>

      <section
        className="card stack anim"
        style={{
          backgroundImage: "url(/images/gradient_waves_bg.png)",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
        data-anim
      >
        <div className="row-between">
          <div className="stack" style={{ gap: 6 }}>
            <h3 style={{ margin: 0 }}>Ready to play?</h3>
            <p style={{ margin: 0, color: "var(--muted)" }}>
              Paste tokens, run a test publish, and let the scheduler cheerfully handle the rest.
            </p>
          </div>
          <div className="cta">
            <Button asChild>
              <Link href="/login">Sign in</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/dashboard">View dashboard</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
