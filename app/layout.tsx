/**
 * Root layout for the AI Governance & Agent Risk Assessment Platform.
 *
 * STRUCTURE:
 * - Providers: Client-side context providers (RoleProvider for MVP testing)
 * - Children: Page content
 *
 * @see app/providers.tsx - Client-side providers wrapper
 */

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI Governance Platform",
  description: "AI Agent Risk Assessment and Approval Workflow",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
