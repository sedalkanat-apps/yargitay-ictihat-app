# API_CONTRACT.md — Mobil ↔ Backend API Sözleşmesi (Sprint 5B.1)

Bu belge `VERI_MIMARISI.md` ve `VERI_MODELI.md` kararlarını temel alan, mobil uygulama ile Supabase
Edge Function katmanı arasındaki API sözleşmesini tanımlar. **Kod, SQL, migration, Edge Function
veya mobil dosya değişikliği bu turda yapılmamıştır** — yalnızca sözleşme tasarımıdır. Sıradaki adım
SQL migration tasarımıdır.

---

## 1. API Tasarım İlkeleri

- **Sınır**: Mobil → Repository → Edge Function API (`/v1/...`) → Normalize Katmanı →
  Supabase/Resmî kaynak. Mobil yalnızca Repository'yi, Repository yalnızca bu API'yi bilir.
- Mobil **asla** şunları bilmez/görmez: Yargıtay/mevzuat.gov.tr endpoint adları, HTML yapısı,
  kaynak-özel JSON alanları, cookie/CAPTCHA/CSRF/TLS istisnaları, `sourceId`'nin ham hali, scraping
  detayları. Bunların hiçbiri hiçbir response alanında bulunmaz.
- API, kaynağın veri şeklini değil **kendi domain modelimizi** (`KararOzet`, `MevzuatOzet` vb.)
  yansıtır — kaynak değişse bile şekil değişmez (bkz. §14-15).
- Response'lar yalnızca mobilin gerçekten tükettiği alanları taşır; backend/audit alanları (`source_id` ham hali, `natural_key_hash`, `kaynak_ozel_veri`, `source_content_hash`, iç zaman damgaları) hiçbir response'a yazılmaz.
- Evrim **additive-first**: yeni alan/kaynak/hata kodu eklemek asla mevcut sözleşmeyi bozmaz (bkz. §9).
- Her response (başarılı veya hatalı) bir `requestId` taşır (bkz. §11).

---

## 2. Endpoint Listesi

| Endpoint | Metod | Amaç |
|---|---|---|
| `/v1/karar-ara` | POST | Karar arama (filtreli, sayfalı) |
| `/v1/karar/:id` | GET | Karar detayı (tam metin dahil). `?forceRefresh=true` opsiyonel sorgu parametresi ile yeniden doğrulama tetiklenir — **ayrı bir endpoint değil**, aynı kaynağın bir okuma-modifiyeri (bkz. §10) |
| `/v1/mevzuat-ara` | POST | Mevzuat arama |
| `/v1/mevzuat/:id` | GET | Mevzuat (belge düzeyi) detayı |
| `/v1/mevzuat/:id/madde/:maddeNo` | GET | Madde düzeyi metin |
| `/v1/health` | GET | Backend temel çalışma durumu (monitoring) — bkz. §2.1 |

Force refresh için ayrı bir endpoint açılmadı çünkü aynı kaynağı (bir kararı) hedefliyor — yalnızca
"ne kadar taze istiyorum" bilgisini taşıyan bir sorgu parametresi, yeni bir kaynak/kavram değil.

### 2.1 `GET /v1/health`

**Amaç**: Backend'in temel çalışma durumunu, hiçbir hassas/teknik detay sızdırmadan kontrol
edilebilir kılmak — hem harici monitoring servisleri hem (isteğe bağlı) mobil uygulamanın kendisi
için.

**Response** (`HealthResponse`):

| Alan | Tip | Açıklama |
|---|---|---|
| `status` | `'ok'\|'degraded'\|'down'` | Genel durum — hesaplama kuralı aşağıda |
| `version` | string | API'nin kendi sürüm etiketi (ör. `"1.3.0"`) — sunucu/altyapı bilgisi değil, yalnızca bir sürüm string'i |
| `database` | `'ok'\|'degraded'\|'down'` | Supabase Postgres bağlantı/temel sorgu sağlığı |
| `cache` | `'ok'\|'degraded'\|'down'` | `kararlar`/`mevzuat` verisinin genel tazelik durumu (ör. son yeniden doğrulama denemelerinin başarı oranı) — `database`'den farklı bir boyutu ölçer |
| `source` | `'ok'\|'degraded'\|'down'` | Yargıtay/mevzuat.gov.tr'ye en son erişim denemelerinin genel başarı durumu |
| `timestamp` | string (ISO 8601) | Response'un üretildiği an |
| `requestId` | string | Diğer tüm endpoint'lerle aynı desen |

**`status` hesaplama kuralı** (basit, öngörülebilir öncelik sırası):
1. `database = 'down'` ise genel `status = 'down'` — diğer her şey bundan bağımsız olarak.
2. `database = 'ok'` ama `source = 'down'` ise genel `status` en fazla `'degraded'` olur —
   mevcut kalıcı veri (`VERI_MIMARISI.md` §3'teki "kaynak erişilemezse son bilinen sürüm
   gösterilir" kararı) hâlâ servis edilebiliyor demektir, bu bir tam kesinti değildir.
3. Aksi halde `status`, üç alt bileşenin **en kötüsüdür** (`ok` > `degraded` > `down` sıralamasında).

**Kesinlikle döndürülmeyenler**: secret/anahtar, kaynak endpoint URL'leri, stack trace, iç
IP/altyapı detayı (ör. hangi Supabase projesi/region), ayrıntılı hata mesajı. Ayrıntılı teşhis
bilgisi yalnızca backend loglarında (`requestId` ile eşlenebilir) kalır — bu, §6/§10'daki genel
hata/log ayrımıyla birebir tutarlıdır.

**Stabilite gereksinimi**: bu endpoint'in şeması v1 içinde **asla breaking değişmez** — monitoring
araçları tipik olarak basit bir alan kontrolü yapar (ör. `status == "ok"`); yeni alan eklenmesi
additive olarak serbest ama mevcut alanların anlamı/tipi sabit kalır. Endpoint'in kendi iç sorgusu
kasıtlı olarak **hafif** tutulur (ör. Postgres'e basit bir bağlantı kontrolü) — health check'in
kendisi ağır bir sorgu yüzünden yanlışlıkla `'degraded'` görünmesin diye.

Auth ve rate-limit kararı için bkz. §8.1.

---

## 3. Karar Contract'ları

### 3.1 `POST /v1/karar-ara` — Request

| Alan | Tip | Zorunlu | Validation | Varsayılan |
|---|---|---|---|---|
| `anahtarKelime` | string | hayır | trim edilir, max 200 karakter | — |
| `mahkeme` | string | hayır | max 100 karakter | — |
| `daire` | string | hayır | max 100 karakter | — |
| `hukukDali` | string | hayır | max 100 karakter | — |
| `esasYil` | number (int) | hayır | 1926 ≤ x ≤ bugünkü yıl | — |
| `esasNo` | string | hayır | max 50 karakter, yalnızca esas no'nun yıl-sonrası sıra kısmı (ör. "4521") | — |
| `kararYil` | number (int) | hayır | 1926 ≤ x ≤ bugünkü yıl | — |
| `kararNo` | string | hayır | max 50 karakter | — |
| `baslangicTarihi` | string (YYYY-MM-DD) | hayır | geçerli tarih, `bitisTarihi` varsa ondan küçük/eşit | — |
| `bitisTarihi` | string (YYYY-MM-DD) | hayır | geçerli tarih, bugünden büyük olamaz | — |
| `siralama` | `'tarih_azalan'\|'tarih_artan'\|'ilgililik'` | hayır | enum | `'tarih_azalan'` |
| `sayfa` | number (int) | hayır | ≥ 1 | `1` |
| `sayfaBoyutu` | number (int) | hayır | 1–50 arası | `20` |

**Çapraz-alan kuralı**: yukarıdaki filtrelerden **en az biri** dolu olmalı; hepsi boşsa
`VALIDATION_ERROR` döner (Sprint 5A'da Yargıtay'ın kendi arayüzünde de aynı kural gözlemlendi —
"tüm korpusu getir" anlamına gelen bir istek hem anlamsız hem pahalıdır).

### 3.2 `POST /v1/karar-ara` — Response
`sonuclar` (`KararOzetResponse[]`, yalnızca liste için gereken alanlar — **tam metin YOK**),
`pagination`, `kaynakErisimDurumu` (`'cache'|'canli'|'karisik'` — bu aramanın sonuçları önbellekten
mi, kaynaktan canlı mı, yoksa karışık mı geldi), opsiyonel `uyarilar: string[]` (kullanıcıya
gösterilebilir, teknik olmayan metin, ör. "Bazı sonuçlar güncel olmayabilir"), `requestId`.

### 3.3 `GET /v1/karar/:id` — Response (`KararDetayResponse`)
`id`, `mahkeme`, `daire`, `esasNo`, `kararNo`, `tarih`, `hukukDali`, `ozet`, `tamMetin`, `kaynak`
(`SourceMetadata` — bkz. §7), `requestId`.

**Response'a konulmayanlar (bilinçli dışlama)**: `source`/`sourceId` ham değeri (yalnızca
`SourceMetadata.source` güvenli enum'u ve `gorunenAd` metni gider), `naturalKeyHash`,
`kaynakOzelVeri`, `contentHash`/`sourceContentHash` (mobil hiçbir UI kararında bunu kullanmıyor —
bayatlama tespiti tamamen backend'in AI pipeline'ının iç işidir, bkz. `VERI_MIMARISI.md` §5.3),
`created_at`/`updated_at` gibi iç zaman damgaları. `sourceFreshness` ayrı bir alan olarak
**eklenmedi** — `verificationStatus` + `isStale` + `lastVerifiedAt` üçlüsü (hepsi `SourceMetadata`
içinde) aynı bilgiyi zaten eksiksiz taşıyor; üçüncü, yarı-örtüşen bir alan yalnızca mobilde "hangisi
doğru kaynak" belirsizliği yaratırdı.

---

## 4. Mevzuat Contract'ları

### 4.1 `POST /v1/mevzuat-ara` — Request

| Alan | Tip | Zorunlu | Validation | Varsayılan |
|---|---|---|---|---|
| `aramaMetni` | string | hayır | max 200 karakter | — |
| `mevzuatTuru` | `'kanun'\|'khk'\|'yonetmelik'\|'teblig'\|'diger'` | hayır | enum | — |
| `mevzuatNo` | string | hayır | max 50 karakter | — |
| `baslangicTarihi` | string (YYYY-MM-DD) | hayır | geçerli tarih | — |
| `bitisTarihi` | string (YYYY-MM-DD) | hayır | geçerli tarih | — |
| `yururlukDurumu` | `'yururlukte'\|'yururluktenKalkmis'\|'tumu'` | hayır | enum | `'yururlukte'` |
| `sayfa` | number | hayır | ≥ 1 | `1` |
| `sayfaBoyutu` | number | hayır | 1–50 | `20` |

Aynı "en az bir filtre" kuralı geçerlidir.

### 4.2 `POST /v1/mevzuat-ara` — Response
`sonuclar` (`MevzuatOzetResponse[]`), `pagination`, `kaynakErisimDurumu`, `uyarilar?`, `requestId`.

### 4.3 `GET /v1/mevzuat/:id` — Response (`MevzuatDetayResponse`)
`id`, `mevzuatTuru`, `mevzuatNo`, `ad`, `tamMetin`, `effectiveFrom`, `effectiveTo`, `kaynak`
(`SourceMetadata`), `requestId`.

### 4.4 `GET /v1/mevzuat/:id/madde/:maddeNo` — Response (`MaddeResponse`)
`mevzuatId`, `maddeNo`, `maddeMetni`, `kaynak`, `requestId`. Backend henüz madde-düzeyi ayrıştırma
yapmıyorsa (MVP'de `mevzuat` tablosu yalnızca belge düzeyinde, `VERI_MODELI.md` §7) bu endpoint
`NOT_FOUND` döner — ayrı bir hata sınıfı **gerekmez**, "bu madde şu an mevcut değil" semantik
olarak yeterlidir.

Mobilde mevzuat özelliği bu sprintte açılmayacak (`VERI_MIMARISI.md`/`CLAUDE.md` kararı), ama
contract yukarıdaki gibi hazır tutulur.

---

## 5. Pagination

**Sayfa (page) tabanlı — MVP için seçilen model.** Gerekçe:
- Karar/mevzuat verisi büyük ölçüde append-only; cursor-based'in çözdüğü "page drift" (sık
  ekleme/silme sırasında sayfa kayması) sorunu burada anlamlı ölçüde yok.
- Mobilin zaten var olan Sonuçlar ekranı UI'ı ("01–06 arası gösteriliyor", toplam sonuç sayısı)
  toplam kayıt/sayfa bilgisini DOĞRUDAN gerektiriyor — cursor-based bunu ucuza vermez.
- Mevcut mock Sonuçlar ekranı zaten sayfa-tabanlı bir sonsuz-kaydırma simülasyonu kullanıyor —
  page-based, sıfır ek mobil kavramsal değişiklikle örtüşüyor.
- Solo Founder ilkesi: cursor-based'in getirdiği ek karmaşıklık (opak cursor encode/decode,
  sıralama tutarlılığı garantileri) bu ölçekte gerekmeyen bir yük.

Cursor-based ne zaman gerekir: yalnızca gerçek zamanlı/sık-değişen bir akış (ör. "az önce eklenen
kararlar" gibi push-benzeri bir liste) eklenirse — MVP kapsamında yok.

**`Pagination` modeli**: `sayfa`, `sayfaBoyutu`, `toplamKayit`, `toplamSayfa`,
`sonrakiSayfaVarMi: boolean`, `oncekiSayfaVarMi: boolean`. Son iki alan mobilin
`sayfa < toplamSayfa` hesabını kendi yapmasını gereksiz kılar — backend tek doğruluk kaynağıdır.
**Sayfa boyutu üst limiti**: 50 (bir **request validation** kuralıdır, response alanı değildir —
büyük `sayfaBoyutu` istekleri kaynağa/DB'ye orantısız yük bindirmesin diye).

---

## 6. Error Contract

Tüm Edge Function'larda ortak zarf:

```
ApiError { code, message, retryable, requestId, details? }
```

`details` yalnızca **yapısal** bilgi taşır (ör. hangi alan geçersiz) — asla stack trace, dosya
yolu, kaynak endpoint adı, HTML gövdesi veya secret içermez; bunlar yalnızca backend loglarında
(`requestId` ile eşleşen) kalır.

| code | HTTP | retryable | Mobil davranış |
|---|---|---|---|
| `VALIDATION_ERROR` | 400 | false | İlgili form alanının yanında hata; kullanıcı düzeltmeden tekrar gönderilmez |
| `NOT_FOUND` | 404 | false | Mevcut "Karar bulunamadı" ekranı deseni (zaten `karar-detay/[id].tsx`'te var) |
| `UNAUTHORIZED` | 401 | false | Giriş ekranına yönlendir (oturum geçersiz/süresi dolmuş) |
| `FORBIDDEN` | 403 | false | Erişim engellendi mesajı (ör. ileride premium sınırı) |
| `SOURCE_UNAVAILABLE` | 503 | true | "Şu an güncel arama yapılamıyor" + varsa önbellekteki sonuçlar gösterilmeye devam eder |
| `SOURCE_RATE_LIMITED` | 429 | true (gecikmeli) | Aynı mesaj; mobil **hemen** retry etmez, `details.retryAfterSeconds` varsa ona uyar |
| `SOURCE_SCHEMA_CHANGED` | 502 | false (kullanıcı için) | "Bu özellik geçici olarak kullanılamıyor" — teknik detay verilmez, yalnızca `requestId` ile iç takip |
| `INTERNAL_ERROR` | 500 | true | Genel "Bir şeyler ters gitti" + Tekrar Dene |

**`SOURCE_UNVERIFIABLE` bir hata sınıfı DEĞİL, bir durumdur** — kullanıcının listesinde geçiyor
ama tasarım gereği bir HTTP hatası olarak modellenmez: kaynağa erişilemediğinde/doğrulanamadığında
istek yine **200** ile başarılı döner, `kaynak.verificationStatus: 'unverifiable'` alanıyla
işaretlenir ve mevcut (stale) içerik gösterilir (`VERI_MIMARISI.md` §3.1'deki "kaynak erişilemezse
son bilinen sürüm gösterilir" kararıyla birebir). Bunu bir hata olarak modellemek, mobilin normal
içerik gösterme akışını gereksiz yere bir error-handling dalına zorlardı.

---

## 7. Cache/Freshness Metadata

Tek, yeniden kullanılan tip: `SourceMetadata { source, gorunenAd, lastVerifiedAt, verificationStatus, isStale }`.

- `source`: stabil, güvenli enum (`'yargitay' | 'mevzuat'`) — implementasyon detayı değil, yalnızca
  "hangi tür kaynak" bilgisi.
- `gorunenAd`: backend-kontrollü, kullanıcıya gösterilebilir metin (ör. "Yargıtay Karar Arama") —
  metin değişikliği (ör. kaynak değişirse) mobil güncellemesi gerektirmez.
- `lastVerifiedAt`, `verificationStatus`, `isStale`: `VERI_MIMARISI.md` §3'teki TTL/durum
  politikasının response'a yansıması. `isStale` backend'de hesaplanır
  (`now - lastVerifiedAt > TTL`) — mobil TTL sabitini asla kendi tarafında tutmaz/tekrarlamaz.

Mobil **hiçbir zaman** kaynağın teknik URL'sini/endpoint'ini görmez; yalnızca bu güvenli, backend
tarafından şekillendirilmiş metadata'yı alır.

---

## 8. Authentication / Authorization

- **Tüm** `/v1/karar-*` ve `/v1/mevzuat-*` endpoint'leri **login gerektirir** — search ve detail
  dahil, anonim erişim MVP'de yok. Gerekçe: PRD'nin zorunlu kayıt/giriş kapsamıyla ve
  `VERI_MODELI.md` §2'deki "hiçbir tabloda `anon` erişimi yok" RLS kararıyla tutarlılık; ayrıca
  rate limiting'in kullanıcı bazlı olabilmesi için kimlik zaten gerekli.
- **JWT doğrulaması** Edge Function'ın **en başında**, iş mantığından önce yapılır (Supabase'in
  yerleşik `auth.getUser()` mekanizmasıyla). Mobil bunun için ek bir şey yapmaz — mevcut Supabase
  client oturumu her isteğe `Authorization` header'ını zaten otomatik ekliyor.
- **`service_role` anahtarı mobile asla gitmez** — yalnızca Edge Function'ın kendi ortam
  değişkeninde yaşar (`VERI_MODELI.md` §2 ile birebir tutarlı; `kararlar`/`mevzuat` tablolarına
  yazma zaten yalnızca `service_role`'e açık).
- **Rate limiting: kullanıcı bazlı** (`auth.uid()` anahtarıyla) — tüm endpoint'ler zaten login
  gerektirdiği için kullanıcı kimliği güvenilir bir anahtar. IP bazlı DDoS/bot koruması (varsa,
  Supabase/CDN seviyesinde) bununla karıştırılmaz, bu API sözleşmesinin kapsamı dışındadır.
- **Ücretsiz/premium limiti**: bu sprintte ödeme sistemi kurulmuyor, ama `FORBIDDEN` hata sınıfı ve
  `details` alanı (ör. `{ reason: 'premium_gerekli', limit, kullanilan }`) bunu ileride **API
  seviyesinde** enforce etmeyi kısıtlamadan mümkün kılıyor — mobil zaten `FORBIDDEN`'ı genel olarak
  ele almak zorunda olduğu için ek mobil değişikliği gerekmeyecek.

### 8.1 İstisna: `/v1/health`

**`/v1/health` login GEREKTİRMEZ — bu turun bilinçli, gerekçeli tek istisnasıdır.**

- **Neden**: health endpoint'in amacı, kimliği ne olursa olsun (dahil harici monitoring servisleri
  — bunlar bir kullanıcı hesabı olarak kimlik doğrulayamaz) backend'in ayakta olup olmadığını
  kontrol edebilmektir. Zorunlu login koymak, tam da bu endpoint'in var olma amacını (dışarıdan
  otomatik izlenebilirlik) ortadan kaldırırdı. Bu, endüstri standardı bir pratiktir (Kubernetes
  liveness/readiness probe'ları, yük dengeleyici health check'leri vb. hep kimliksizdir) ve güvenli
  kalır çünkü response **tasarım gereği** hiçbir hassas/kullanıcıya özel veri taşımaz (bkz. §2.1'in
  "kesinlikle döndürülmeyenler" listesi).
- **Rate limit: IP bazlı** — §8'in geri kalanındaki "kullanıcı bazlı" varsayılanın **tek
  istisnasıdır**, çünkü bu endpoint'te bir `auth.uid()` yoktur (kimlik doğrulanmamış). Öneri: IP
  başına dakikada ~60 istek (yaygın monitoring servisleri 30-60 saniyede bir sorgular; bu sınır
  gerçek izlemeyi engellemeden kötüye kullanımı sınırlar). Bu, iş-mantığı throttling'i değil, salt
  kötüye-kullanım koruması amaçlıdır.

---

## 9. Idempotency

- **Force refresh** (`GET /v1/karar/:id?forceRefresh=true`): doğası gereği idempotent bir okuma —
  ayrı bir idempotency mekanizması gerekmez.
- **Kayıt oluşturma** (ör. ileride kaydedilen karar/dosya yazma endpoint'leri — bu turun kapsamı
  dışında): **Idempotency-Key header** deseni önerilir (client bir UUID üretir, aynı key'le
  tekrarlanan istek duplicate kayıt oluşturmaz, önceki sonucu döner). `VERI_MODELI.md`'deki
  `kaydedilen_kararlar (dosya_id, karar_id)` UNIQUE kısıtı zaten **kısmi** bir doğal idempotency
  sağlıyor (aynı ilişki iki kez oluşmaz), ama ağ-katmanı belirsizliğini (istek gitti mi gitmedi mi)
  tam çözmüyor — Idempotency-Key ek bir katman olarak **önerilir**, bu turda kurulmuyor.
- **İleride AI generation**: idempotent OLMALI (pahalı operasyon). `karar_ai_analizleri (karar_id,
  model, prompt_version)` UNIQUE kısıtı bunu zaten doğal olarak sağlıyor — backend "zaten var mı"
  kontrolü yapar, varsa mevcut kaydı (veya `status: 'generating'` ise "işleniyor" durumunu) döner.
  Ayrı bir Idempotency-Key **gerekmez**, veri modelinin kendi kısıtı yeterli.

Bu sprintte yalnızca **hangi operasyonların idempotent olması gerektiği ve nasıl** sağlanacağı
netleştirildi — hiçbir mekanizma kurulmadı.

---

## 10. Observability

- Her response (başarılı/hatalı) bir `requestId` (UUID) taşır — Edge Function'ın en başında
  üretilir.
- Mobil isteğe opsiyonel bir `X-Client-Request-Id` header'ı **ekleyebilir** (bu turda mobil kodu
  yazılmadı, yalnızca contract bunu destekleyecek şekilde tasarlandı); backend bunu kendi
  `requestId`'siyle ilişkilendirip loglar — mobil hata raporlarında (Sentry, mevcut tech stack)
  bu ID context olarak eklenir, destek/log takibi için kullanılır.
- Backend logları `requestId`, `source`, `islem`, `basarili`, `httpDurumu`, `gecikmeMs`,
  `hataMesaji` taşır — **kullanıcıya hiçbir teknik detay sızdırmadan** aynı isteğin arka planda
  izlenmesini sağlar.
- **Not (VERI_MODELI.md için açık takip maddesi, bu turda dosya değiştirilmedi)**: bu gözlemlenebilirlik
  modelinin tam çalışması için `entegrasyon_loglari` tablosuna bir `request_id` sütunu eklenmesi
  önerilir — additive, tek sütunluk bir değişiklik; SQL migration adımında değerlendirilmeli.

---

## 11. TypeScript Contract Modelleri

*(Yalnızca arayüz/tip tasarımı — proje dosyalarına yazılmadı, kod değildir.)*

```typescript
// --- Ortak ---

type VerificationStatus = 'active' | 'removedFromSource' | 'updated' | 'unverifiable';
type KaynakErisimDurumu = 'cache' | 'canli' | 'karisik';
type SaglikDurumu = 'ok' | 'degraded' | 'down';

interface HealthResponse {
  status: SaglikDurumu;
  version: string;
  database: SaglikDurumu;
  cache: SaglikDurumu;
  source: SaglikDurumu;
  timestamp: string; // ISO 8601
  requestId: string;
}

interface SourceMetadata {
  source: 'yargitay' | 'mevzuat';
  gorunenAd: string;
  lastVerifiedAt: string; // ISO 8601
  verificationStatus: VerificationStatus;
  isStale: boolean;
}

interface Pagination {
  sayfa: number;
  sayfaBoyutu: number;
  toplamKayit: number;
  toplamSayfa: number;
  sonrakiSayfaVarMi: boolean;
  oncekiSayfaVarMi: boolean;
}

interface ApiError {
  code:
    | 'VALIDATION_ERROR'
    | 'NOT_FOUND'
    | 'SOURCE_UNAVAILABLE'
    | 'SOURCE_RATE_LIMITED'
    | 'SOURCE_SCHEMA_CHANGED'
    | 'INTERNAL_ERROR'
    | 'UNAUTHORIZED'
    | 'FORBIDDEN';
  message: string;
  retryable: boolean;
  requestId: string;
  details?: Record<string, unknown>[];
}

// --- Karar ---

interface KararAramaRequest {
  anahtarKelime?: string;
  mahkeme?: string;
  daire?: string;
  hukukDali?: string;
  esasYil?: number;
  esasNo?: string;
  kararYil?: number;
  kararNo?: string;
  baslangicTarihi?: string; // YYYY-MM-DD
  bitisTarihi?: string; // YYYY-MM-DD
  siralama?: 'tarih_azalan' | 'tarih_artan' | 'ilgililik';
  sayfa?: number;
  sayfaBoyutu?: number;
}

interface KararOzetResponse {
  id: string;
  mahkeme: string;
  daire: string;
  hukukDali: string;
  esasNo: string;
  kararNo: string;
  tarih: string; // YYYY-MM-DD
  ozet: string;
  kaynak: SourceMetadata;
}

interface KararAramaResponse {
  sonuclar: KararOzetResponse[];
  pagination: Pagination;
  kaynakErisimDurumu: KaynakErisimDurumu;
  uyarilar?: string[];
  requestId: string;
}

interface KararDetayResponse extends KararOzetResponse {
  tamMetin: string;
  requestId: string;
}

// --- Mevzuat ---

interface MevzuatAramaRequest {
  aramaMetni?: string;
  mevzuatTuru?: 'kanun' | 'khk' | 'yonetmelik' | 'teblig' | 'diger';
  mevzuatNo?: string;
  baslangicTarihi?: string;
  bitisTarihi?: string;
  yururlukDurumu?: 'yururlukte' | 'yururluktenKalkmis' | 'tumu';
  sayfa?: number;
  sayfaBoyutu?: number;
}

interface MevzuatOzetResponse {
  id: string;
  mevzuatTuru: string;
  mevzuatNo: string;
  ad: string;
  effectiveFrom: string | null;
  effectiveTo: string | null;
  kaynak: SourceMetadata;
}

interface MevzuatAramaResponse {
  sonuclar: MevzuatOzetResponse[];
  pagination: Pagination;
  kaynakErisimDurumu: KaynakErisimDurumu;
  uyarilar?: string[];
  requestId: string;
}

interface MevzuatDetayResponse extends MevzuatOzetResponse {
  tamMetin: string;
  requestId: string;
}

interface MaddeResponse {
  mevzuatId: string;
  maddeNo: string;
  maddeMetni: string;
  kaynak: SourceMetadata;
  requestId: string;
}
```

---

## 12. Repository Eşlemesi

**`KararRepository`** (mevcut mobil sözleşme, `Sprint 4B`/`Sprint 5A`'da kurulu — bu turda
kırılmadı):

| Repository metodu | Eşlendiği endpoint | Not |
|---|---|---|
| `getKararById(id)` | `GET /v1/karar/:id` | `KararDetayResponse` → mobilin `KararOzet` tipine indirgenir (`tamMetin` bu metodun dönüşünde yok sayılır) |
| `getKararlar()` | *(kaldırılmaz, yalnızca mock-only kalır)* | Sprint 5A kararı: gerçek implementasyonda kullanılmaz, yerine `search()` geçer |
| `search(kriter)` | `POST /v1/karar-ara` | `KararAramaKriteri`↔`KararAramaRequest`, `KararAramaSonucu`↔`KararAramaResponse` — isimlendirme kasıtlı olarak birebir örtüşüyor |
| `getKararTamMetni(id)` | **`GET /v1/karar/:id` — aynı çağrı, ayrı endpoint DEĞİL** | Gerekçe aşağıda |

**Neden tek endpoint (ayrı bir `/tam-metin` endpoint'i değil)**: mevcut `karar-detay/[id].tsx`
ekranı zaten kimlik bilgisiyle tam metni AYNI ANDA, tek seferde render ediyor — "önce kimlik, sonra
isteğe bağlı tam metin" gibi kademeli bir yükleme deseni yok. Bu nedenle `getKararById` ve
`getKararTamMetni` aynı HTTP çağrısını (aynı TanStack Query `queryKey`'i) paylaşacak şekilde
tasarlanır — ek round-trip yok, repository sözleşmesindeki iki ayrı metot **isim olarak kalır**,
yalnızca ikisi de aynı kaynağı farklı bir seçiciyle okur.

**`MevzuatRepository`** (Sprint 5A'da önerilen, henüz mobilde inşa edilmedi):

| Repository metodu | Eşlendiği endpoint |
|---|---|
| `getMevzuatById(id)` | `GET /v1/mevzuat/:id` |
| `search(kriter)` | `POST /v1/mevzuat-ara` |
| `getMaddeMetni(mevzuatId, maddeNo)` | `GET /v1/mevzuat/:id/madde/:maddeNo` |
| `getDegisiklikTarihcesi(mevzuatId)` | **Henüz endpoint yok** — `mevzuat_surumleri` MVP'de boş olduğu için bu turda tasarlanmadı; ileride `GET /v1/mevzuat/:id/surumler` additive olarak eklenir |

---

## 13. Future-proof Değerlendirme

Danıştay/AYM/BAM/KİK/EPDK veya lisanslı bir üçüncü taraf sağlayıcı eklendiğinde:

- **Endpoint yapısı değişmez** — hepsi aynı `/v1/karar-ara`, `/v1/karar/:id` üzerinden erişilir
  (`VERI_MODELI.md`'nin `kararlar` tablosu zaten tüm yargı organlarını tek şemada tutuyor).
- **Response şeması değişmez** — yalnızca `SourceMetadata.source` enum'u genişler
  (`'yargitay' | 'danistay' | 'aym' | ...`), `KararOzetResponse`'un geri kalan alanları aynı kalır.
- Request'e **opsiyonel** bir `kaynak?: string[]` filtresi ("yalnızca Danıştay'da ara") eklenmesi
  gerekirse bu additive'dir, v1 içinde kalır.
- Kaynağa özgü alanlar (ör. AYM "başvuru no"su) API'yi **kirletmez** — `kaynak_ozel_veri` backend'de
  kalır, hiç API'ye yansımaz. Gerçekten mobilde gösterilmesi gereken bir kaynağa-özgü alan
  çıkarsa, bu **yeni, opsiyonel** bir alan (`basvuruNo?: string`) olarak eklenir — mevcut mobil kod
  etkilenmez.
- Lisanslı üçüncü taraf sağlayıcıya geçiş: `source` enum'una yeni değer eklenir, backend'in
  normalize katmanı o sağlayıcının formatını ortak şemaya çevirir — **API contract'ı hiç değişmez**.

---

## 14. Breaking-change Analizi

**Additive (v1 içinde kalır)**: yeni opsiyonel response alanı, yeni opsiyonel request alanı, yeni
`source` enum değeri, yeni error `code` (mobil bilmediği bir code'u savunmacı biçimde
`INTERNAL_ERROR` gibi ele alacak şekilde tasarlanmalı — bu bir mobil implementasyon detayı, bu
turda kodlanmadı ama gereksinim olarak not edildi).

**Breaking (v2 gerektirir)**: mevcut bir alanın tipi/anlamı değişirse, zorunlu yeni bir request
alanı eklenirse (eski mobil sürümü göndermez → istek reddedilir), mevcut bir alan kaldırılırsa,
bir endpoint'in URL'si/HTTP metodu değişirse.

**v2 ne zaman gerekir**: yalnızca yukarıdaki gerçek bir ihtiyaç doğduğunda — kaynak sağlayıcı
değişse bile (§13) bu koşullardan hiçbiri tetiklenmediği için v2 gerekmez.

**Mobil eski sürümle ne kadar süre çalışabilir**: additive-only strateji sayesinde v1 teorik olarak
hiç "kırılmıyor", yalnızca büyüyor — pratik öneri: mobilin en az son 12 ay içindeki tüm sürümleri
v1 üzerinde sorunsuz çalışmaya devam etmeli (App Store'un doğası gereği kullanıcılar hemen
güncellemez).

**Versioning stratejisi**: URL path'inde (`/v1/...`) — en basit, en az karmaşıklık gerektiren yöntem
(Solo Founder ilkesi, `CLAUDE.md` §11); header/content-negotiation tabanlı versiyonlama
eklenmedi.

---

## 15. Nihai Karar

> **"Bu API sözleşmesiyle backend veri kaynağı Yargıtay'dan başka bir sağlayıcıya geçse bile mobil
> uygulamada breaking change yaşamadan devam edebilir miyiz?"**

**Evet.**

1. Mobil hiçbir zaman kaynağa özgü hiçbir şey görmüyor (§1 sınırı + normalize katmanı +
   `kaynak_ozel_veri` backend-only) — kaynak değişse bile mobilin gördüğü şekil aynı kalır.
2. `source` zaten bir enum; yeni değer eklemek additive'dir.
3. `SourceMetadata.gorunenAd` backend-kontrollü bir metin — kaynak değişince yalnızca bu metin
   değişir ("Yargıtay Karar Arama" → başka bir görünen ad), mobil kod değişmeden olduğu gibi
   gösterir.
4. Kimlik stratejisi (`VERI_MODELI.md` §5, `naturalKeyHash`) kaynağın kendi id sistemi değişse bile
   bizim `id`'mizin sabit kalmasını garanti ediyor — bu API'nin `id` alanı hiç değişmez, mobildeki
   `KaydedilenKarar.kararId` ilişkileri bozulmaz.
5. Pagination/Error/Versioning modelleri kaynaktan tamamen bağımsız, jenerik tasarlandı.

**Tek dürüst sınır** (`VERI_MODELI.md` §8'deki aynı dürüstlükle): yeni sağlayıcı kavramsal olarak
çok farklı bir arama paradigması sunuyorsa (ör. yapılandırılmış esas/karar no filtresi hiç
desteklemiyorsa), contract yine de **kırılmaz** (tüm request alanları zaten opsiyonel; normalize
katmanı desteklenmeyen filtreleri sessizce yok sayar/en-iyi-çabayla eşler) — ama o sağlayıcının
kapsadığı **arama kalitesi** kendi yetenekleriyle sınırlı kalır. Bu bir ürün kalitesi sorunudur,
API sözleşmesi kırılması değildir — ayrımı net tutmak gerekir.

---

## 16. OpenAPI 3.1 Hazırlığı

Bu turda **hiçbir OpenAPI YAML/JSON dosyası, Swagger UI veya codegen kurulumu yapılmadı.** Aşağıdaki
netleştirmeler, ileride tek bir OpenAPI 3.1 tanımı üretilirken doğrudan kullanılabilecek bir
haritadır — TypeScript tip adlarıyla OpenAPI `components.schemas` adlarının **birebir** eşleşmesi
amaçlanmıştır.

| OpenAPI unsuru | Bu contract'taki karşılığı |
|---|---|
| **Path'ler** | `/v1/karar-ara`, `/v1/karar/{id}`, `/v1/mevzuat-ara`, `/v1/mevzuat/{id}`, `/v1/mevzuat/{id}/madde/{maddeNo}`, `/v1/health`. Bu belgedeki `:id`/`:maddeNo` yalnızca dokümantasyon-içi kısayoldur; OpenAPI'de süslü parantez sözdizimi (`{id}`) kullanılır. |
| **HTTP method'ları** | Zaten net: `POST /v1/karar-ara`, `GET /v1/karar/{id}`, `POST /v1/mevzuat-ara`, `GET /v1/mevzuat/{id}`, `GET /v1/mevzuat/{id}/madde/{maddeNo}`, `GET /v1/health`. |
| **Request schema isimleri** | `components.schemas.KararAramaRequest`, `components.schemas.MevzuatAramaRequest` — §11'deki TypeScript arayüz adlarıyla **birebir aynı ad**. |
| **Response schema isimleri** | `components.schemas.KararAramaResponse`, `KararOzetResponse`, `KararDetayResponse`, `MevzuatAramaResponse`, `MevzuatOzetResponse`, `MevzuatDetayResponse`, `MaddeResponse`, `HealthResponse` — hepsi §11 ile birebir aynı ad. |
| **Ortak error response** | `components.schemas.ApiError`, tüm `4xx`/`5xx` yanıtlarında `$ref` ile **tek yerden** yeniden kullanılır (DRY) — §6'daki tek zarf ilkesiyle birebir. |
| **Auth gereksinimi** | `components.securitySchemes.bearerAuth` (JWT, `type: http, scheme: bearer`) tanımlanır. `/v1/health` **hariç** tüm endpoint'ler `security: [{ bearerAuth: [] }]` alır; `/v1/health` açıkça `security: []` (public) olarak işaretlenir — §8/§8.1 ile birebir. |
| **Query/path parametreleri** | `GET /v1/karar/{id}`: path `id` (string, `format: uuid`), query `forceRefresh` (boolean, optional). `GET /v1/mevzuat/{id}/madde/{maddeNo}`: path `id`, `maddeNo`. `POST` endpoint'leri parametre almaz, yalnızca `requestBody`. |
| **Pagination** | `components.schemas.Pagination` tek yerde tanımlanır, hem `KararAramaResponse` hem `MevzuatAramaResponse` bunu `$ref` ile paylaşır — §5 ile birebir. |
| **Versioning** | OpenAPI dokümanının kendi `info.version`'ı (spec dosyasının sürümü) ile API'nin **path-tabanlı** sürümü (`/v1/`) **ayrı kavramlardır**, karıştırılmaz — §14'teki versioning kararını değiştirmez, yalnızca spec dosyasının kendi meta-sürümünü ifade eder. |
| **Health endpoint** | `GET /v1/health` → `HealthResponse`, `security: []`, §2.1 ile birebir. |

Bu haritalama sayesinde ileride üretilecek OpenAPI 3.1 dokümanı üzerinden backend doğrulaması, API
dokümantasyonu, client type generation ve integration testing yapılabilir hale gelir — **ama bunların
hiçbiri bu turda kurulmadı**, yalnızca isimlendirme/yapı tutarlılığı garanti altına alındı.

---

## 17. Bu turda yapılmayanlar (net)

Kod, SQL, migration, Edge Function, mobil dosya değişikliği yazılmadı. `entegrasyon_loglari`'na
`request_id` eklenmesi önerisi dışında `VERI_MODELI.md` da değiştirilmedi (bu öneri SQL migration
adımında değerlendirilecek bir açık nottur). Gerçek bir OpenAPI dosyası, Swagger UI veya codegen
kurulumu yapılmadı — yalnızca §16'daki haritalama netleştirildi. Sıradaki adım SQL migration
tasarımıdır.
