import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Popping Time — Bedtime Stories, Together",
  description: "Co-create magical bedtime stories with your children through voice recordings that become illustrated books.",
  icons: {
    icon: "/favicon.ico",
    apple: "/logo.png",
  },
  openGraph: {
    title: "Popping Time",
    description: "Turn bedtime into unforgettable stories your family will treasure forever.",
    images: ["/logo.png"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}

