import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SpeakQL — Capability, practiced in context",
  description: "Professional learning for the language, role, culture, and environment you choose.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
