"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return <main className="empty"><h1>Bir bağlantı sorunu oluştu.</h1><p>Veritabanı bağlantısını ve ortam ayarlarını kontrol edip tekrar dene.</p><button className="button" onClick={reset}>Tekrar dene</button></main>;
}
