import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Alif Pathway",
  description: "A personalized university preparation and application planner for Alif.",
  other: { "codex-preview": "development" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
