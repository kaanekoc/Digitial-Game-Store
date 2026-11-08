# Dijital Oyun Mağazası ve Envanter Platformu

Next.js ve MySQL tabanlı, Steam / Epic Games benzeri dijital oyun mağazası ve envanter platformu. Oyun listeleme, türler, kullanıcı kütüphanesi, sepet, satın alma ve başarım (achievement) takibi aynı akış içinde yönetilir.

## Oyun Mağazası İş Akışı

### Oyunlar ve türler hazırlanır

Yönetici, oyunları sisteme eklerken her oyunun adını, açıklamasını, geliştiricisini, yayıncısını, çıkış tarihini, satış fiyatını ve görsellerini girer. Örneğin **Aksiyon**, **Macera** ve **Strateji** türlerini tanımlar; bir oyunu birden fazla türle ilişkilendirebilir. Satışı durdurulan oyunlar satın alınamaz; daha önce satın alan kullanıcıların kütüphanesinde kalır.

Kullanıcı mağazada oyunları listeler, adına göre arar ve türlerine göre filtreler. Bir oyunun detay sayfasında açıklamasını, görsellerini, fiyatını ve kazanılabilecek başarımlarını inceler.

### Kullanıcı hesabı oluşturulur

Kullanıcı, adını, e-posta adresini ve şifresini girerek hesap oluşturur. Hesabına giriş yaptıktan sonra sepetini, satın aldığı oyunları ve başarım ilerlemesini görüntüler. Her kullanıcının kütüphanesi ve satın alma geçmişi kendi hesabına bağlı tutulur.

### Oyunlar sepete eklenir

Örneğin kullanıcı bir aksiyon oyunu ile bir strateji oyunu satın almak ister. Oyunların detay sayfalarından **Sepete Ekle** seçeneğini kullanır. Sepette her oyunun adı, güncel fiyatı ve ödenecek toplam görünür.

Aynı oyun sepete birden fazla kez eklenmez. Kullanıcının kütüphanesinde bulunan bir oyun için yeniden satın alma işlemi yapılmaz. Kullanıcı satın almadan önce sepetindeki oyunları kontrol eder ve istemediği oyunları çıkarır. Sepet toplamı her değişiklikte yeniden hesaplanır.

### Satın alma ve ödeme tamamlanır

Kullanıcı sepetini onayladığında sistem oyunların satış durumunu, güncel fiyatlarını ve kullanıcının mevcut sahipliğini yeniden kontrol eder. Fiyat değişmişse kullanıcıya güncel toplam gösterilir ve yeniden onay alınır. Sipariş oluşturulurken oyunların o andaki fiyatları sipariş kalemlerine kaydedilir; sonraki fiyat değişiklikleri geçmiş siparişleri etkilemez.

Kullanıcı ödeme yöntemini seçerek işlemi başlatır. Ödeme sonucu siparişle ilişkilendirilir. Başarılı ödeme sonrasında sipariş tamamlanır ve satın alınan oyunlar kullanıcının kütüphanesine eklenir. Ödeme başarısız olursa sipariş tamamlanmaz ve oyun sahipliği verilmez. Aynı ödeme sonucunun tekrar işlenmesi, ikinci bir sipariş veya mükerrer oyun sahipliği oluşturmaz.

### Kullanıcı kütüphanesi ve envanteri güncellenir

Kullanıcı **Kütüphanem** ekranında sahip olduğu oyunları listeler. Örnekte satın aldığı aksiyon ve strateji oyunları, satın alma tarihleriyle birlikte burada görünür. Kullanıcı oyun adına göre arama yapabilir ve kütüphanesini türlere göre filtreleyebilir.

Envanter, kullanıcının sahip olduğu dijital oyunları temsil eder. Her kullanıcı ve oyun çifti için tek bir sahiplik kaydı tutulur. Sahiplik kaydı ilgili satın alma işlemiyle ilişkilendirilir; böylece bir oyunun ne zaman ve hangi siparişle edinildiği incelenebilir.

### Başarımlar takip edilir

Yönetici her oyun için başarım adını, açıklamasını ve tamamlanma koşulunu tanımlar. Örneğin bir aksiyon oyununa **İlk Görev** ve **Tüm Bölümler Tamamlandı** başarımlarını ekler.

Kullanıcı, sahip olduğu oyunun başarım ekranında kazanılan ve henüz kazanılmayan başarımları görür. Oyun entegrasyonundan gelen doğrulanmış ilerleme bilgisi işlendiğinde ilgili başarım kazanılmış olarak kaydedilir ve kazanılma zamanı tutulur. Aynı başarım aynı kullanıcıya yalnızca bir kez verilir. Başarım takibi için oyundan veri sağlayan bir entegrasyon gerekir; yalnızca satın alma işlemi başarım kazandırmaz.

### Siparişler ve işlem geçmişi incelenir

Kullanıcı geçmiş siparişlerinde satın aldığı oyunları, ödenen tutarı, ödeme durumunu ve işlem tarihini görüntüler. Yönetici gerektiğinde bir siparişi, ödeme kaydını, oyun sahipliğini veya başarım kaydını inceleyebilir.

Oyun bilgilerindeki değişiklikler, satış durumunun güncellenmesi ve sipariş durum geçişleri işlem geçmişinde tutulur. Böylece mağazadaki işlemler geriye dönük takip edilebilir.

## Kullanıcıların Görevleri

- **Ziyaretçi:** Oyunları listeler, arama ve tür filtrelerini kullanır, oyun detaylarını inceler ve hesap oluşturur.
- **Kullanıcı:** Sepetini yönetir, oyun satın alır, kütüphanesini, sipariş geçmişini ve başarım ilerlemesini görüntüler.
- **Yönetici:** Oyunları, türleri, fiyatları, satış durumlarını ve başarım tanımlarını yönetir; kullanıcı yetkilerini ve işlem geçmişini inceler.

## Teknik Altyapı

- **Frontend:** Next.js ve React
- **Backend:** Next.js sunucu tarafı işlevleri ve API uçları
- **Veritabanı:** MySQL
- **Dil:** TypeScript
- **Bağımlılık yönetimi:** npm

## Proje Durumu

Proje, README'deki iş akışlarıyla çalışan bir ders uygulaması olarak tamamlandı. Geliştirme sekiz aşamaya bölündü; her aşama ayrı commit ile kaydedilip GitHub'a gönderildi. Ayrıntılar [geliştirme günlüğünde](docs/GELISTIRME.md), ders sunumu sırası [sunum rehberinde](docs/SUNUM.md) bulunur.

## Kurulum ve Çalıştırma

Node.js 22+, npm ve MySQL 8.0.16+ gerekir (MySQL 8.4 önerilir). MySQL sunucusunu başlatın; uygulama verileri gerçekten MySQL'de tutulur.

```powershell
npm install
Copy-Item .env.example .env
```

`.env` içindeki `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD` ve `DB_NAME` değerlerini kendi MySQL kurulumunuza göre ayarlayın. Wamp kullanıyorsanız MySQL portunu Wamp ayarından kontrol edin. Veritabanı adı yalnızca harf, rakam ve alt çizgi içermelidir.

`SESSION_SECRET` ve `GAME_INTEGRATION_SECRET` için **birbirinden farklı**, en az 32 karakterlik rastgele değerler yazın. Her biri için şu komutla değer üretebilirsiniz:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Ardından boş bir veritabanını kurup örnek verileri ekleyin:

```powershell
npm run db:setup
npm run db:seed
npm run dev
```

Tarayıcıdan [localhost:3000](http://localhost:3000) adresini açın. PowerShell, `npm.ps1` çalıştırmayı engellerse komutları `npm.cmd` ile çalıştırabilirsiniz.

`db:setup`, 13 tabloyu, 3 trigger'ı ve 3 stored procedure'ü oluşturur. Hedef veritabanında tablo varsa durur; mevcut verileri silmez. Daha önce yalnızca `schema.sql` kurulmuşsa `npm run db:routines` ile eksik SQL rutinlerini ekleyebilirsiniz. Bu komut mevcut rutinleri güncellemek için de kullanılabilir. `db:seed` yalnızca boş oyun kataloğuna örnek veri ekler ve mevcut kayıtları değiştirmez.

Üretim derlemesini yerelde çalıştırmak için:

```powershell
npm run build
npm start
```

## Demo Hesapları ve Kapsam

Örnek veriler 6 kurmaca oyun, 5 tür, 12 başarım ve 2 hesap içerir. Kapaklar projeye ait yerel SVG dosyalarıdır. Şifreler `.env` içindeki seed ayarlarından alınır; aşağıdakiler `.env.example` varsayılanlarıdır:

| Rol       | E-posta              | Örnek şifre  |
| --------- | -------------------- | ------------ |
| Yönetici  | `admin@nexus.local`  | `Admin123!`  |
| Kullanıcı | `oyuncu@nexus.local` | `Oyuncu123!` |

`DEMO_MODE=true` olduğunda ödeme ekranında başarılı veya başarısız sonuç seçilebilir. **Gerçek para çekilmez ve kart bilgisi alınmaz.** Yönetici panelindeki oyun olayı test aracı da bu ayarla açılır. `false` yapıldığında bu iki demo işlemi sunucuda da kapatılır. Gerçek ödeme sağlayıcısı ve gerçek oyun sunucusu entegrasyonu bu ders tesliminin kapsamı dışındadır.

## Sayfalar

| Adres                             | İşlev                                                                    |
| --------------------------------- | ------------------------------------------------------------------------ |
| `/`                               | Oyun mağazası, isim araması ve tür filtresi                              |
| `/oyunlar/[id]`                   | Açıklama, görseller, fiyat ve başarım tanımları                          |
| `/kayit`, `/giris`                | Hesap oluşturma ve giriş                                                 |
| `/sepet`                          | Sepeti yönetme ve güncel toplamı onaylama                                |
| `/odeme/[id]`                     | Siparişin demo ödemesi                                                   |
| `/kutuphane`, `/kutuphane/[id]`   | Sahip olunan oyunlar, edinilme tarihi ve başarımlar                      |
| `/siparisler`, `/siparisler/[id]` | Kullanıcının sipariş ve ödeme geçmişi                                    |
| `/yonetim`                        | Oyun, tür, başarım, kullanıcı yetkisi, sipariş ve işlem günlüğü yönetimi |
| `/api/integration/achievements`   | Anahtarla doğrulanan oyun sunucusu başarım API'si                        |

## Veritabanı ve SQL

- [schema.sql](database/schema.sql): tablolar, foreign key'ler, unique ve check kuralları.
- [schema.dbml](database/schema.dbml): dbdiagram.io editörüne doğrudan yapıştırılacak tablo diyagramı. Trigger/procedure tanımları diyagramdan ayrı tutulur.
- [routines.sql](database/routines.sql): kullanılan 3 trigger ve 3 stored procedure.
- [SQL açıklamaları](docs/VERITABANI.md): parametreler, transaction mantığı ve dosyaların görevleri.

Sepet toplamı güncel oyun fiyatlarından, geçmiş sipariş toplamı ise `order_items.unit_price` değerlerinden hesaplanır. Para birimi TRY'dir. Kütüphane ve envanter aynı `user_games` kayıtlarını kullanır. Oyunlar silinmek yerine satışa kapatılır; önceki sahiplik korunur.

| Tür       | Ad                      | Görev                                                                          |
| --------- | ----------------------- | ------------------------------------------------------------------------------ |
| Trigger   | `trg_cart_validate`     | Satışta olmayan veya sahip olunan oyunun sepete eklenmesini engeller.          |
| Trigger   | `trg_game_audit`        | Oyun bilgilerinin önceki/yeni değerlerini günlüğe yazar.                       |
| Trigger   | `trg_order_audit`       | Sipariş durum geçişini günlüğe yazar.                                          |
| Procedure | `sp_checkout`           | Sepeti doğrular, onaylanan toplamı karşılaştırır, fiyatları siparişe kopyalar. |
| Procedure | `sp_complete_payment`   | Ödemeyi, sipariş durumunu ve sahipliği tek transaction içinde sonuçlandırır.   |
| Procedure | `sp_unlock_achievement` | Sahiplik kontrolü yapar ve başarımı yalnızca bir kez kaydeder.                 |

## Başarım Entegrasyonu

Oyun sunucusu `POST /api/integration/achievements` adresine `Authorization: Bearer <GAME_INTEGRATION_SECRET>` başlığı ve JSON gövdesi gönderir:

```json
{
  "userId": 2,
  "achievementId": 1,
  "event": "first_mission_completed"
}
```

Kimlikler kendi veritabanınızdaki kayıtlara karşılık gelmelidir. Sunucu anahtarı doğrulanır, `event` ilgili başarımın `completion_condition` değeriyle karşılaştırılır ve kullanıcının oyuna sahip olduğu kontrol edilir. Aynı olayın tekrar gönderilmesi ikinci bir başarım oluşturmaz. Bu anahtar tarayıcıya gönderilmez. Ders sırasında gerçek oyun sunucusu yerine yönetici panelindeki **Oyun entegrasyonu test aracı** kullanılabilir.

## Testler

```powershell
npm run typecheck
npm test
npx playwright install chromium
npm run test:e2e
npm run build
```

Testler için veritabanı kurulmuş, seed çalıştırılmış ve `DEMO_MODE=true` olmalıdır. Entegrasyon testleri geçici kullanıcı/oyun kayıtları oluşturur ve kendi kayıtlarını temizler; yine de testlerde ayrı bir `DB_NAME` kullanılması uygundur. `npm test`, gerçek MySQL üstünde 3 trigger ve 3 procedure'ü; ayrıca oturum imzasını ve şifre sınırlarını sınar. Tarayıcı testleri kayıt, yetki, arama, sepet, fiyat değişikliği, başarısız/başarılı ödeme, sahiplik, başarım API'si, yönetim ve mobil görünümü kapsar.

Bilgisayarda Chrome zaten yüklüyse tarayıcı indirmeden PowerShell'de çalıştırılabilir:

```powershell
$env:PLAYWRIGHT_CHANNEL="chrome"
npm run test:e2e
```

GitHub Actions, MySQL 8.4 üzerinde aynı kontrolleri otomatik çalıştıracak şekilde yapılandırılmıştır. Yerel doğrulama MySQL 9.1 ve Chrome ile yapılmıştır.

## Uygulama Notları

- Şifreler bcrypt ile hash'lenir; oturumlar 7 gün geçerli imzalı HttpOnly çerezlerdir. Rol, her istekte veritabanından okunur.
- Her mutasyon sunucuda kimlik/yetki ve girdi kontrolünden geçer; SQL sorguları parametrelidir. Server Actions, Next.js'in Origin kontrolünü kullanır.
- Hatalı girişler aynı e-posta için 15 dakikada 5 denemeyle sınırlandırılır. Bu sayaç tek sunuculu ders uygulamasının belleğindedir; sunucu yeniden başlatılınca sıfırlanır.
- `checkout_key` aynı satın alma isteğinin ikinci sipariş oluşturmasını, ödeme referansı aynı ödeme kaydının tekrar eklenmesini, bileşik anahtarlar mükerrer sahiplik ve başarımı engeller.
- Sipariş ve ödeme işlemleri kullanıcı satırını kilitleyerek aynı kullanıcının eşzamanlı işlemlerini sıraya alır. Güncel fiyat ve satış durumu ödeme sırasında tekrar kontrol edilir.
- Yönetimde sipariş ve günlük listeleri son 100 kaydı gösterir; mağaza/kütüphane araması en fazla 100 sonuç getirir. Bunlar ders ölçeği için belirlenmiş sınırlardır.
- `.env` ve veritabanı verileri Git'e eklenmez. Uygulamanın genel kullanıma açılması ve gerçek ödeme alması bu teslimde yapılmamıştır.
