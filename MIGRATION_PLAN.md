# MIGRATION_PLAN.md — SQL Migration Tasarımı (Sprint 5B.2)

Bu belge `VERI_MODELI.md`, `API_CONTRACT.md` ve `VERI_MIMARISI.md` kararlarını **birebir** temel
alan, production-ready bir Supabase/Postgres migration planıdır. **Hiçbir SQL dosyası yazılmadı,
hiçbir migration çalıştırılmadı, Supabase'e bağlanılmadı, Edge Function veya mobil dosya
değiştirilmedi.** Bu belge yalnızca plandır; SQL dosyaları bir sonraki turda yazılacaktır.

Bu tur, VERI_MODELI.md'nin bazı noktalarını **production-hazır hale getirmek için netleştirdi/inceltti**
— değişen noktalar ilgili bölümde "VERI_MODELI.md'den revizyon" olarak açıkça işaretlenmiştir.

---

## 1. Extension Kararı

| Extension | Karar | Gerekçe |
|---|---|---|
| `pgcrypto` | **Eklenir** (`CREATE EXTENSION IF NOT EXISTS`) | PG13+'ta `gen_random_uuid()` çekirdeğe taşındığı için teorik olarak gerekmeyebilir, ama Supabase projelerinde zaten yaygın şekilde ön-kurulu; her tablonun PK üretiminin **tek garantisi** olduğu için savunmacı biçimde açıkça deklare edilir (idempotent, zararsız). Gerçek migration'da `SELECT version();` ile PG sürümü teyit edilmeli. |
| `pg_trgm` | **Eklenir** | GIN full-text (§8) yalnızca `tam_metin`/`ozet` gibi serbest metin için yeterli; `esas_no`/`karar_no` gibi **kısmi numara aramasında** ve `mahkeme`/`daire` gibi **yazım hatasına toleranslı filtre eşleşmesinde** tsvector işe yaramaz. `pg_trgm` bu boşluğu dolduruyor — gerçek, gerekçeli bir ihtiyaç, süs değil. |
| `vector` (pgvector) | **Eklenir** | `karar_embeddingleri.embedding` ve semantik arama (PRD "Konu özetiyle birebir ara") için zorunlu, alternatifsiz. |
| `unaccent` | **Eklenmez (şimdilik)** | Türkçe aksan-duyarsız arama kalitesini artırabilir ama §8'de MVP için `simple` config seçildiği için şu an gerekmiyor; `turkish`/`unaccent` kombinasyonuna geçilirse ileride değerlendirilecek, additive bir karar. |

Gereksiz extension eklenmedi — her biri belirli bir gerçek sorguyu/işlevi karşılıyor.

---

## 2. Enum/Check Constraint Kararı

**Tümü için: `text` + `CHECK` constraint. Hiçbiri native Postgres `ENUM` tipi olarak tasarlanmadı.**

| Alan | Karar | Gerekçe |
|---|---|---|
| `source` (kararlar/mevzuat) | text + CHECK | **En kritik karar.** Native ENUM'da `ALTER TYPE ... ADD VALUE` kilit/transaction kısıtları taşır, değer **kaldırılamaz/yeniden adlandırılamaz**. Danıştay/AYM/BAM/KİK/EPDK 5 yıl içinde eklenecek (`VERI_MODELI.md` §7) — bu alan **en sık genişleyecek** alan. CHECK constraint `DROP CONSTRAINT` + `ADD CONSTRAINT` ile tek, hızlı, kilitsiz bir migration'da genişler. |
| `verification_status` | text + CHECK | 4 sabit değer (`active/removedFromSource/updated/unverifiable`), kaynak sayısından bağımsız — büyümesi beklenmiyor, ama **tutarlılık** için (tek desen, tek zihinsel model) yine de CHECK seçildi; native ENUM'un marjinal depolama/performans farkı bu ölçekte önemsiz. |
| `ai_analysis_status` | text + CHECK | Aynı gerekçe (`fresh/stale/generating/failed`). |
| `mevzuat_turu` | text + CHECK | `source` ile aynı gerekçe — mevzuat türleri zamanla genişleyebilir (ör. "cumhurbaşkanlığı kararnamesi"). |
| `yururluk_durumu` | **Tablo kolonu olarak hiç eklenmedi** | Aşağıda açıklanıyor. |

**`yururluk_durumu` — VERI_MODELI.md'den revizyon**: bu, `mevzuat` tablosunda **saklanan bir kolon
DEĞİLDİR**. `effective_from`/`effective_to`'dan **API yanıtı üretilirken türetilir**
(`effective_to IS NULL OR effective_to > now()` → `'yururlukte'`, aksi halde
`'yururluktenKalkmis'`). Ayrı bir sütun olarak saklamak, aynı gerçeği iki yerde tutmak (klasik
türetilmiş-veri anti-deseni) ve tarih alanlarıyla senkron kalmasını garanti etmek için ekstra
mantık gerektirirdi. `API_CONTRACT.md`'deki `yururlukDurumu` **request filtresi** bununla
karışmamalı — o, arama kriteri; bu, saklanmayan bir görünüm.

**Migration bakım maliyeti** açısından net sonuç: proje boyunca **tek bir mekanizma** (text+CHECK)
kullanılacağı için hem migration yazımı hem gelecekteki genişletme tutarlı, tahmin edilebilir ve
düşük riskli kalıyor.

---

## 3. Migration Dosya Sırası

Kullanıcının verdiği örnek yalnızca örnekti; proje için seçilen nihai sıra:

```
001_extensions.sql          — pgcrypto, pg_trgm, vector
002_functions.sql           — ortak set_updated_at() trigger fonksiyonu (tablolardan önce tanımlanır)
003_core_reference_tables.sql — kararlar, mevzuat (FK bağımlılığı yok, en erken oluşturulabilir; indexleri dahil)
004_user_data_tables.sql    — profiles, muvekkiller, dosyalar, kaydedilen_kararlar, notlar (indexleri dahil)
005_ai_tables.sql           — karar_ai_analizleri, karar_embeddingleri, karar_mevzuat_atiflari, mevzuat_surumleri (indexleri dahil)
006_ops_tables.sql          — entegrasyon_loglari (indexi dahil)
007_triggers.sql            — tüm CREATE TRIGGER ... set_updated_at() çağrıları, TEK yerde
008_rls.sql                 — tüm RLS enable + policy tanımları, TEK yerde
```

**Neden index'ler ayrı bir dosyada değil, tablolarıyla birlikte**: kullanıcı örneğinden bilinçli
sapma — `CREATE INDEX CONCURRENTLY` (kilitsiz index oluşturma) yalnızca **canlı/dolu** tablolarda
anlamlıdır. Bu migration **boş bir veritabanında ilk şema kurulumu**dur, kilit/veri riski yok;
index'i tablosuyla birlikte tutmak "bu tabloda hangi index'ler var" sorusunu tek bakışta
cevaplıyor. **İleride** (launch sonrası, tablo doluyken) eklenecek her yeni index kendi ayrı
migration dosyasında ve `CONCURRENTLY` ile yazılmalı — bu, bu turun değil, gelecekteki
migration'ların kuralı.

**Neden trigger ve RLS merkezi, tek dosyada**: bunlar şemanın değil **davranışın/güvenliğin**
parçası. Özellikle RLS'in TEK, denetlenebilir bir dosyada olması — "hangi tabloda hangi policy var"
sorusunun dağınık değil tek yerden cevaplanabilmesi için kritik bir güvenlik incelemesi kolaylığı.

---

## 4. Tablo Bazlı Constraint Planı

*(PK her tabloda `id uuid PRIMARY KEY DEFAULT gen_random_uuid()` — ayrıca tekrar edilmiyor.)*

### `profiles`
- FK: `id` → `auth.users.id`, **ON DELETE CASCADE**
- NOT NULL: `id`, `created_at`, `updated_at`
- DEFAULT: `created_at`/`updated_at` = `now()`
- UNIQUE: yok (PK zaten tek)
- CHECK: yok
- `updated_at`: ortak trigger (§12)

### `kararlar`
- FK: yok (kök referans tablo)
- NOT NULL: `source`, `source_id`, `natural_key`, `natural_key_hash`, `mahkeme`, `daire`,
  `esas_no`, `karar_no`, `tarih`, `hukuk_dali` (DEFAULT `''`), `last_verified_at`,
  `verification_status`, `source_content_hash`, `created_at`, `updated_at`
- NULLABLE: `ozet`, `tam_metin`
- DEFAULT: `verification_status = 'active'`, `kaynak_ozel_veri = '{}'::jsonb`,
  `created_at`/`updated_at` = `now()`
- UNIQUE: `(source, natural_key_hash)` — bkz. §5
- CHECK: `source IN ('yargitay')` *(başlangıç listesi — genişletme §2'deki gerekçeyle kolay)*;
  `verification_status IN ('active','removedFromSource','updated','unverifiable')`
- `updated_at`: ortak trigger

### `mevzuat`
- FK: yok
- NOT NULL: `source`, `source_id`, `natural_key`, `natural_key_hash`, `mevzuat_turu`,
  `mevzuat_no`, `ad`, `last_verified_at`, `verification_status`, `source_content_hash`,
  `created_at`, `updated_at`
- NULLABLE: `tam_metin`, `effective_from`, `effective_to`
- DEFAULT: `verification_status = 'active'`, `kaynak_ozel_veri = '{}'::jsonb`
- UNIQUE: `(source, natural_key_hash)`
- CHECK: `source IN ('mevzuat_gov_tr')` *(VERI_MODELI.md'deki jenerik `'mevzuat'` yerine daha
  belirgin bir isim — kaynak SİSTEM ile TABLO adı karışmasın diye küçük bir netleştirme)*;
  `mevzuat_turu IN ('kanun','khk','yonetmelik','teblig','diger')`;
  `verification_status IN (...)` (aynı 4 değer)
- `updated_at`: ortak trigger

### `mevzuat_surumleri`
- FK: `mevzuat_id` → `mevzuat.id`, **ON DELETE CASCADE**
- NOT NULL: `mevzuat_id`, `tam_metin`, `effective_from`, `created_at`
- NULLABLE: `effective_to`
- UNIQUE: yok
- `updated_at`: **yok** (değişmez tarihsel anlık görüntü — bir sürüm kaydı asla güncellenmez)

### `muvekkiller`
- FK: `user_id` → `profiles.id`, **ON DELETE CASCADE**
- NOT NULL: `user_id`, `ad`, `tur`, `created_at`, `updated_at`
- CHECK: `tur IN ('gercek','tuzel')`
- `updated_at`: ortak trigger

### `dosyalar`
- FK: `muvekkil_id` → `muvekkiller.id` **ON DELETE CASCADE**; `user_id` → `profiles.id`
  **ON DELETE CASCADE**
- NOT NULL: `muvekkil_id`, `user_id`, `ad`, `created_at`, `updated_at`
- `updated_at`: ortak trigger

### `kaydedilen_kararlar`
- FK: `dosya_id` → `dosyalar.id` **ON DELETE CASCADE**; `user_id` → `profiles.id`
  **ON DELETE CASCADE**; `karar_id` → `kararlar.id` **ON DELETE RESTRICT**
- NOT NULL: `dosya_id`, `user_id`, `karar_id`, `kaydedilme_tarihi` (DEFAULT `now()`)
- UNIQUE: `(dosya_id, karar_id)`
- `updated_at`: **yok** (ilişki kaydı, değişmez)

### `notlar`
- FK: `dosya_id` → `dosyalar.id` **ON DELETE CASCADE**; `user_id` → `profiles.id`
  **ON DELETE CASCADE**
- NOT NULL: `dosya_id`, `user_id`, `metin`, `created_at`, `updated_at`
- `updated_at`: ortak trigger

### `karar_ai_analizleri`
- FK: `karar_id` → `kararlar.id` **ON DELETE CASCADE**
- NOT NULL: `karar_id`, `model`, `prompt_version`, `output_version`, `status` (DEFAULT
  `'generating'`), `source_content_hash_at_generation`, `created_at`, `updated_at`
- NULLABLE: `ozet`, `anahtar_kavramlar`, `hukuk_dali`, `atif_yapilan_mevzuat`, `error`
- UNIQUE: `(karar_id, model, prompt_version, output_version)` — bkz. §7 (VERI_MODELI.md'den revizyon)
- CHECK: `status IN ('fresh','stale','generating','failed')`
- `updated_at`: ortak trigger

### `karar_embeddingleri`
- FK: `karar_id` → `kararlar.id` **ON DELETE CASCADE**
- NOT NULL: `karar_id`, `model`, `embedding`, `dimensions`, `source_content_hash_at_generation`,
  `created_at`
- UNIQUE: `(karar_id, model)`
- CHECK: `dimensions = 1536` *(seçilen embedding modeline göre teyit edilecek — bkz. §17)*
- `updated_at`: **yok** — `created_at`, yeniden üretimde (upsert) **yeniden set edilir**
  ("bu vektör ne zaman hesaplandı" anlamına geldiği için ayrı bir `updated_at` gereksiz)

### `karar_mevzuat_atiflari`
- FK: `karar_id` → `kararlar.id` **ON DELETE CASCADE**; `mevzuat_id` → `mevzuat.id`
  **ON DELETE SET NULL** (nullable — bkz. `VERI_MODELI.md` §1.11 gerekçesi)
- NOT NULL: `karar_id`, `mevzuat_ad_ham`, `kaynak`, `created_at`
- UNIQUE: `(karar_id, mevzuat_ad_ham, madde_no)`
- CHECK: `kaynak IN ('AI','manuel')`
- `updated_at`: yok (append-only atıf kaydı)

### `entegrasyon_loglari`
- FK: yok (bağımsız)
- NOT NULL: `source`, `islem`, `basarili`, `created_at`, **`request_id`** (bkz. §4/aşağıda ayrı
  başlık)
- CHECK: `source IN ('yargitay','mevzuat_gov_tr')`; `islem IN ('arama','detay','yeniden_dogrulama')`
- `updated_at`: yok (append-only log)

---

## 5. `request_id` Takibi (VERI_MODELI.md açık maddesinin kapatılması)

`entegrasyon_loglari` tablosuna **`request_id uuid NOT NULL`** sütunu eklenir. `API_CONTRACT.md`
§10/§16'daki `requestId` alanıyla **birebir aynı değer** — Edge Function bir isteğe başladığında
ürettiği `requestId`'yi hem response'a hem bu log satırına yazar. Index: `(request_id)` — "aynı
isteğin izlenmesi" (destek/hata raporu takibi) sorgusunu hızlandırır. Bu, Sprint 5B.1'de açık
bırakılan tek takip maddesiydi; bu turda kapatıldı.

---

## 6. Cache/Freshness Alanları

### `kararlar`
`last_verified_at` (timestamptz, NOT NULL), `verification_status` (text, NOT NULL, DEFAULT
`'active'`), `source_content_hash` (text, NOT NULL), `created_at`/`updated_at` (timestamptz).
**`fetched_at` AYRI bir sütun olarak EKLENMEDİ** — `last_verified_at` zaten "kaynakla en son ne
zaman karşılaştırıldığı"nı tutuyor (`VERI_MIMARISI.md` §3.1); ayrı bir `fetched_at` bununla her
zaman birlikte güncellenecek, saf bir tekrar olurdu. Talimat "yalnızca gerçekten breaking change
önlüyorsa ekle" diyordu — bu alan hiçbir şeyi önlemiyor, eklenmedi.

### `mevzuat`
`last_verified_at`, `verification_status`, `effective_from` (date, NULLABLE — ingestion anında her
zaman bilinmeyebilir), `effective_to` (date, NULLABLE — NULL "hâlâ yürürlükte veya bilinmiyor"
anlamına gelir, MVP bu ikisini ayırt etmiyor, bilinçli bir basitleştirme). `yururluk_durumu`
**saklanmıyor** (§2).

---

## 7. AI Tablo Constraint'leri

**`karar_ai_analizleri` UNIQUE — VERI_MODELI.md'den revizyon**: `(karar_id, model, prompt_version,
output_version)` — **dört** kolon (önceki tasarımda üçtü). Gerekçe: `prompt_version` (girdi şablonu
sürümü) ve `output_version` (çıktının şema/format sürümü) **birbirinden bağımsız** eksenlerdir —
aynı prompt ile üretilmiş bir çıktının yeniden yapılandırılmış/yeni şemaya taşınmış bir versiyonu,
`prompt_version` değişmeden `output_version` değişerek ayrı, meşru bir satır olmalı. Üç-kolonlu
kısıt bu durumu yanlışlıkla "aynı kayıt" sayardı.

**`karar_embeddingleri` UNIQUE**: `(karar_id, model)` — `dimensions` kısıta dahil değil çünkü zaten
`model` tarafından belirleniyor (aynı model her zaman aynı boyutu üretir). `dimensions` sütunu
bilgilendirici/doğrulayıcı bir alan (`CHECK dimensions = 1536`) — pgvector'ın `vector(N)` tipi
kolon düzeyinde SABİT bir boyut gerektirdiği için (tek kolon farklı satırlarda farklı boyut
taşıyamaz), bugünkü tasarım **tek bir embedding modeli** varsayıyor. İleride farklı boyutlu ikinci
bir model eklenirse bu, dürüstçe **yeni bir kolon veya yeni bir tablo** gerektirecek bir sınırdır —
bkz. §16 Riskler.

---

## 8. Full-text Search Stratejisi

- **Generated tsvector column**: `arama_vektoru tsvector GENERATED ALWAYS AS (...) STORED` —
  manuel trigger ile senkron tutulan bir kolon yerine Postgres'in kendi generated-column
  mekanizması (PG12+) kullanılır; ekstra trigger kodu/bakım yükü yok.
- **GIN index**: `arama_vektoru` üzerinde — kritik, arama ürününün temel gereksinimi.
- **Config: `simple`, `turkish` DEĞİL** — MVP kararı. Gerekçe: `turkish` config'in stemming
  davranışı hukuki terminolojide (kanun/madde isimleri, sabit ibareler) beklenmedik eşleşme/eşleşmeme
  üretebilir; `simple` öngörülebilir ve `pg_trgm` ile birlikte (aşağıda) yeterli kalite sağlıyor.
  `turkish`'e geçiş **ileride, additive bir iyileştirme** olarak değerlendirilebilir (generated
  column + index'in yeniden oluşturulmasını gerektirir — bounded, tek seferlik bir maliyet, API
  sözleşmesini etkilemez).
- **`pg_trgm` ile fuzzy/ILIKE**: `esas_no`, `karar_no` üzerinde GIN trigram index — kısmi numara
  arama için. `mahkeme`, `daire` üzerinde de değerlendirilebilir — yazım hatasına tolerans için.
- **Metadata filtreleriyle kombinasyon**: tam-metin koşulu (`arama_vektoru @@ ...`) ile B-tree
  filtreler (mahkeme/daire/tarih/esas/karar no) aynı `WHERE` içinde `AND` ile birleşir; Postgres
  planner'ı bunu bitmap AND ile verimli birleştirir — ek bir composite index mühendisliği gerekmez,
  her filtrenin kendi index'i (§10) yeterli.

---

## 9. Vector Index Stratejisi

**HNSW seçildi (IVFFlat değil).**

| Kriter | IVFFlat | HNSW |
|---|---|---|
| Boş/az veriyle başlama | **Zayıf** — kümeleme kalitesi index kurulurken mevcut veri dağılımına bağlı; MVP'nin boş tablodan başlayıp kademeli büyümesi (`VERI_MIMARISI.md`'nin "erişildiğinde çek" deseni) tam olarak IVFFlat'in kötü olduğu senaryo | **İyi** — artımlı olarak inşa edilir, soğuk-başlangıç sorunu yok |
| Sorgu performansı | Ayarlanabilir ama genelde HNSW'nin gerisinde | Genelde daha iyi recall/hız dengesi |
| Bellek/kurulum maliyeti | Düşük | Daha yüksek, ama 1M satır ölçeğinde (`VERI_MODELI.md` §6) yönetilebilir |

**Karar gerekçesi**: bu uygulamanın embedding tablosu **toplu yüklenen sabit bir veri seti değil**,
kullanıcı etkileşimine göre kademeli büyüyen bir tablo — IVFFlat'in "kurulumda temsili veri gerekir"
zayıflığı burada gerçek bir operasyonel sorun (erken kurulur, sonra yeniden indexlenmesi gerekir).
HNSW bunu önlüyor. **Erken optimizasyon yapılmadı**: parametreler (`m`, `ef_construction`)
pgvector'ın kendi makul varsayılanlarında bırakılıyor, elle ayar bu turda yapılmadı.
Benzerlik metriği: `vector_cosine_ops` (metin embedding modelleri için endüstri standardı).

---

## 10. Index Planı

| Tablo.Index | Unique? | Composite sırası | Hangi sorgu |
|---|---|---|---|
| `kararlar (source, natural_key_hash)` | ✅ | source önce (filtre önceliği + gelecekte kaynak-bazlı partition olasılığı, bkz. `VERI_MODELI.md` §6) | Dedup/upsert anchor |
| `kararlar (source, source_id)` | ❌ | aynı gerekçe | Kaynaktan yeniden çekerken eşleme |
| `kararlar (last_verified_at)` | ❌ | — | TTL taraması |
| `kararlar (verification_status) WHERE verification_status <> 'active'` | ❌ (partial) | — | Dikkat gerektiren kayıtları küçük/ucuz bir index'te izleme |
| `kararlar (arama_vektoru)` GIN | ❌ | — | Tam metin arama |
| `kararlar (esas_no) gin_trgm_ops` | ❌ | — | Kısmi esas no arama |
| `kararlar (karar_no) gin_trgm_ops` | ❌ | — | Kısmi karar no arama |
| `kararlar (mahkeme, daire)` | ❌ | mahkeme önce (daha seçici, daha az kardinalite artışı) | Daire filtre chip'i |
| `mevzuat (source, natural_key_hash)` | ✅ | | Dedup/upsert |
| `mevzuat (source, source_id)`, `(last_verified_at)`, `(arama_vektoru)` GIN | ❌ | | `kararlar` ile aynı gerekçeler |
| `karar_ai_analizleri (karar_id, model, prompt_version, output_version)` | ✅ | | Dedup + "bu kombinasyon var mı" |
| `karar_ai_analizleri (status) WHERE status = 'stale'` | ❌ (partial) | | Bayatlama taraması job'ı |
| `karar_embeddingleri (karar_id, model)` | ✅ | | Dedup |
| `karar_embeddingleri (embedding)` HNSW, `vector_cosine_ops` | ❌ | | Semantik arama |
| `karar_mevzuat_atiflari (karar_id, mevzuat_ad_ham, madde_no)` | ✅ | | Dedup |
| `karar_mevzuat_atiflari (karar_id)`, `(mevzuat_id)` | ❌ | | Çift yönlü sorgu |
| `muvekkiller (user_id)` | ❌ | | RLS + liste |
| `dosyalar (muvekkil_id)`, `(user_id)` | ❌ | | RLS + liste |
| `kaydedilen_kararlar (dosya_id, karar_id)` | ✅ | | Dedup |
| `kaydedilen_kararlar (dosya_id)`, `(karar_id)` | ❌ | | Liste + ters sorgu |
| `notlar (dosya_id)` | ❌ | | Liste |
| `entegrasyon_loglari (created_at)`, `(source, basarili)`, `(request_id)` | ❌ | | İzleme + destek lookup'u |

**Gereksiz index yok**: her satırın karşılık geldiği somut bir sorgu yukarıda belirtildi; `profiles`
tablosunda PK dışında hiçbir index eklenmedi çünkü tüm erişim zaten `id` PK'siyle oluyor.

---

## 11. RLS Policy Planı

**Kullanıcıya ait tablolar** (`profiles`, `muvekkiller`, `dosyalar`, `kaydedilen_kararlar`,
`notlar`) — hepsinde `auth.uid()` temelli, isimlendirilmiş policy'ler:

| Tablo | Policy adı | Komut | Koşul |
|---|---|---|---|
| `profiles` | `profiles_select_own` | SELECT | `auth.uid() = id` |
| `profiles` | `profiles_update_own` | UPDATE | `auth.uid() = id` |
| `profiles` | `profiles_insert_own` | INSERT | `auth.uid() = id` |
| `muvekkiller` | `muvekkiller_select_own` / `_insert_own` / `_update_own` / `_delete_own` | SELECT/INSERT/UPDATE/DELETE | `auth.uid() = user_id` |
| `dosyalar` | `dosyalar_select_own` / `_insert_own` / `_update_own` / `_delete_own` | aynı | `auth.uid() = user_id` |
| `kaydedilen_kararlar` | `kaydedilen_kararlar_select_own` / `_insert_own` / `_delete_own` *(update yok — ilişki kaydı değişmez)* | | `auth.uid() = user_id` |
| `notlar` | `notlar_select_own` / `_insert_own` / `_update_own` / `_delete_own` | | `auth.uid() = user_id` |

**Paylaşılan referans tablolar** (`kararlar`, `mevzuat`, `karar_ai_analizleri`,
`karar_mevzuat_atiflari`, `mevzuat_surumleri`):

| Tablo | Policy adı | Komut | Koşul |
|---|---|---|---|
| `kararlar` | `kararlar_select_authenticated` | SELECT | `TO authenticated USING (true)` |
| `mevzuat` | `mevzuat_select_authenticated` | SELECT | aynı |
| `karar_ai_analizleri` | `karar_ai_analizleri_select_authenticated` | SELECT | aynı |
| `karar_mevzuat_atiflari` | `karar_mevzuat_atiflari_select_authenticated` | SELECT | aynı |
| `mevzuat_surumleri` | `mevzuat_surumleri_select_authenticated` | SELECT | aynı (MVP'de boş ama policy hazır) |

**Önemli Supabase-özel netleştirme**: bu tablolarda **`service_role` için ayrı bir yazma policy'si
YAZILMIYOR** — `service_role` anahtarı Supabase'de RLS'i **otomatik bypass eder** (tasarım gereği).
`authenticated`/`anon` için INSERT/UPDATE/DELETE policy'si **tanımlanmadığı için**, RLS'in
varsayılan-red davranışı gereği bu roller için bu işlemler zaten örtük olarak reddedilir — ayrıca
bir "deny" policy yazmaya gerek yok.

**Client'a hiç açılmayacak tablolar** (`karar_embeddingleri`, `entegrasyon_loglari`): RLS **açık**
ama **hiçbir policy tanımlanmıyor** — bu, `service_role` dışında (SELECT dahil) hiçbir erişim
olmaması anlamına gelir, yine RLS'in varsayılan-red davranışıyla, ekstra bir "deny-all" policy
yazmadan.

---

## 12. Trigger Planı

**Ortak `set_updated_at()` fonksiyonu kullanılır** (`002_functions.sql`) — `NEW.updated_at = now();
RETURN NEW;` mantığında, tek bir generic trigger function. Her tablo için ayrı bir fonksiyon
YAZILMAZ (gereksiz tekrar olurdu).

`updated_at` sütunu olan tablolar (bu fonksiyona bağlanır — `007_triggers.sql`): `profiles`,
`muvekkiller`, `dosyalar`, `notlar`, `kararlar`, `mevzuat`, `karar_ai_analizleri`.

`updated_at`'i **olmayan** tablolar (trigger gerekmez — gerekçe §4'te tablo tablo verildi):
`kaydedilen_kararlar`, `karar_embeddingleri`, `karar_mevzuat_atiflari`, `mevzuat_surumleri`,
`entegrasyon_loglari` — hepsi ya append-only ya da doğası gereği değişmez kayıtlar.

---

## 13. Rollback Yaklaşımı

**Bu aşamada** (production verisi henüz yok) rollback basit tutulabilir: her "up" migration'ın
karşılığı olan bir "down" (`DROP TABLE IF EXISTS ... CASCADE`, `DROP FUNCTION`, vb.) **tasarlanabilir**
(bu turda yazılmadı). Ama üç risk kategorisi **ayrıca** vurgulanmalı:

- **`DROP TABLE`**: veri yokken güvenli. **Launch sonrası** (gerçek kullanıcı verisi oluştuktan
  sonra) bu şablon **asla** rutin bir "geri al" adımı olarak kopyalanmamalı — geri dönüşsüz veri
  kaybı riski taşır.
- **CHECK constraint değişiklikleri**: **genişletmek** (yeni değer eklemek) her zaman güvenlidir.
  **Daraltmak** (bir değeri kaldırmak) yalnızca o değeri kullanan **hiçbir satır yoksa** güvenlidir
  — aksi halde constraint validasyonu başarısız olur. Native ENUM'dan kaçınmanın getirdiği asıl
  fayda bu esneklik.
- **Extension kaldırma (`DROP EXTENSION`)**: özellikle `vector` — bu extension kaldırılırsa ona
  bağlı **her şey** (kolon tipi, index) de kaybolur (CASCADE gerektirir). **Bu migration planının
  bir parçası değildir ve rutin bir işlem olarak asla düşünülmemelidir.**

---

## 14. Seed Yaklaşımı

**Migration ile seed kesin olarak ayrılır.** `001`–`008` migration dosyalarının hiçbiri mock/örnek
veri INSERT etmez. Development/staging ortamı için **ayrı bir dosya** (Supabase'in kendi
`supabase/seed.sql` konvansiyonu) düşünülmeli — bu dosya yalnızca lokal/staging'de, migration'lar
bittikten **sonra**, isteğe bağlı çalıştırılır; **production'a asla otomatik uygulanmaz**. Bu
dosyanın **içeriği** bu turun kapsamında tasarlanmadı — yalnızca ayrı bir mekanizma olması
gerektiği netleştirildi.

---

## 15. Migration Sonrası Doğrulama Planı

Durum sütunu Sprint 5C'de (Runtime Test 1-5) güncellendi — detay: `SPRINT_5C_BACKLOG.md`,
kapanış raporu: `SPRINT_5C_KAPANIS_RAPORU.md`.

| # | Kontrol | Nasıl | Durum |
|---|---|---|---|
| 1 | Tablo sayısı | `information_schema.tables`'ta beklenen 12 tablonun tümü var mı | ✅ Tamamlandı (Runtime Test 1 — staging, 12/12) |
| 2 | FK'ler | `information_schema.referential_constraints` ile her FK'nin doğru tabloya, **doğru ON DELETE davranışıyla** (§4 ile birebir) bağlı olduğu | ✅ Tamamlandı (Runtime Test 2 — staging, 14/14) |
| 3 | Unique constraint | `(source, natural_key_hash)`, `(dosya_id, karar_id)`, `(karar_id, model, prompt_version, output_version)`, `(karar_id, model)` — kapsadıkları kolonlar **tam olarak** beklenenle eşleşiyor mu | ✅ Tamamlandı (Runtime Test 3 — staging, 6/6) |
| 4 | RLS açık mı | Her tabloda `pg_class.relrowsecurity = true` — **özellikle** `karar_embeddingleri`/`entegrasyon_loglari`'de yanlışlıkla unutulmadığından emin olunmalı (bu, RLS'siz kalırsa tam açık kalır — kritik test) | ✅ Tamamlandı (Runtime Test 4 — staging, 12/12) |
| 5 | Policy'ler doğru mu | İki farklı test kullanıcısıyla `muvekkiller` üzerinde pozitif ("kendi verimi görüyorum") + negatif ("başkasınınkini göremiyorum") test | ✅ Tamamlandı (Runtime Test 5 — staging, 4/4 PASS; ilk denemede `authenticated` için eksik table-level GRANT bulundu ve `20260808090000_table_grants.sql` ile giderildi, sonra tekrarlanıp doğrulandı) |
| 6 | GIN index var mı | `pg_indexes` ile `arama_vektoru` ve trigram index'lerinin oluştuğu | ⏳ Bekliyor |
| 7 | Vector extension/index | `pg_extension`'da `vector` kurulu, `karar_embeddingleri`'nde `indexdef` içinde `hnsw` geçen bir index var | ⏳ Bekliyor |
| 8 | `auth.uid()` izolasyonu | User A, User B'nin müvekkilini/dosyasını SELECT etmeye çalışır → 0 satır dönmeli | ⏳ Bekliyor |
| 9 | `service_role` davranışı | `service_role` ile `kararlar`'a INSERT **başarılı**; **aynı deneme** `authenticated` ile **başarısız** — ikisi **birlikte** test edilmeli (yalnızca biri yetmez) | ⏳ Bekliyor |

---

## 16. Riskler

- pgvector'ın HNSW desteği ve Postgres'in native `gen_random_uuid()` desteği için **gerçek Supabase
  projesinin sürümü teyit edilmeli** (bu turda bağlanılmadı, varsayımla ilerlendi).
- `simple` full-text config'in Türkçe arama kalitesi için yetersiz kalma riski — MVP sonrası
  kullanıcı geri bildirimiyle `turkish`'e geçiş değerlendirilebilir (tanımlı, additive bir
  iyileştirme).
- HNSW index'in 1M+ embedding ölçeğinde bellek kullanımı — Supabase plan/instance boyutuna göre
  izlenmeli.
- CHECK constraint **daraltma** riski — yalnızca genişletme risksiz, kaldırma veri-bağımlı (§13).
- **Dürüst sınır**: `dimensions`/`vector(1536)` sabit boyut kararı, gelecekte **farklı boyutlu**
  ikinci bir embedding modeline geçişte yeni bir kolon/tablo gerektirecektir — bu pgvector'ın
  endüstri-genelinde bilinen bir kısıtı, bu tasarımın çözemediği (ve çözmeye çalışıp
  over-engineer olmadığı) gerçek bir sınırdır.

---

## 17. Nihai Karar

> **"Bu migration planı doğrudan SQL dosyalarına dönüştürülmeye hazır mı?"**

**Evet, hazır** — üç küçük, ortam-bağımlı teyit dışında (bunlar tasarım BOŞLUĞU değil, SQL yazımı
ANINDA doğrulanacak somut değerlerdir):

1. Gerçek embedding modeli + `dimensions` değeri (`1536` varsayımı teyit edilmeli).
2. Supabase projesinin gerçek Postgres/pgvector sürümü (HNSW + native `gen_random_uuid()` için).
3. `source` CHECK başlangıç listesinin yalnızca `'yargitay'`/`'mevzuat_gov_tr'` olduğu teyidi.

Bu turda `VERI_MODELI.md`'ye göre üç production-hazırlık revizyonu yapıldı (hepsi bu belgede
gerekçeli): `natural_key` artık hash'in yanında ham olarak da saklanıyor (debug edilebilirlik),
`karar_ai_analizleri` UNIQUE'i `output_version`'ı da kapsıyor, `yururluk_durumu` saklanan bir kolon
değil türetilen bir değer. Bu revizyonlar `VERI_MODELI.md`'yi **çelişkiye düşürmüyor** — onu
production seviyesine **inceltiyor**.

Sıradaki adım: gerçek `001`–`008` SQL migration dosyalarının yazılması.
