import type { Metadata } from "next";
import Link from "next/link";
import { Analytics } from "@vercel/analytics/next";
import { ALLOW_INDEXING, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Kindred Path — A gentle guide after loss and for planning ahead",
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  robots: ALLOW_INDEXING ? { index: true, follow: true } : { index: false, follow: false },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: "Kindred Path — A gentle guide after loss and for planning ahead",
    description: SITE_DESCRIPTION,
    url: SITE_URL,
  },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600&family=Nunito+Sans:wght@400;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        {children}
        <nav aria-label="Legal" className="mx-auto flex max-w-6xl flex-wrap gap-x-4 gap-y-1 px-4 pb-6 text-xs text-muted sm:px-6">
          <Link href="/privacy" className="hover:text-ink">
            Privacy
          </Link>
          <Link href="/terms" className="hover:text-ink">
            Terms
          </Link>
          <span>Not legal advice. Wren is an AI.</span>
          <span>In crisis? Call or text 988.</span>
        </nav>
        {/* Cookieless page-view counts. Turn on in Vercel → Analytics. */}
        <Analytics />
      </body>
    </html>
  );
}
