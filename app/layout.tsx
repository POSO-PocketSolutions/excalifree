import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "POSO DRAW",
  description: "Self-hosted drawing app with local projects"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
