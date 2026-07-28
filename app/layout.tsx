import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LUMA Learning Platform | Learn Smarter. Achieve More.",
  description: "A complete digital learning platform for students, teachers, and schools.",
  openGraph: {
    title: "LUMA Learning Platform",
    description: "Learn Smarter. Achieve More.",
    type: "website",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Luma Learning dashboard" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "LUMA Learning Platform",
    description: "Learn Smarter. Achieve More.",
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
