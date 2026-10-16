import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MyWay",
  description: "Explore. Plan. Go Further.",
  metadataBase: new URL("https://mywaypath.com"),
  alternates: { canonical: "/" },
  openGraph: {
    url: "/",
    title: "MyWay",
    description: "Explore. Plan. Go Further.",
    images: [{ url: "/og.png?v=7659380fd28a", width: 1733, height: 907, alt: "MyWay" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "MyWay",
    description: "Explore. Plan. Go Further.",
    images: ["/og.png?v=7659380fd28a"],
  },
  icons: {
    icon: "/myway-mark.png",
    apple: "/myway-mark.png",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
