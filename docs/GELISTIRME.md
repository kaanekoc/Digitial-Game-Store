# Aşamalı geliştirme günlüğü

Her aşama ayrı commit ve push ile teslim edilir. İşlevler README'deki iş akışından türetilmiştir.

| Adım | Kapsam                                                         | Durum      |
| ---- | -------------------------------------------------------------- | ---------- |
| 1    | Next.js, TypeScript, ortam ayarları ve geliştirme planı        | Tamamlandı |
| 2    | MySQL kurulumu, örnek veriler, 3 trigger ve 3 stored procedure | Tamamlandı |
| 3    | Kayıt, giriş, güvenli oturum ve yetki kontrolü                 | Tamamlandı |
| 4    | Oyun listesi, arama, tür filtresi ve detay                     | Tamamlandı |
| 5    | Sepet, fiyat onayı, sipariş ve demo ödeme                      | Tamamlandı |
| 6    | Kütüphane, sipariş geçmişi ve doğrulanmış başarım API'si       | Tamamlandı |
| 7    | Yönetim: oyun, tür, başarım, kullanıcı yetkileri ve loglar     | Tamamlandı |
| 8    | Entegrasyon testleri, üretim derlemesi ve sunum belgeleri      | Tamamlandı |

## Tasarım kararları

- Mevcut 13 tabloluk şema korunur; oturumlar imzalı HttpOnly çerezlerle tutulur.
- Sepetten sipariş oluşturma, ödeme sonuçlandırma ve başarım verme stored procedure ile yapılır.
- Sepete ekleme kontrolü, oyun değişiklik günlüğü ve sipariş durum günlüğü trigger ile yapılır.
- Gerçek ödeme sağlayıcısı ve oyun sunucusu yerine açıkça etiketlenen ders araçları bulunur.
- Yönetici işlemleri sunucuda rol kontrolünden geçer. Ödeme ve sahiplik tek transaction içinde işlenir.

## Doğrulama

- TypeScript tür kontrolü ve Next.js üretim derlemesi.
- Gerçek MySQL üzerinde 10 test: SQL rutinleri, eşzamanlı ödeme tekrarı, sahiplik, fiyat onayı, başarım tekrarı, oturum imzası ve şifre sınırı.
- Chrome üzerinde 5 uçtan uca senaryo: kullanıcı akışı, yönetim, entegrasyon ve mobil görünüm.
- Yerel test ortamı: Node.js 22, MySQL 9.1, Chrome. GitHub Actions yapılandırması MySQL 8.4 kullanır.

Kurulum `README.md`, SQL açıklamaları `VERITABANI.md`, ders gösterimi `SUNUM.md` dosyasındadır.
