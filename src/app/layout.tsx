import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { UserMenu } from "@/components/user-menu";

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-background`}>
        <div className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_20%,rgba(15,118,110,0.12),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(14,165,233,0.12),transparent_30%)]" />
          <header className="sticky top-0 z-20 border-b border-white/30 bg-white/60 backdrop-blur-xl">
            <div className="mx-auto flex w-[min(1180px,94vw)] items-center justify-between gap-4 py-4">
              <div className="flex items-center gap-3">
                <span className="h-2.5 w-2.5 rounded-full bg-primary shadow-[0_0_0_8px] shadow-primary/15" />
                <div>
                  <p className="text-sm text-muted-foreground">otoPublisher</p>
                  <p className="font-semibold">otoPublisher</p>
                </div>
              </div>
              <nav className="flex items-center gap-4 text-sm text-muted-foreground">
                <Link className="transition hover:text-foreground" href="/">
                  Home
                </Link>
                <Link className="transition hover:text-foreground" href="/dashboard">
                  Dashboard
                </Link>
                <Link className="transition hover:text-foreground" href="/import">
                  Import
                </Link>
                <Link className="transition hover:text-foreground" href="/posts">
                  Posts
                </Link>
                <Link className="transition hover:text-foreground" href="/settings/platforms">
                  Platforms
                </Link>
                <Link className="transition hover:text-foreground" href="/profile">
                  Profile
                </Link>
              </nav>
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
                  v0.1 scaffold
                </span>
                <UserMenu />
              </div>
            </div>
          </header>
          <main className="mx-auto w-[min(1180px,94vw)] py-10">{children}</main>
        </div>
        <Toaster />
      </body>
    </html>
  );
}
