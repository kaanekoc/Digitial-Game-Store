# Veritabanı tasarımı ve SQL akışı

## Tablolar

| Tablo             | Sorumluluk                                                        |
| ----------------- | ----------------------------------------------------------------- |
| users             | Hesap, şifre hash'i ve user/admin rolü                            |
| games             | Oyun bilgisi, güncel fiyat ve satış durumu                        |
| genres            | Tekil tür adları                                                  |
| game_genres       | Oyun–tür çoktan çoğa ilişkisi                                     |
| game_images       | Kapak ve sıralı ekran görüntüleri                                 |
| cart_items        | Kullanıcının sepetindeki tekil oyunlar                            |
| orders            | Sipariş sahibi, tekrar koruma anahtarı ve durum                   |
| order_items       | Siparişteki oyunlar ve o andaki fiyatlar                          |
| payments          | Ödeme sonucu, yöntem, tutar ve sağlayıcı referansı                |
| user_games        | Kalıcı oyun sahipliği, edinilme tarihi ve kaynak sipariş          |
| achievements      | Oyuna ait başarım tanımı ve tamamlanma olay kodu                  |
| user_achievements | Kullanıcının kazandığı başarımlar ve zamanları                    |
| activity_logs     | Oyun değişiklikleri ve sipariş durumlarının önceki/yeni değerleri |

`game_genres`, `cart_items`, `order_items`, `user_games` ve `user_achievements` bileşik primary key kullanır. Bir oyundan tek kopya satın alındığı için miktar alanı bulunmaz. Ayrı cart tablosu yerine kullanıcıyla ilişkili sepet kalemleri vardır. Boş sepet, kalem bulunmamasıyla temsil edilir.

`user_games(order_id,user_id)` ilgili sipariş sahibine; `user_games(order_id,game_id)` ilgili sipariş kalemine bağlanır. Böylece başka kullanıcının siparişi veya siparişte bulunmayan oyun kaynak gösterilemez. `user_achievements` hem oyun sahipliğine hem o oyunun başarım tanımına bileşik foreign key ile bağlanır.

## Stored procedure parametreleri

### sp_checkout(p_user, p_key, p_expected)

- `p_user`: oturumdan alınan kullanıcı kimliği.
- `p_key`: sunucunun sepet sayfası için ürettiği UUID; aynı formun tekrarı aynı siparişi döndürür.
- `p_expected`: kullanıcının onayladığı TRY toplamı.

Transaction başlatır ve kullanıcı satırını kilitler. Anahtar daha önce kullanılmışsa sahibi doğrulanıp mevcut `order_id` döndürülür. Yeni siparişte sepetin boş olmadığı, oyunların satışta olduğu, kullanıcının bu oyunlara sahip olmadığı ve fiyat toplamının eşleştiği kontrol edilir. Fiyatlar `order_items` içine kopyalanır. Ödeme henüz yapılmadığı için kütüphaneye kayıt eklenmez.

### sp_complete_payment(p_user, p_order, p_reference, p_method, p_success)

- `p_user`: oturumdan alınan kullanıcı.
- `p_order`: yalnızca bu kullanıcıya ait sipariş.
- `p_reference`: demo sağlayıcının siparişe bağlı tekil referansı.
- `p_method`: `demo_card` veya `demo_wallet`.
- `p_success`: başarılı/başarısız ödeme sonucu.

Kullanıcı ve sipariş kilitlenir. Aynı sonuç tekrar gelmişse mevcut durum döndürülür. Başarılı sonuçta güncel fiyatlar, satış durumu ve sahiplik yeniden kontrol edilir. Ödeme kaydı, sipariş durumu, oyun sahipliği ve sepet temizliği **aynı transaction** içindedir. Herhangi bir hata hepsini geri alır. Başarısız sonuçta ödeme ve sipariş başarısız kaydedilir; sahiplik verilmez, sepet korunur. Yeniden denemek yeni bir sipariş oluşturur.

### sp_unlock_achievement(p_user, p_achievement)

Başarımın ait olduğu oyun bulunur; kullanıcı bu oyuna sahip değilse işlem reddedilir. `ON DUPLICATE KEY UPDATE` sayesinde tekrar gelen olay ikinci kayıt üretmez ve ilk kazanılma zamanını değiştirmez. Tamamlanma olayı ve oyun sunucusu anahtarı, procedure çağrılmadan önce API katmanında doğrulanır.

## Trigger'lar

- `trg_cart_validate`: `BEFORE INSERT ON cart_items`. Satış ve sahiplik kuralları doğrudan SQL ile yapılan eklemelerde de uygulanır.
- `trg_game_audit`: `AFTER UPDATE ON games`. Oyun adı, açıklama, geliştirici/yayıncı, tarih, fiyat ve satış durumu JSON olarak loglanır.
- `trg_order_audit`: `AFTER UPDATE ON orders`. Yalnızca durum değişmişse log ekler.

Uygulama `withActor` ile aynı bağlantıda `@actor_user_id` ayarlar; trigger işlemi yapan kullanıcıyı loga ekler. Bağlantı havuza dönmeden önce bu değişken temizlenir. Doğrudan SQL işlemlerinde aktör verilmezse `NULL` yani sistem olarak görünür. Görsel ve tür ilişkileri uygulama transaction'ı içinde ayrıca loglanır.

## SQL'i incelemek için

```sql
USE digital_game_store;
SHOW TABLES;
SHOW TRIGGERS;
SHOW PROCEDURE STATUS WHERE Db = DATABASE();

SELECT o.id, u.email, o.status, SUM(oi.unit_price) AS total
FROM orders o
JOIN users u ON u.id = o.user_id
JOIN order_items oi ON oi.order_id = o.id
GROUP BY o.id, u.email, o.status;

SELECT u.email, g.name, ug.acquired_at, ug.order_id
FROM user_games ug
JOIN users u ON u.id = ug.user_id
JOIN games g ON g.id = ug.game_id;

SELECT action, actor_user_id, game_id, order_id, old_values, new_values
FROM activity_logs
ORDER BY id DESC;
```

`schema.sql` yalnızca tabloları içerir. `routines.sql` tablo kurulumu sonrasında çalışır; mevcut trigger/procedure tanımlarını yeniden oluşturabilir ve tablo verilerini silmez. `scripts/setup-db.ts` bu sırayı ve SQL dosyalarının `DELIMITER` ayracını yönetir.
