import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Excalidraw Home",
  description: "Excalidraw self-hosted con proyectos locales"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
