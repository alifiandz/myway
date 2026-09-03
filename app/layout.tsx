import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MyWay",
  description: "A Europe-first business university discovery and planning platform.",
  metadataBase: new URL("https://alif-pathway.smalhi2025.chatgpt.site"),
  openGraph: {
    title: "MyWay",
    description: "Plan university choices with evidence.",
    images: [{ url: "/og.png", width: 1730, height: 909, alt: "MyWay" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "MyWay",
    description: "Plan university choices with evidence.",
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
