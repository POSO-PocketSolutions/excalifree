import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Excalidraw Home",
  description: "Self-hosted Excalidraw with local projects"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
