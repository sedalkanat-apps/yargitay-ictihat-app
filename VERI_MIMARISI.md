# VERI_MIMARISI.md — Gerçek Veri Kaynağı Mimarisi (Yargıtay + Mevzuat)

Bu belge, Yargıtay kararları ve mevzuat.gov.tr verisinin uygulamaya nasıl aktarılacağına dair
mimari kararları tutar. Sprint 5A'nın (teknik araştırma) ve bu turun (mimari/politika netleştirme)
çıktısıdır. **Henüz hiçbir gerçek bağlantı kurulmadı, Supabase tablosu/migration veya Edge Function
oluşturulmadı, mobil dosyalara dokunulmadı.** Bu belge yalnızca "ne inşa edileceğinin" kararını
tutar; inşa Sprint 5B'de, aşağıdaki Go/No-Go kapısı geçildikten sonra başlar.

Bu belge `PRD.md` kapsamını değiştirmez, yeni bir kullanıcı özelliği tanımlamaz — yalnızca mevcut
`PRD.md`/`ROADMAP.md` kapsamındaki "gerçek karar/mevzuat verisi" ihtiyacının **backend mimarisini**
tanımlar. Belge yönetişimi kuralları için bkz. `CLAUDE.md` §16 (bu belge oraya eklenmiştir).

---

## 1. Net Mimari Karar (Sprint 5A'dan güncellendi)

Mobil uygulama **hiçbir zaman** Yargıtay veya mevzuat.gov.tr'ye doğrudan bağlanmaz. Tüm erişim bir
Supabase Edge Function arkasındadır. Edge Function önce kendi Supabase tablolarına (kalıcı veri,
"cache" değil — bkz. §1.1 isimlendirme notu) bakar; kayıt yoksa veya yeniden doğrulama süresi
dolmuşsa kaynağa gider, normalize eder, kalıcı olarak yazar ve mobile döner
("erişildiğinde çek, kalıcılaştır" deseni). Tam korpusun önceden toplu senkronizasyonu MVP'de
yapılmaz.

Bu karar Sprint 5A'da verildi ve bu turda **değişmedi** — bu tur yalnızca aşağıdaki dört konuda
(Go/No-Go kapısı, cache/yeniden doğrulama politikası, kimlik stratejisi, AI veri ayrımı) bu kararı
uygulanabilir hale getiren ayrıntıları ekler.

### 1.1 İsimlendirme düzeltmesi
Sprint 5A'da önerilen `kararlar_cache` / `mevzuat_cache` tablo adları **`kararlar`** ve **`mevzuat`**
olarak güncellenmiştir. Gerekçe: bu tablolar yalnızca geçici bir önbellek değil, uygulamanın kendi
kalıcı kimliğini (`id`, doğal anahtar, ilişkiler) taşıyan birincil kayıtlardır — "cache" adı bunu
yanlış yansıtıyordu. Cache/TTL davranışı artık bu tabloların bir *alanı* (`lastVerifiedAt`, `status`)
olarak modelleniyor, tablonun kendisi "silinebilir/yeniden üretilebilir" bir önbellek değil.

---

## 2. Go/No-Go Kapısı — Canlı Veri Entegrasyonuna Geçiş Koşulu

Sprint 5B'de POC dışında hiçbir **production, toplu veya ticari** canlı veri çekimi, aşağıdaki kapı
geçilmeden başlatılamaz. Bu madde bir araştırma görevi değildir — Sprint 5B backlog'una tekrar
"araştır" olarak açılmaz; bir **dış bağımlılık / blokaj koşulu** olarak yazılır (bkz. §6 ve §7).

| # | Koşul | Durum |
|---|---|---|
| G1 | Yargıtay Başkanlığı veya Adalet Bakanlığı nezdinde resmî bir API/veri paylaşımı imkânının bulunup bulunmadığı **manuel olarak** (kurumla yazışma/başvuru yoluyla) teyit edilmiş olmalı. | **Kapalı değil — açık dış bağımlılık.** |
| G2 | Otomatik erişim, yeniden kullanım, ticari kullanım, kaynak gösterme ve saklama konularında **bir insanın** (avukat/hukuk danışmanı) yazılı değerlendirmesi alınmış ve bu belgeye eklenmiş olmalı. | **Kapalı değil — açık dış bağımlılık.** |
| G3 | G1 ve G2 sonucunda açık ve yeterli bir izin/uygunluk sonucu oluşmadan production ortamında toplu veya ticari canlı veri çekimi **başlatılamaz.** | Kural olarak yürürlükte. |
| G4 | Sprint 5B'de planlanan POC, G1/G2/G3'ün yerine geçmez. POC yalnızca düşük hacimli, kontrollü, teknik doğrulamadır (CAPTCHA/şema/gecikme davranışını ölçmek içindir) — **production izni anlamına gelmez.** | Kural olarak yürürlükte. |

### Uzun vadeli alternatif (B Planı)
Kapı kapanmazsa veya G1/G2 sonucu olumsuz/riskli çıkarsa: **lisanslı bir hukuk veri sağlayıcısıyla
(ör. Lexpera, HukukTürk, Fullegal gibi bu alanda zaten faaliyet gösteren firmalar) ticari veri
lisansı/entegrasyonu** değerlendirilir. Bu, mimariyi değiştirmez — `KararRepository`/
`MevzuatRepository` sözleşmesi aynı kalır, yalnızca Edge Function'ın arkasındaki somut kaynak
değişir (bkz. Sprint 4B'de kurulan repository-sözleşme deseni: "Repository değiştirilince ekranların
hiçbirinde kod değişikliği gerekmez" ilkesi burada da geçerlidir).

---

## 3. Cache ve Yeniden Doğrulama Politikası

### 3.1 Yargıtay kararları (`kararlar` tablosu)

- İlk erişimde kaynaktan çekilir, Supabase'de **kalıcı olarak** saklanır (silinmez, yalnızca durumu
  değişir — bkz. aşağı).
- `lastVerifiedAt`: tam metin + metadata'nın kaynakla en son ne zaman karşılaştırıldığını tutar.
- **Varsayılan yeniden doğrulama süresi: 30 gün.** Gerekçe: kesinleşmiş yargı kararları nadiren
  değişir; ancak Sprint 5A'da Yargıtay'ın KVKK gereği anonimleştirme/kaldırma yapabildiği tespit
  edildi (bkz. Sprint 5A Bölüm 2) — 30 gün, kaynağa gereksiz yük bindirmeden bu tür değişiklikleri
  makul sürede yakalayacak bir denge noktasıdır.
- **Durum (`status`) enum'u:**
  - `active` — kaynakla son doğrulamada tutarlı.
  - `removedFromSource` — kaynakta artık bulunamıyor (silinmiş/erişim kaldırılmış).
  - `updated` — kaynaktaki içerik son doğrulamada değişmiş olarak tespit edildi.
  - `unverifiable` — kaynağa erişilemedi veya beklenmedik bir yanıt alındı; önceki `status` korunur,
    yalnızca bir sonraki denemeye kadar "doğrulanamadı" olarak işaretlenir.
- **Kaynak erişilemezse**: son bilinen sürüm kullanıcıya gösterilmeye devam eder, ancak UI'da
  `lastVerifiedAt` tarihi ve durum açıkça belirtilir (ör. "Son doğrulama: 12 Haziran 2026 — kaynak şu
  an erişilemiyor"). İçerik hiçbir zaman sessizce/belirsiz biçimde gösterilmez.
- Kaydı **hiçbir zaman silinmez** (kullanıcının "Dosyalarıma Kaydet" ile ilişkilendirdiği kararlar
  kalıcı kalmalı) — `removedFromSource` yalnızca bir durum bayrağıdır, satırı silmez.

### 3.2 Mevzuat (`mevzuat` tablosu)

- `lastVerifiedAt`, `effectiveFrom`, mümkünse `effectiveTo` (veya yürürlük durumu) alanları taşınır.
- **Varsayılan yeniden doğrulama süresi: 7 gün** — kararlardan daha sık. Gerekçe: mevzuat
  değişiklikleri (Resmî Gazete) günlük yayımlanır ve bir maddenin yürürlükten kalkması hukuki olarak
  kararlardan daha kritik/sık bir olaydır.
- **Değişiklik tespit edildiğinde üzerine yazılmaz.** MVP'de tam sürüm geçmişi (her değişikliğin
  ayrıntılı diff'i) **yapılmayacak** — bu açıkça sınırlanıyor. Ancak veri modeli şu şekilde
  hazırlanır ki bu sınır sonradan kırılmadan genişletilebilsin:
  - `mevzuat` tablosu her zaman **güncel/yürürlükteki** içeriği tutar.
  - `mevzuat_surumleri` adında ayrı bir tablo **şema düzeyinde tasarlanır** (Sprint 5B'de
    oluşturulabilir) ama MVP'de **doldurulmaz/kullanılmaz** — ileride tam sürüm geçmişi
    gerektiğinde yalnızca bu tabloyu doldurmaya başlamak yeterli olur, `mevzuat` tablosunun şeması
    veya `MevzuatRepository` sözleşmesi değişmez.

### 3.3 Her iki kaynak için ortak davranış kuralları

- **TTL**: Karar = 30 gün, Mevzuat = 7 gün (yukarıda gerekçelendirildi).
- **Stale-while-revalidate**: TTL dolduğunda kullanıcıya mevcut (stale) veri **anında** gösterilir;
  yeniden doğrulama arka planda tetiklenir. Başarılı olursa `lastVerifiedAt` ve içerik güncellenir;
  başarısız olursa yalnızca `status` → `unverifiable` olur, gösterilen içerik değişmez. Kullanıcı
  hiçbir zaman bir yeniden doğrulama isteği yüzünden bekletilmez.
- **Force refresh**: yalnızca (a) kullanıcı bir kararı "Dosyalarıma Kaydet" ile aktif olarak
  kaydederken (en güncel hâli yakalamak için), veya (b) ileride eklenebilecek açık bir "Yeniden
  Doğrula" aksiyonuyla tetiklenir. MVP'de (b) mobil UI'da zorunlu değildir, yalnızca backend
  sözleşmesinin bunu desteklemesi yeterlidir.
- **Cache invalidation**: yalnızca üç durumda gerçekleşir — (1) TTL dolduğunda otomatik pasif
  invalidation (stale-while-revalidate akışına girer), (2) force refresh sonrası içerik gerçekten
  değiştiyse bağlı AI analizleri `stale` işaretlenir (bkz. §5.3), (3) kaynaktan kaldırıldığı tespit
  edilirse `status` → `removedFromSource` (satır silinmez).

---

## 4. Stabil Kimlik Stratejisi

Kaynağın kendi dahili `id`'sinin (ör. `getDokuman?id=` alanı) **kalıcı olduğu varsayılmaz** — Sprint
5A'da bu doğrulanamadı ve reverse-engineered kaynaklarda garanti edilmediği görüldü.

### 4.1 Alan tanımı

| Alan | Açıklama |
|---|---|
| `id` | Uygulamanın kendi UUID'si. Tüm ilişkiler (mobil dahil) her zaman buna işaret eder. |
| `source` | `'yargitay' \| 'mevzuat'` — ileride yeni kaynaklar eklenebilir. |
| `sourceId` | Kaynağın kendi dahili kimliği. **Değişebilir, güvenilmez** kabul edilir; yalnızca "kaynaktan yeniden çekerken hangi kaydı hedefliyorum" sorusu için kullanılır. |
| `naturalKey` (yalnızca Yargıtay) | `daire + esasNo + kararNo + tarih` alanlarının normalize edilmiş (mevcut `turkceKucult` deseniyle tutarlı Türkçe-güvenli küçültme, boşluk/noktalama sadeleştirme) birleşimi. |
| `naturalKeyHash` | `naturalKey`'in hash/fingerprint'i (ör. SHA-256). `(source, naturalKeyHash)` üzerinde **UNIQUE** kısıt taşır. |

### 4.2 Duplicate önleme ve eşleme

Kaynaktan yeni bir kayıt çekildiğinde: önce `(source, naturalKeyHash)` ile mevcut kayıt aranır.
- Eşleşme **bulunursa**: `sourceId` farklıysa yalnızca `sourceId` alanı güncellenir — kaydın `id`'si
  ve tüm ilişkileri **sabit kalır**. Bu, "kaynağın dahili id'si değişti" senaryosunu (Sprint 5A'da
  doğrulanamayan bir risk olarak işaretlenmişti) sessizce ve güvenle çözer.
- Eşleşme **bulunmazsa**: yeni bir `id` (UUID) ile yeni kayıt oluşturulur.

### 4.3 Mobil tarafla ilişki (bozulmaz)

Sprint 4B'de kurulan `KaydedilenKarar.kararId` ilişkisi **değişmez**. Mobil taraf her zaman
uygulamanın kendi `id` (UUID) alanını kullanır, kaynağın `sourceId`'sini asla görmez/bilmez.
`sourceId` yalnızca backend'in kaynakla senkronizasyon sırasında kullandığı dahili bir tekniktir.
Bu nedenle `sourceId` değişse bile mobil tarafta hiçbir kayıt ilişkisi bozulmaz — **mobil dosyalara
bu tur dokunulmadı ve dokunulması da gerekmiyor**, mimari zaten bu garantiyi taşıyor.

---

## 5. AI Veri Modeli Ayrımı

AI alanları kaynak tablolarına (`kararlar`, `mevzuat`) doğrudan yazılmaz. Kaynak verisi ile AI
üretimleri ayrı tablolarda tutulur:

### 5.1 Kaynak tabloları
- **`kararlar`** — kaynak verisi: `id`, `source`, `sourceId`, `naturalKeyHash`, mahkeme, daire, esas
  no, karar no, tarih, tam metin, `lastVerifiedAt`, `status`, `sourceContentHash`.
- **`mevzuat`** — eşdeğer desende kaynak verisi: `id`, `source`, `sourceId`, `naturalKeyHash`, tür,
  no, ad, madde metni, `effectiveFrom`, `effectiveTo`, `lastVerifiedAt`, `status`,
  `sourceContentHash`.
- **`mevzuat_surumleri`** — §3.2'de tanımlandığı gibi, MVP'de boş/kullanılmayan, yalnızca şema
  düzeyinde hazır tutulan sürüm geçmişi tablosu.

### 5.2 AI tabloları
- **`karar_ai_analizleri`** — `kararId` (FK → `kararlar.id`), `model`, `promptVersion`,
  `outputVersion`, `ozet`, `anahtarKavramlar`, `hukukDali` (AI'ın kendi sınıflandırması —
  `kararlar` tablosundaki kaynak alandan bağımsız/tamamlayıcı), `atifYapilanMevzuat`, `createdAt`,
  `updatedAt`, `status` (`fresh \| stale \| generating \| failed`), `error`,
  `sourceContentHashAtGeneration`.
- **`karar_embeddingleri`** — **ayrı tablo**, `kararId` (FK), `model`, embedding vektörü,
  `createdAt`, `sourceContentHashAtGeneration`. Embedding modeli değiştiğinde yalnızca bu tablo
  yeniden üretilir; `karar_ai_analizleri` etkilenmez. Kaynak metinden bağımsız olarak, her zaman
  `kararlar.tamMetin`'den yeniden üretilebilir — kalıcı bir "gerçek" değil, yeniden hesaplanabilir bir
  türetilmiş veridir.
- **`karar_mevzuat_atiflari`** *(gerekiyorsa)* — `kararId` (FK), `mevzuatId` (FK), `maddeNo`,
  `kaynak` (`AI \| manuel`). Kararların hangi mevzuat maddelerine atıfta bulunduğunu ilişkisel
  tutan köprü tablo.

### 5.3 `sourceContentHash` ile bayatlama (staleness) tespiti

`kararlar.tamMetin` (ve ilgili kaynak alanların birleşimi) üzerinden bir hash hesaplanır
(`sourceContentHash`). Her AI analizi/embedding üretildiğinde, o anki `sourceContentHash` değeri
ilgili AI tablosuna (`sourceContentHashAtGeneration`) kopyalanır.

Kaynak yeniden doğrulandığında (`§3` TTL akışı) içerik gerçekten değiştiyse `kararlar.sourceContentHash`
güncellenir. Bu durumda mevcut AI kaydındaki `sourceContentHashAtGeneration` artık güncel
`kararlar.sourceContentHash` ile **eşleşmez** — bu uyumsuzluk, o AI analizinin/embedding'in
`stale` sayılması için yeterli sinyaldir (okuma anında karşılaştırma veya bir arka plan işiyle
`status` alanı `stale`'e çekilebilir; bu, bir uygulama/veritabanı mekanizması kararıdır, bu turda
migration yazılmadığı için yalnızca **model** olarak dokümante edilmiştir, uygulanmamıştır).

Not: TTL yeniden doğrulaması çoğu zaman "içerik hâlâ aynı" sonucunu üretir (kararlar nadiren
değişir) — bu durumda `sourceContentHash` değişmez, dolayısıyla mevcut AI analizleri gereksiz yere
`stale` işaretlenmez. Yeniden üretim yalnızca gerçek bir içerik değişikliğinde tetiklenir.

---

## 6. Değişiklik Özeti (bu tur)

- Sprint 5A'nın "Net Mimari Kararı" bu turda **değiştirilmedi**, yalnızca uygulanabilir hale
  getirildi (Go/No-Go kapısı, cache politikası, kimlik stratejisi, AI ayrımı eklendi).
- Tablo isimleri `kararlar_cache`/`mevzuat_cache` → `kararlar`/`mevzuat` olarak düzeltildi (§1.1).
- Bu belge (`VERI_MIMARISI.md`) yeni oluşturuldu; `CLAUDE.md` §16'ya referans eklendi.
- `PRD.md`, `BACKLOG.md`, `ROADMAP.md` içeriği değiştirilmedi — bu belge yeni bir kullanıcı özelliği
  tanımlamaz, yalnızca mevcut kapsamın backend mimarisini netleştirir.
- Hiçbir Supabase migration, Edge Function veya mobil dosya değişikliği bu turda yapılmadı.

## 7. Sonraki adım

Somut Supabase tablo tasarımı (alanlar, RLS, index, ER ilişkileri, performans/future-proof
değerlendirmesi) `VERI_MODELI.md`'dedir. Mobil ↔ backend API sözleşmesi (endpoint'ler,
request/response modelleri, pagination, hata sözleşmesi, versioning) `API_CONTRACT.md`'dedir.
Uygulanabilir teknik iş listesi `SPRINT_5B_BACKLOG.md`'dedir. Somut SQL migration planı (extension,
tablo/constraint, index, RLS, trigger, rollback, seed, doğrulama) `MIGRATION_PLAN.md`'dedir. Gerçek
SQL migration dosyalarının yazılması ondan sonraki adımdır.
