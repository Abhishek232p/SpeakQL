import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import { OfflineIndicator } from "@/src/client/components/offline-indicator";
import "./globals.css";

export const metadata: Metadata = {
  title: "SpeakQL — Capability, practiced in context",
  description: "Professional learning for the language, role, culture, and environment you choose.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "SpeakQL",
  },
};

export const viewport: Viewport = {
  themeColor: "#060919",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
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

