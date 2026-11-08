import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NEXUS | Dijital Oyun Mağazası",
  description: "Yeni dünyalar keşfet. Oyunlarını ve başarımlarını tek yerde topla.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="tr"><body>{children}</body></html>;
}
