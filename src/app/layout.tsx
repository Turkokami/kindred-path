import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kindred Path — A gentle guide after loss and for planning ahead",
  description:
    "Kindred Path is an AI guide that walks families through the steps after someone dies and helps people plan ahead to protect what they love, then connects them with the right attorney.",
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
      <body className="antialiased">{children}</body>
    </html>
  );
}
