import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Luma Learning | Learn brightly",
  description: "A calm, motivating learning platform for Basic 4 to Basic 9 learners, teachers and schools in Ghana.",
  openGraph: {
    title: "Luma Learning | Learn brightly",
    description: "Learn brightly. Grow confidently.",
    type: "website",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Luma Learning dashboard" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Luma Learning | Learn brightly",
    description: "Learn brightly. Grow confidently.",
    images: ["/og.png"],
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
