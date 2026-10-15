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

Bu depo şu anda proje kapsamını ve planlanan iş akışlarını tanımlar. Uygulama geliştirmesine henüz başlanmamıştır.
