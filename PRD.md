# Product Requirements Document (PRD) — PRD v1.0-R2
## Yargıtay İçtihat — AI Destekli Dava Hazırlık Asistanı

*PRD v1.0-R2 — Bu belge, Dosyalarım veri modelinin Müvekkil → Dosya hiyerarşisine uyarlanmasını içeren güncel ve kilitli MVP kapsam belgesidir. Değişiklik yalnızca kullanıcının açık onayıyla yapılır (bkz. `CLAUDE.md` Bölüm 16). Yeni özellik fikirleri `BACKLOG.md`'ye, sürüm planları `ROADMAP.md`'ye yazılır — bu belgeye değil.*

---

## 1. Ürün Vizyonu

Türkiye'deki her avukatın ve hukuk öğrencisinin, elindeki telefonla, bir duruşma koridorunda ya da masasında otururken, aradığı Yargıtay içtihadına **saniyeler içinde, güvenilir ve anlaşılır** şekilde ulaşabildiği; bulduğu emsali doğrudan dava dosyasına ve dilekçesine taşıyabildiği bir dünya kurmak.

## 2. Misyon

Yargıtay'ın kararlarını, modern bir mobil deneyim ve yapay zekâ destekli özetleme katmanıyla birleştirerek; yalnızca "arama" değil, **araştırmadan dilekçeye uzanan** uçtan uca bir dava hazırlık sürecini tek bir avukatın veya hukuk öğrencisinin cebinde mümkün kılmak.

## 3. Ürün Konumlandırması

Ürün artık yalnızca bir "Yargıtay karar arama uygulaması" değildir. Ürün, **AI destekli bir Dava Hazırlık Asistanı** olarak konumlandırılır.

Fark, aramadan sonra ne olduğunda yatar: kullanıcı bir karar bulur → AI özetiyle hızlıca değerlendirir → doğrudan davasına ait bir dosyaya kaydeder → o dosyada biriken kararların ortak noktalarını AI ile görür → ilgili alıntıyı tek dokunuşla dilekçesine kopyalar. Rakiplerin sunduğu "veritabanında arama", bu üründe sürecin yalnızca ilk adımıdır; asıl değer, araştırmayı **organize bir dava hazırlığına** dönüştürmesindedir.

## 4. Hedef Kullanıcılar

| Segment | Tanım | Öncelik |
|---|---|---|
| Serbest çalışan avukatlar | Tek başına veya küçük büroda çalışan, dava dosyası hazırlayan avukatlar | Birincil |
| Hukuk öğrencileri ve stajyer avukatlar | Staj, ödev, tez ve baro sınavı hazırlığı yapan kullanıcılar | Birincil |
| Kurum içi (in-house) avukatlar | Şirket bünyesinde hızlı emsal kontrolü yapan hukukçular | İkincil |
| Akademisyenler / hukuk araştırmacıları | Makale, tez, içtihat analizi yapan araştırmacılar | İkincil |

## 5. Kullanıcı Personaları

**Persona 1 — "Av. Mehmet, Serbest Çalışan Dava Avukatı" (Birincil)**
35 yaşında, İstanbul'da tek başına büro işleten iş hukuku ve tazminat davaları avukatı. Günde 3-4 duruşmaya giriyor, dosya hazırlığını duruşmalar arasında yapıyor. Telefonundan hızlıca emsal bulup doğrudan dava dosyasına ekleyecek, sonra dilekçesine alıntı olarak taşıyacak bir araç istiyor.
*"Duruşma arasında 5 dakikam var, o 5 dakikada emsal bulup dosyama kaydetmem lazım."*

**Persona 2 — "Zeynep, 4. Sınıf Hukuk Fakültesi Öğrencisi" (Birincil, fiyata duyarlı)**
22 yaşında, staj yapıyor, aynı zamanda bitirme tezi için içtihat taraması yapıyor. AI özetleri, uzun kararları hızlıca anlamasını sağlıyor.
*"Uzun kararı okuyup anlamak yerine önce özetini görüp gerekiyorsa tam metne inmek istiyorum."*

**Persona 3 — "Elif, Kurum İçi Hukuk Müşaviri" (İkincil)**
40 yaşında, orta ölçekli bir şirkette hukuk müşaviri. Zaman baskısı yüksek, güvenilirlik önceliği fiyattan daha önemli.
*"Kaynağını gösteremeyen bir özete güvenemem."*

## 6. Çözülen Problemler

1. **Zaman kaybı**: Mevcut hukuk veritabanları mobilde kullanışsız; bir emsal bulmak dakikalar/saatler alabiliyor.
2. **Bilgi yükü**: Uzun karar metinlerini baştan sona okumak pratik değil.
3. **Süreç kopukluğu**: Bulunan bir kararı davasına bağlamak, not düşmek, dilekçesine taşımak için mevcut araçlarda bütünleşik bir yol yok — kullanıcı bunu kendi başına, uygulama dışında yapmak zorunda kalıyor.
4. **Erişim eşitsizliği**: Kurumsal hukuk veritabanları büro/kurum lisansı satıyor, tek avukat veya öğrenci için erişilebilir değil.
5. **Mobilite eksikliği**: Duruşma öncesi/arası, adliye koridorunda hızlı erişim ihtiyacı karşılanmıyor.

## 7. Kullanıcı Yolculuğu

| # | Adım | Kullanıcının amacı | Uygulamanın görevi | AI'ın görevi |
|---|---|---|---|---|
| 1 | Araştırmaya başlama | Dava konusuyla ilgili emsal aramaya başlamak (yeni arama veya Arama Geçmişi'nden devam) | Ara ekranı: arama kutusu + Arama Geçmişi | Yok |
| 2 | Sonuçları daraltma | Uygun emsalleri bulmak | Filtrelenebilir sonuç listesi | "Konu özetiyle birebir ara": birebir eşleşme, yoksa semantik benzerlik |
| 3 | Karar detayını değerlendirme | Kararın davasına uygunluğunu hızlıca anlamak | Tam metin + özet + benzer kararlar | Tek karar özeti — tamamen bilgilendirici |
| 4 | "Dosyalarıma Kaydet" | Kararı form doldurmadan kaydetmek | Müvekkil seç (yoksa oluştur) → Dosya seç (yoksa oluştur) → karar otomatik eklenir; son kullanılan müvekkil ve dosya varsayılan seçili gelir, akış minimum sürtünmeyle tasarlanır | Yok |
| 5 | Alıntıyı dilekçeye taşıma | Kararın ilgili kısmını kendi dilekçesine eklemek | "Alıntı Kopyala": Esas/Karar No + tarih + alıntı metni panoya kopyalanır | Yok |
| 6 | Arama Geçmişine dönme | Aynı dava için günler sonra kaldığı yerden devam etmek | Bugün/Dün/Bu Hafta/Daha Eski gruplaması, tek dokunuşla tekrar arama, silme — cihaz içi | Yok |
| 7 | Dosyayı toparlama | Dilekçeden önce dava için topladığı tüm emsalleri bir arada görmek | Müvekkillerim → müvekkil → Dosyalar → ilgili dosyaya ait tüm kararlar/notlar | Birden fazla kararın ortak noktalarını özetleme — bilgilendirici |
| 8 | Dilekçeyi tamamlama | Araştırmasını dilekçesine yansıtıp süreci bitirmek | Kullanıcı kendi belge editöründe tamamlar; dosya "tamamlandı" işaretlenebilir | **Yok — kesin sınır** |

## 8. MVP Kapsamı

- Kayıt/giriş: email + parola, Apple Sign-In (zorunlu), Google Sign-In (opsiyonel)
- Arama: tam metin arama + temel filtreler (daire, tarih aralığı, esas/karar no, hukuk dalı, dahil/hariç anahtar kelime)
- "Konu özetiyle birebir ara": serbest metinle birebir eşleşme, bulunamazsa semantik benzerlik sıralaması
- **Arama Geçmişi**: Bugün / Dün / Bu Hafta / Daha Eski gruplaması; her kayıt arama metni + tarih + son açılma zamanı tutar; kayıt silinebilir; tek dokunuşla tekrar aranabilir; **tamamen cihaz içinde saklanır, bulut senkronizasyonu yoktur**
- Sonuç listesi + Karar Detayı: tam metin + **AI özeti (tek karar)**
- **Alıntı Kopyala**: karar metninden standart formatta alıntının panoya kopyalanması
- **Dosyalarım**: Müvekkil → Dosyalar → Kaydedilen Kararlar + Notlar hiyerarşisi; kararı kaydederken bağlamsal olarak müvekkil ve dosya oluşturma/seçme (ayrı, öncül bir "oluştur" adımı yoktur, son kullanılanlar varsayılan gelir)
- **AI: birden fazla kararın ortak noktalarını özetleme** (Dosyalarım içinde)
- Kaldığın Yerden Devam Et: son görüntülenen karar/arama
- Hesabım: profil, abonelik durumu, kullanım istatistiği
- Abonelik: RevenueCat + Apple/Google IAP (haftalık/aylık/yıllık, 3 gün deneme)
- Premium sınırlaması (bkz. Bölüm 12)
- Hesap silme, Satın Alımları Geri Yükle (mağaza zorunluluğu)
- Gerçek, barındırılan Gizlilik Politikası / Kullanım Koşulları sayfaları
- Yalnızca Türkçe, yalnızca dark tema

Bu listenin dışında kalan hiçbir özellik bu belgenin parçası değildir; bu tür fikirler `BACKLOG.md`'ye, sürüm zamanlaması `ROADMAP.md`'ye yazılır.

## 9. Yapay Zekâ Özellikleri ve Sınırları

**MVP kapsamındaki AI özellikleri:**
- **Tek karar özeti**: Karar Detayı ekranında, önceden üretilmiş, tek paragraflık bilgilendirici özet.
- **Çoklu karar özeti**: Dosyalarım'da bir dosyaya kaydedilmiş birden fazla kararın ortak noktalarını sentezleyen özet.
- **Semantik arama fallback**: "Konu özetiyle birebir ara" akışında, birebir eşleşme yoksa en yakın emsalleri bulma.

**Kesin sınır (her AI özelliğinde geçerli):**
> AI hukuki tavsiye vermez, yalnızca bilgi özetler ve düzenler.

Bu ilke şu şekillerde uygulanır:
- Hiçbir AI çıktısı sonuç tahmini, strateji önerisi veya "ne yapmalısınız" tarzı yönlendirme içermez.
- Her AI özetinin yanında "özet, kararın tam metni yerine geçmez" uyarısı sabit olarak görünür.
- Kullanıcı bir soru cümlesi yazdığında (tavsiye arar gibi), uygulama bu sınırı nazikçe hatırlatır.

## 10. Arama ve Arama Geçmişi

**Arama**: Tam metin arama; filtreler (daire, karar tarihi aralığı, esas no, karar no, hukuk dalı, dahil/hariç anahtar kelime); ilgililik/tarih sıralaması; sayfalama.

**Arama Geçmişi** (ürünün çekirdek özelliklerinden biri, "son aramalar" listesinden ibaret değildir):
- Bugün / Dün / Bu Hafta / Daha Eski olarak gruplanır.
- Her kayıt: arama metni, tarih, son açılma zamanı.
- Kayıt tek tek silinebilir.
- Kayda tek dokunuşla tekrar arama yapılabilir.
- Tamamen cihaz içinde saklanır; bulut senkronizasyonu MVP kapsamında değildir.

## 11. Dosyalarım

Eski adıyla "Kayıtlılarım" — ürün genelinde artık yalnızca **"Dosyalarım"** adı kullanılır (alt navigasyon). Bu isim altında gerçek avukat çalışma düzenini yansıtan bir hiyerarşi bulunur:

```
Müvekkil
→ Dosyalar (bir veya daha fazla)
    → Kaydedilen Kararlar
    → Notlar
```

**Ekran isimleri**: Alt navigasyon — "Dosyalarım"; birinci seviye ekran başlığı — "Müvekkillerim" (müvekkil listesi); müvekkil içindeki ikinci seviye — "Dosyalar".

**Müvekkil**:
- Gerçek kişi veya tüzel kişi olabilir.
- Bir müvekkilin birden fazla dosyası olabilir.

**Dosya**:
- Esas numarası henüz yoksa dosya adı konu veya taşınmaz bilgisi olabilir (ör. "Fikirtepe Daire 322 Tahliye").
- Esas numarası alındığında dosya adı buna göre güncellenebilir (ör. "2026/3266").
- Aynı karar birden fazla dosyaya kaydedilebilir.

**Dosya oluşturma bağlamsaldır**: kullanıcı önceden form doldurup müvekkil veya dosya açmaz. "Dosyalarıma Kaydet" akışında sırasıyla müvekkil (yoksa oluştur) ve dosya (yoksa oluştur) seçilir; karar seçilen dosyaya otomatik eklenir. Son kullanılan müvekkil ve dosya varsayılan seçili gelir — akış minimum sürtünmeyle tasarlanır.

**Dosya içeriği** (MVP kapsamı bununla sınırlıdır):
- Kaydedilen Kararlar
- Notlar (her kayıtlı karara kısa not eklenebilir)

Belgeler, PDF yükleme, OCR ve kalıcı Alıntılar bu sürümün kapsamı dışındadır (bkz. `BACKLOG.md` v1.1). Bir dosyada birden fazla karar varsa AI ortak nokta özeti sunulur (bkz. Bölüm 9).

## 12. Premium Özellikler

| Özellik | Ücretsiz (Deneme sonrası) | Premium |
|---|---|---|
| Arama | Sınırlı | Sınırsız |
| Gelişmiş filtreleme | Kilitli | Açık |
| "Konu özetiyle birebir arama" | Kilitli | Açık |
| Müvekkil sayısı | En fazla 3 | Sınırsız |
| Dosya sayısı (müvekkil başına) | Sınırsız | Sınırsız |
| Alıntı Kopyala | Kilitli | Açık |
| AI kullanımı | Kullanım limiti | Sınırsız |
| Öncelikli destek | Yok | Var |

## 13. Bildirimler

Yalnızca işlemsel bildirimler: abonelik yenileme hatırlatması, deneme süresi bitiş uyarısı, ödeme başarısız bildirimi. Expo Push Notifications üzerinden.

## 14. Abonelik Sistemi

- Planlar: Haftalık (₺500/hafta), Aylık (₺1.000/ay), Yıllık (₺10.000/yıl) — Yıllık varsayılan/önerilen.
- Deneme: 3 gün ücretsiz, süre sonunda otomatik olarak yıllık plana geçer.
- Satın alma ve yenileme tamamen Apple/Google IAP üzerinden; iptal her zaman ilgili mağazanın abonelik yönetim ekranına yönlendirilerek yapılır — uygulama içi sahte iptal akışı yoktur.
- Altyapı: RevenueCat, tek "pro" entitlement modeliyle abonelik durumunu yönetir.

## 15. Başarı Kriterleri (KPI)

| Kategori | Metrik | Hedef (v1.0, ilk 6 ay) |
|---|---|---|
| Aktivasyon | Kayıt sonrası ilk 24 saatte en az 1 arama yapan kullanıcı oranı | ≥ %60 |
| Dönüşüm | Deneme → ücretli abonelik dönüşüm oranı | ≥ %8-12 |
| Elde tutma | 30 günlük abone kalma oranı | ≥ %70 |
| Etkileşim | Aktif abone başına haftalık ortalama arama sayısı | ≥ 5 |
| Memnuniyet | App Store / Play Store puanı | ≥ 4.5 |
| AI kalitesi | Kullanıcıların özeti "faydalı" işaretleme oranı | ≥ %75 |

## 16. App Store Yayın Hedefleri

- iOS ve Android'de eş zamanlı lansman.
- Kategori: Business / Reference.
- Anahtar kelimeler: "Yargıtay", "içtihat", "emsal karar", "avukat uygulaması".
- Yalnızca Türkçe mağaza sayfası.
- Yayın öncesi zorunlu: Gizlilik Politikası, Kullanım Koşulları, Data Safety/Privacy Nutrition Label formları eksiksiz.

## 17. Riskler

| Risk | Etki | Azaltım |
|---|---|---|
| Veri kaynağı/lisans riski | Yüksek | Veri kaynağının hukuki statüsü netleştirilmeli |
| AI halüsinasyon / mesleki sorumluluk riski | Kritik | Net "tavsiye değildir" uyarısı, kaynağa kolay erişim |
| Rekabet: Yargıtay'ın resmi sistemi ücretsiz | Kritik | Farklılaşma hız + mobil UX + AI + dosya iş akışında |
| Yetkisiz hukuki danışmanlık (UPL) algısı | Orta-Yüksek | Ürün net şekilde "araştırma aracı" olarak konumlandırılır |
| Tek kişilik ekip / bus factor | Orta | Kritik erişimler için süreklilik planı |

## 18. Rakiplerden Farkımız

| Boyut | Kurumsal çözümler (Lexpera, Kazancı, LegalBank) | Yargıtay resmi sistemi | Bu ürün |
|---|---|---|---|
| Platform | Web/masaüstü odaklı | Web, sade | Mobil-native |
| Fiyat | Kurumsal lisans | Ücretsiz | Bireysel, esnek |
| İçerik sunumu | Ham metin | Ham metin | AI özetli |
| Süreç bütünlüğü | Yok | Yok | Arama → Dosya → Alıntı → Dilekçe uçtan uca |

## 19. Kullanıcıya Sunulan Değer

- **Zaman tasarrufu**: Emsal arama süresi dakikalar/saatlerden saniyelere iner.
- **Süreç bütünlüğü**: Arama, AI değerlendirmesi, dosyalama ve dilekçeye aktarım tek uygulamada.
- **Güven**: AI özeti + tam metne kolay erişim, hukuki tavsiye vermeyen net sınır.
- **Mobilite**: Duruşma arası, adliye koridoru, ofis dışı her yerde erişim.
- **Erişilebilir fiyatlandırma**: Kurumsal lisans bariyeri olmadan bireysel avukat/öğrenci bütçesine uygun planlar.

## 20. Marka Kimliği

- Ürün adı değişmez: **Yargıtay İçtihat**.
- Konumlandırma ifadesi: **AI Destekli Dava Hazırlık Asistanı**.
- Ton: güvenilir, sade, "deneyimli bir meslektaş" hissi — otoriter değil, yardımcı.
- Slogan: "Emsal kararlar, saniyeler içinde."
- Ses tonu ilkesi: Sonuç garantisi çağrıştıran ifadeler ("davanızı kazandırır" vb.) hiçbir metinde kullanılmaz.

---

*Bu revizyon Dosyalarım veri modelinin gerçek avukat çalışma düzenine uyarlanması amacıyla yapılmıştır.*
