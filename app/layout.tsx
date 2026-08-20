import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Alif Pathway",
  description: "A personalized university preparation and application planner for Alif.",
  metadataBase: new URL("https://alif-pathway.smalhi2025.chatgpt.site"),
  openGraph: {
    title: "Alif Pathway",
    description: "Plan university choices with evidence.",
    images: [{ url: "/og.png", width: 1730, height: 909, alt: "Alif Pathway" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Alif Pathway",
    description: "Plan university choices with evidence.",
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
