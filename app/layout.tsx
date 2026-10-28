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
    images: [{ url: "/og.png?v=f273347a141f", width: 1733, height: 907, alt: "MyWay" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "MyWay",
    description: "Explore. Plan. Go Further.",
    images: ["/og.png?v=f273347a141f"],
  },
  icons: {
    icon: "/myway-mark.png?v=brand-20261028",
    apple: "/myway-mark.png?v=brand-20261028",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
