import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Luma Learning | Learn brightly",
  description: "A calm, motivating learning platform for Basic 4 to Basic 9 learners, teachers and schools in Ghana.",
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
