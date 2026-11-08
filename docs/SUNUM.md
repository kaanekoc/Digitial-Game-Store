# Ders sunumu: yaklaşık 10 dakika

1. **Commit geçmişini göster.** `git log --oneline --reverse` ile başlangıç şeması ve ardından sekiz geliştirme aşamasını göster. Her aşamanın kapsamı `GELISTIRME.md` içinde bulunur.
2. **İlişkileri açıkla.** `database/schema.dbml` dosyasını dbdiagram.io'ya yapıştır. Kullanıcı–sipariş–sipariş kalemi–sahiplik ilişkisini ve oyun–tür çoktan çoğa bağlantısını göster.
3. **Mağazayı kullan.** İsme göre ara, tür filtresi uygula, detayda açıklama, görseller, fiyat ve başarım tanımlarını göster.
4. **Kullanıcı hesabı oluştur.** Kayıt ol veya `oyuncu@nexus.local` ile giriş yap. Şifre veritabanında düz metin olarak tutulmaz.
5. **Sepet ve başarısız ödeme.** Bir oyun ekle; sepetten çıkarıp tekrar ekle. Güncel toplamı onayla. Demo ekranda başarısız ödeme seç. Sipariş başarısız olmalı; oyun kütüphaneye eklenmemeli.
6. **Başarılı satın alma.** Sepetten yeni sipariş oluştur; başarılı demo ödeme yap. Sipariş, ödeme ve sahiplik kayıtlarını göster. Aynı oyun artık satın alınamaz; kütüphane bağlantısı görünür. Başarımlar henüz kilitlidir.
7. **Fiyat değişikliği kuralı.** İki ayrı tarayıcı profili kullan. Kullanıcının sepeti açıkken diğer profilde yönetici olarak fiyat değiştir. Eski sepet toplamını onaylayınca işlem durmalı. Sepeti yenileyip yeni toplamı tekrar onayla. Önceden tamamlanan siparişlerin fiyatları değişmez.
8. **Başarım entegrasyonu.** Yönetici → Başarımlar → Oyun entegrasyonu test aracı bölümünden oyuna sahip kullanıcıyı ve o oyunun başarımını seç. Olayı simüle et. Kullanıcı kütüphanesini yenileyince kazanılma tarihi görünmeli. Aynı olayı tekrar vermek ikinci kayıt oluşturmaz. Oyuna sahip olmayan kullanıcı için işlem reddedilir.
9. **Satışı kapatma ve günlük.** Yönetici oyun düzenleme ekranından satışı kapat. Oyun mağaza listesinden kalkmalı; önceki sahibinin kütüphanesinde kalmalı. İşlem günlüğünde eski/yeni satış durumu ve fiyatı göster. Sipariş durum loglarını da aç.
10. **SQL ve testler.** `routines.sql` içindeki 3 trigger ve 3 procedure'ün görevlerini anlat. `npm test`, `npm run test:e2e` ve `npm run build` sonuçlarını göster. Testler ödeme tekrarı ve başarım tekrarı dahil gerçek MySQL üzerinde çalışır.

Demo ödeme ve oyun olayı aracı ders için simülasyondur. Gerçek ödeme veya gerçek bir oyunun çalışma zamanı bağlantısı olduğu iddia edilmez. Örnek oyunlar kurmacadır; sayfadaki geliştirici/yayıncı adları da örnek veridir.
