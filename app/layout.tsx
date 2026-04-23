import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Diriyah · Event Day Operations — Orchestration Console",
  description:
    "Pilot A · Event Day Operations. A demo of the scenario orchestration layer for Diriyah smart city.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
