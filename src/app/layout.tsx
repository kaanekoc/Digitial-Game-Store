import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/header";

export const metadata: Metadata = {
  title: "NEXUS | Dijital Oyun Mağazası",
  description:
    "Yeni dünyalar keşfet. Oyunlarını ve başarımlarını tek yerde topla.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="tr">
      <body>
        <a className="skip-link" href="#content">
          İçeriğe geç
        </a>
        <Header />
        <div id="content">{children}</div>
        <footer className="site-footer">
          <span className="brand">NEXUS.</span>
          <span>Bir sonraki maceran burada başlar.</span>
          <span>Next.js + MySQL · Ders projesi</span>
        </footer>
      </body>
    </html>
  );
}
