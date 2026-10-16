import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import { OfflineIndicator } from "@/src/client/components/offline-indicator";
import "./globals.css";

export const metadata: Metadata = {
  title: "SpeakQL — Capability, practiced in context",
  description: "Professional learning for the language, role, culture, and environment you choose.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "SpeakQL",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#060919" },
    { media: "(prefers-color-scheme: dark)", color: "#060919" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <body suppressHydrationWarning>
        <OfflineIndicator />
        {children}
        <Toaster position="top-center" />
      </body>
    </html>
  );
}

