import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { Geist, Geist_Mono } from "next/font/google";
import { UserMenu } from "@/components/user-menu";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "otoPublisher",
  description: "Schedule and publish content to TikTok and Instagram.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <header className="surface" style={{ position: "sticky", top: 0, zIndex: 10 }}>
          <div className="container row-between" style={{ padding: "14px 0" }}>
            <div className="row" style={{ gap: 12 }}>
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 12,
                  background: "linear-gradient(135deg, #ff7fbf, #ffc857)",
                  display: "grid",
                  placeItems: "center",
                  color: "#2b0f24",
                  fontWeight: 800,
                }}
              >
                oP
              </div>
              <div className="stack" style={{ gap: 2 }}>
                <span style={{ fontWeight: 700 }}>otoPublisher</span>
                <span style={{ fontSize: 12, color: "var(--muted)" }}>Happy social scheduler</span>
              </div>
            </div>
            <nav className="row" style={{ gap: 16, fontWeight: 600, color: "var(--muted)" }}>
              <Link href="/">Home</Link>
              <Link href="/dashboard">Dashboard</Link>
              <Link href="/import">Import</Link>
              <Link href="/posts">Posts</Link>
              <Link href="/settings/platforms">Platforms</Link>
            </nav>
            <div className="row" style={{ gap: 12 }}>
              <span className="pill badge-strong">v0.2 joyful</span>
              <UserMenu />
            </div>
          </div>
        </header>
        <main className="container page">{children}</main>
        <footer className="container footer">
          <div className="row-between">
            <div className="stack" style={{ gap: 4 }}>
              <strong>otoPublisher</strong>
              <span>Built for busy teams who want happy, hands-off posting.</span>
            </div>
            <div className="row" style={{ gap: 14 }}>
              <Link href="/dashboard">Dashboard</Link>
              <Link href="/settings/platforms">Platform settings</Link>
              <Link href="/import">Import guide</Link>
              <a href="mailto:ops@example.com">Support</a>
            </div>
          </div>
          <div style={{ marginTop: 10, fontSize: 12, color: "var(--muted)" }}>
            © {new Date().getFullYear()} otoPublisher.
          </div>
        </footer>
        <Toaster />
      </body>
    </html>
  );
}
