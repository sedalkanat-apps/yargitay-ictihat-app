# VERI_MODELI.md — Supabase Veri Modeli Tasarımı (Sprint 5B, Adım 1)

Bu belge `VERI_MIMARISI.md`'de alınan kararların (Go/No-Go kapısı, cache/yeniden doğrulama
politikası, kimlik stratejisi, AI veri ayrımı) somut Supabase tablo tasarımıdır. **Kod, SQL,
migration, Edge Function veya repository yazılmamıştır — yalnızca veri modeli tasarımıdır.**
Bir sonraki adımda (SQL migration tasarımı) bu belge referans alınacaktır.

Ölçek varsayımı: `PRD.md`/`ROADMAP.md` kapsamındaki Müvekkil → Dosya → Kaydedilen Kararlar + Notlar
hiyerarşisi (kullanıcı verisi) ile Sprint 5A/5B'nin Yargıtay/mevzuat referans verisi (paylaşılan
veri) burada **tek bir tutarlı şemada** birleştirilir.

---

## 1. Tablolar

### 1.1 `profiles`
*(Kullanıcının istediği `users` tablosunun karşılığı — Supabase'in kendi `auth.users` tablosuyla
karışmaması için `profiles` adlandırılmıştır; bu, Supabase'in standart pratiğidir. `auth.users`
Supabase Auth tarafından yönetilir, biz ona dokunmayız — yalnızca uygulamaya özgü alanları taşıyan
1:1 uzantı tablosu tasarlarız.)*

**Amacı**: Kimlik doğrulama (`auth.users`) ile uygulamaya özgü profil/abonelik önbelleğini ayırmak.

| Alan | Tip | Nullable | Açıklama |
|---|---|---|---|
| `id` | uuid | NOT NULL, PK | `auth.users.id` ile birebir aynı değer (FK) |
| `ad` | text | NULL | Görünen ad (opsiyonel, kayıt sırasında istenmeyebilir) |
| `revenuecat_customer_id` | text | NULL | RevenueCat eşleştirme anahtarı |
| `abonelik_durumu` | text | NULL | `'deneme' \| 'aktif' \| 'gecikmis' \| 'iptal' \| 'yok'` — **RevenueCat'ten webhook ile senkronize edilen önbellek, kaynak-doğruluk RevenueCat'tir**, bu alan yalnızca hızlı okuma için |
| `abonelik_gecerlilik_tarihi` | timestamptz | NULL | Önbellek alanı |
| `created_at` | timestamptz | NOT NULL, DEFAULT now() | |
| `updated_at` | timestamptz | NOT NULL, DEFAULT now() | |

**Unique**: `id` (PK, aynı zamanda tek unique alan).
**Index**: gerekmiyor (tüm erişim `id` üzerinden PK ile).
**FK**: `id` → `auth.users.id`, **ON DELETE CASCADE** (kullanıcı hesabı silinince profil de silinir — "Hesap silme" PRD zorunluluğu ile birebir).
**Update davranışı**: `updated_at` her UPDATE'te yenilenir (trigger — bu turda yazılmadı, yalnızca davranış olarak not edildi).

---

### 1.2 `muvekkiller`

**Amacı**: Kullanıcının kendi müvekkil kayıtları (PRD Bölüm 11 hiyerarşisinin kökü).

| Alan | Tip | Nullable | Açıklama |
|---|---|---|---|
| `id` | uuid | NOT NULL, PK, DEFAULT gen_random_uuid() | Mobil `Muvekkil.id` ile birebir |
| `user_id` | uuid | NOT NULL | Sahip kullanıcı |
| `ad` | text | NOT NULL | |
| `tur` | text | NOT NULL | CHECK `tur IN ('gercek','tuzel')` — mobil `MuvekkilTuru` ile birebir |
| `created_at` | timestamptz | NOT NULL, DEFAULT now() | |
| `updated_at` | timestamptz | NOT NULL, DEFAULT now() | |

**Unique**: yok (aynı kullanıcı aynı adla birden fazla müvekkil açabilir — ör. aynı isimli farklı kişiler).
**Index**: `(user_id)`.
**FK**: `user_id` → `profiles.id`, **ON DELETE CASCADE** (hesap silinince müvekkilleri de silinir).
**Silme davranışı**: kullanıcı bir müvekkili silerse, altındaki tüm `dosyalar` (ve onların altındaki `kaydedilen_kararlar`/`notlar`) **cascade silinir** — hiyerarşinin kök-yaprak ilişkisiyle tutarlı (bkz. §3).

---

### 1.3 `dosyalar`

**Amacı**: Bir müvekkile bağlı dava/iş dosyaları.

| Alan | Tip | Nullable | Açıklama |
|---|---|---|---|
| `id` | uuid | NOT NULL, PK, DEFAULT gen_random_uuid() | Mobil `Dosya.id` ile birebir |
| `muvekkil_id` | uuid | NOT NULL | |
| `user_id` | uuid | NOT NULL | **Denormalize** — bkz. not aşağıda |
| `ad` | text | NOT NULL | |
| `created_at` | timestamptz | NOT NULL, DEFAULT now() | Mobil `olusturmaTarihi` |
| `updated_at` | timestamptz | NOT NULL, DEFAULT now() | |

**Unique**: yok.
**Index**: `(muvekkil_id)`, `(user_id)`.
**FK**: `muvekkil_id` → `muvekkiller.id` **ON DELETE CASCADE**; `user_id` → `profiles.id` **ON DELETE CASCADE**.
**Neden `user_id` denormalize edilir**: RLS politikaları her satırda doğrudan `auth.uid() = user_id`
karşılaştırması yapabilsin diye — `muvekkiller` üzerinden join ile RLS kontrolü büyük tablolarda
performans kaybına yol açar. Bu, Supabase'de yaygın kabul görmüş bir RLS performans desenidir; veri
`muvekkil_id` üzerinden zaten tutarlı tutulur (bir dosya asla müvekkilinden farklı bir kullanıcıya
ait olamaz — bu bütünlük app/trigger seviyesinde garanti edilir, bu turda trigger kodu yazılmadı).

---

### 1.4 `kaydedilen_kararlar`

**Amacı**: Bir dosyaya kaydedilen kararların **yalnızca ilişkisini** taşır (mobil tarafta zaten bu
ilkeyle kurulu — bkz. `mobile/src/types/dosya.ts` yorumu: "Kararın... bilgileri BURADA
KOPYALANMAZ").

| Alan | Tip | Nullable | Açıklama |
|---|---|---|---|
| `id` | uuid | NOT NULL, PK, DEFAULT gen_random_uuid() | Mobil `KaydedilenKarar.id` ile birebir |
| `dosya_id` | uuid | NOT NULL | |
| `user_id` | uuid | NOT NULL | Denormalize (§1.3 ile aynı gerekçe) |
| `karar_id` | uuid | NOT NULL | **Paylaşılan** `kararlar.id`'ye işaret eder — mobil `kararId` ile birebir |
| `kaydedilme_tarihi` | timestamptz | NOT NULL, DEFAULT now() | |

**Unique**: `(dosya_id, karar_id)` — aynı karar aynı dosyaya iki kez kaydedilemez (mobil UX zaten
buna izin vermiyor, veri tabanı düzeyinde de garanti altına alınır). **Not**: aynı karar FARKLI
dosyalara serbestçe kaydedilebilir — PRD'nin "Aynı karar birden fazla dosyaya kaydedilebilir"
maddesiyle birebir; bu UNIQUE kısıt yalnızca `(dosya_id, karar_id)` çiftini sınırlar, `karar_id`
tek başına unique değildir.
**Index**: `(dosya_id)`, `(karar_id)` (ikinci index "bu kararı kaç kullanıcı/dosya kaydetmiş"
sorgusu için — ileride popülerlik/istatistik ihtiyacı doğarsa hazır).
**FK**: `dosya_id` → `dosyalar.id` **ON DELETE CASCADE**; `karar_id` → `kararlar.id` **ON DELETE
RESTRICT** (bir karar, ona referans veren `kaydedilen_kararlar` satırı varken silinemez — zaten
`kararlar` satırları hiçbir zaman gerçekten silinmiyor, yalnızca `status` değişiyor, bkz. §1.6 —
bu RESTRICT teorik bir güvenlik ağıdır).

---

### 1.5 `notlar`

**Amacı**: Bir dosyaya bağlı serbest metin notlar.

| Alan | Tip | Nullable | Açıklama |
|---|---|---|---|
| `id` | uuid | NOT NULL, PK, DEFAULT gen_random_uuid() | Mobil `Not.id` ile birebir |
| `dosya_id` | uuid | NOT NULL | |
| `user_id` | uuid | NOT NULL | Denormalize |
| `metin` | text | NOT NULL | |
| `created_at` | timestamptz | NOT NULL, DEFAULT now() | Mobil `olusturmaTarihi` |
| `updated_at` | timestamptz | NOT NULL, DEFAULT now() | Mobil tipinde yok — **additive** backend alanı, mobil tüketmek zorunda değil |

**Unique**: yok. **Index**: `(dosya_id)`. **FK**: `dosya_id` → `dosyalar.id` **ON DELETE CASCADE**.

---

### 1.6 `kararlar`

**Amacı**: Yargıtay (ve ileride diğer yargı organları) kararlarının **paylaşılan, kullanıcıya ait
olmayan** referans verisi. `VERI_MIMARISI.md` §5.1'deki karardır.

| Alan | Tip | Nullable | Açıklama |
|---|---|---|---|
| `id` | uuid | NOT NULL, PK, DEFAULT gen_random_uuid() | Uygulamanın kendi kalıcı kimliği |
| `source` | text | NOT NULL | `'yargitay'` (ileride `'danistay'`, `'aym'`, ... — bkz. §7) |
| `source_id` | text | NOT NULL | Kaynağın dahili id'si — **güvenilmez, değişebilir** |
| `natural_key_hash` | text | NOT NULL | `daire+esasNo+kararNo+tarih` normalize hash'i |
| `mahkeme` | text | NOT NULL | |
| `daire` | text | NOT NULL | |
| `esas_no` | text | NOT NULL | |
| `karar_no` | text | NOT NULL | |
| `tarih` | date | NOT NULL | (Kaynaktaki `DD.MM.YYYY` string'i normalize edilerek `date` tipine çevrilir) |
| `hukuk_dali` | text | NOT NULL, DEFAULT '' | Kaynak sınıflandırmıyorsa boş kalabilir; mobil `KararOzet.hukukDali` NOT NULL beklediği için DB'de de NOT NULL tutulur |
| `ozet` | text | NULL | Kaynağın kendi kısa özeti (varsa) — **AI özeti değildir**, o `karar_ai_analizleri`'nde |
| `tam_metin` | text | NULL | Tam karar metni |
| `kaynak_ozel_veri` | jsonb | NOT NULL, DEFAULT '{}'::jsonb | **Genişleme sübabı** — bkz. §7 |
| `last_verified_at` | timestamptz | NOT NULL | |
| `status` | text | NOT NULL, DEFAULT 'active' | CHECK `IN ('active','removedFromSource','updated','unverifiable')` |
| `source_content_hash` | text | NOT NULL | |
| `created_at` | timestamptz | NOT NULL, DEFAULT now() | |
| `updated_at` | timestamptz | NOT NULL, DEFAULT now() | |

**Unique**: `(source, natural_key_hash)` — Sprint 5A/5B kimlik stratejisinin temel kısıtı.
**Index**: bkz. §4.
**FK**: yok (bu tablo kök referans verisidir, hiçbir şeye bağlı değil).
**Silme davranışı**: **hiçbir zaman DELETE edilmez** (`VERI_MIMARISI.md` §3.1) — yalnızca `status`
güncellenir. Uygulama seviyesinde DELETE komutu bu tabloya hiç yazılmaz (RLS ile de service_role
dışında hiç kimseye DELETE izni verilmez, bkz. §2).
**Update davranışı**: yeniden doğrulama job'ı `tam_metin`/`ozet`/`status`/`last_verified_at`/
`source_content_hash` alanlarını günceller; `id`, `source`, `natural_key_hash` **hiçbir zaman**
UPDATE edilmez (kimliğin sabitliği bu alanların değişmezliğine dayanır).

---

### 1.7 `mevzuat`

**Amacı**: mevzuat.gov.tr'nin paylaşılan referans verisi. `mevzuat_maddesi` düzeyinde değil, MVP'de
**belge düzeyinde** tutulur (bkz. §7 — madde düzeyi ileride ayrı bir çocuk tablo olarak eklenebilir).

| Alan | Tip | Nullable | Açıklama |
|---|---|---|---|
| `id` | uuid | NOT NULL, PK, DEFAULT gen_random_uuid() | |
| `source` | text | NOT NULL | `'mevzuat'` |
| `source_id` | text | NOT NULL | Kaynağın `MevzuatNo+MevzuatTur+MevzuatTertip` üçlüsünden türetilir |
| `natural_key_hash` | text | NOT NULL | Aynı üçlünün normalize hash'i |
| `mevzuat_turu` | text | NOT NULL | Kanun/yönetmelik/tebliğ/... |
| `mevzuat_no` | text | NOT NULL | |
| `ad` | text | NOT NULL | |
| `tam_metin` | text | NULL | |
| `kaynak_ozel_veri` | jsonb | NOT NULL, DEFAULT '{}'::jsonb | Genişleme sübabı (§7) |
| `effective_from` | date | NULL | |
| `effective_to` | date | NULL | |
| `last_verified_at` | timestamptz | NOT NULL | |
| `status` | text | NOT NULL, DEFAULT 'active' | Aynı 4 durum (`kararlar` ile tutarlı) |
| `source_content_hash` | text | NOT NULL | |
| `created_at` | timestamptz | NOT NULL, DEFAULT now() | |
| `updated_at` | timestamptz | NOT NULL, DEFAULT now() | |

**Unique**: `(source, natural_key_hash)`. **Index**: bkz. §4. **FK**: yok.
**Silme/Update davranışı**: `kararlar` ile birebir aynı ilke (hiç DELETE yok, yalnızca `status`).

---

### 1.8 `mevzuat_surumleri`

**Amacı**: `VERI_MIMARISI.md` §3.2 — **MVP'de doldurulmaz**, yalnızca şema hazır tutulur.

| Alan | Tip | Nullable | Açıklama |
|---|---|---|---|
| `id` | uuid | NOT NULL, PK, DEFAULT gen_random_uuid() | |
| `mevzuat_id` | uuid | NOT NULL | |
| `tam_metin` | text | NOT NULL | O dönem yürürlükteki metnin anlık görüntüsü |
| `effective_from` | date | NOT NULL | |
| `effective_to` | date | NULL | |
| `created_at` | timestamptz | NOT NULL, DEFAULT now() | |

**Unique**: yok (aynı mevzuatın birden fazla geçmiş sürümü olması beklenir). **Index**:
`(mevzuat_id, effective_from)`. **FK**: `mevzuat_id` → `mevzuat.id` **ON DELETE CASCADE**.
**Not**: bu tablo MVP'de hiç satır almaz; varlığı yalnızca ileride sürümleme açılırsa
`mevzuat`/`MevzuatRepository` şemasının kırılmamasını garanti eder.

---

### 1.9 `karar_ai_analizleri`

**Amacı**: `VERI_MIMARISI.md` §5.2 — kararın AI ile üretilmiş özet/analiz katmanı, kaynak veriden
ayrı.

| Alan | Tip | Nullable | Açıklama |
|---|---|---|---|
| `id` | uuid | NOT NULL, PK, DEFAULT gen_random_uuid() | |
| `karar_id` | uuid | NOT NULL | |
| `model` | text | NOT NULL | |
| `prompt_version` | text | NOT NULL | |
| `output_version` | text | NOT NULL | |
| `ozet` | text | NULL | |
| `anahtar_kavramlar` | text[] | NULL | |
| `hukuk_dali` | text | NULL | AI'ın kendi sınıflandırması — `kararlar.hukuk_dali`'dan **bağımsız/tamamlayıcı** |
| `atif_yapilan_mevzuat` | jsonb | NULL | Hızlı gösterim için denormalize özet — ilişkisel/sorgulanabilir hali `karar_mevzuat_atiflari`'ndadır (bkz. §1.11, entity/read-model ayrımı) |
| `status` | text | NOT NULL, DEFAULT 'generating' | CHECK `IN ('fresh','stale','generating','failed')` |
| `error` | text | NULL | |
| `source_content_hash_at_generation` | text | NOT NULL | §5.3 bayatlama mekanizması |
| `created_at` | timestamptz | NOT NULL, DEFAULT now() | |
| `updated_at` | timestamptz | NOT NULL, DEFAULT now() | |

**Unique**: `(karar_id, model, prompt_version)` — aynı model+prompt sürümüyle bir kararın yalnızca
bir analizi olur; **yeni bir `prompt_version` yeni bir satır oluşturur** (üzerine yazmaz), böylece
prompt geçmişi/provenance korunur.
**Index**: `(karar_id)`, `(status)` (yeniden doğrulama job'ının "stale olanları bul" sorgusu için).
**FK**: `karar_id` → `kararlar.id` **ON DELETE CASCADE** (karar hiç silinmediği için pratikte hiç
tetiklenmez, ama şema bütünlüğü için tanımlıdır).
**Update davranışı**: `status`/`error`/`updated_at` güncellenir; içerik alanları (`ozet` vb.)
yalnızca yeni bir üretim tamamlandığında güncellenir (aynı satır üzerinde, aynı
`(karar_id,model,prompt_version)` için — versiyon değişmediği sürece üretim tekrarı bu satırı YENİLER).

---

### 1.10 `karar_embeddingleri`

**Amacı**: Semantik arama için embedding vektörleri — **ayrı tablo**, kaynak metinden bağımsız
yeniden üretilebilir.

| Alan | Tip | Nullable | Açıklama |
|---|---|---|---|
| `id` | uuid | NOT NULL, PK, DEFAULT gen_random_uuid() | |
| `karar_id` | uuid | NOT NULL | |
| `model` | text | NOT NULL | |
| `embedding` | vector(N) *(pgvector uzantısı)* | NOT NULL | Boyut (N) modele göre sabitlenir (ör. 1536) |
| `source_content_hash_at_generation` | text | NOT NULL | |
| `created_at` | timestamptz | NOT NULL, DEFAULT now() | |

**Unique**: `(karar_id, model)` — aynı model için tek embedding; yeniden üretimde bu satırın
ÜZERİNE yazılır (embedding'in geçmişini tutmanın `karar_ai_analizleri`'nin aksine bir değeri yok —
yalnızca en güncel vektör anlamlıdır).
**Index**: `(karar_id)` (B-tree, klasik lookup) + pgvector'ın kendi yaklaşık en-yakın-komşu
index'i (ivfflat/hnsw) `embedding` sütunu üzerinde (bkz. §4).
**FK**: `karar_id` → `kararlar.id` **ON DELETE CASCADE**.

---

### 1.11 `karar_mevzuat_atiflari`

**Amacı**: Bir kararın hangi mevzuat maddelerine atıf yaptığının **ilişkisel/sorgulanabilir**
kaydı — `karar_ai_analizleri.atif_yapilan_mevzuat` (jsonb) alanının "hızlı gösterim" kopyasının
aksine, bu tablo gerçek FK ile "bu maddeye hangi kararlar atıf yapmış" gibi ters sorguları
destekler (entity/read-model ayrımı ilkesi — Feature 4.1'de kurulan desenle tutarlı).

| Alan | Tip | Nullable | Açıklama |
|---|---|---|---|
| `id` | uuid | NOT NULL, PK, DEFAULT gen_random_uuid() | |
| `karar_id` | uuid | NOT NULL | |
| `mevzuat_id` | uuid | **NULL** | Atıf yapılan mevzuat henüz `mevzuat` tablosunda yoksa boş kalır (bkz. not) |
| `mevzuat_ad_ham` | text | NOT NULL | Kaynaktan/AI'dan gelen ham atıf metni (ör. "6098 sayılı TBK m.49") — `mevzuat_id` çözülemese bile bu her zaman dolu |
| `madde_no` | text | NULL | |
| `kaynak` | text | NOT NULL | CHECK `IN ('AI','manuel')` |
| `created_at` | timestamptz | NOT NULL, DEFAULT now() | |

**Neden `mevzuat_id` nullable**: karar ingestion'ı ile mevzuat ingestion'ı bağımsız/farklı zamanlı
süreçlerdir — bir karar, henüz bizim `mevzuat` tablomuza girmemiş bir kanuna atıf yapabilir. Katı
bir NOT NULL FK bu durumda atfın hiç kaydedilememesine yol açardı. `mevzuat_id` boş bırakılır,
ilgili mevzuat ileride ingest edildiğinde bir arka plan işiyle **geri doldurulabilir** (backfill) —
bu turda bu job yazılmadı, yalnızca alan bunu mümkün kılacak şekilde tasarlandı.
**Unique**: `(karar_id, mevzuat_ad_ham, madde_no)` — aynı atfın tekrar tekrar eklenmesini önler.
**Index**: `(karar_id)`, `(mevzuat_id)` (ikisi de sorgu yönü, yukarıda açıklandı).
**FK**: `karar_id` → `kararlar.id` **ON DELETE CASCADE**; `mevzuat_id` → `mevzuat.id` **ON DELETE
SET NULL** (mevzuat kaydı bir gün gerçekten silinirse — ki normalde silinmez — atıf kaydı
kaybolmaz, yalnızca çözümü boşa düşer).

---

### 1.12 `entegrasyon_loglari` *(ek tablo önerisi)*

**Amacı**: Sprint 5B backlog'unda zaten kararlaştırılan "her kaynak isteğinin loglanması"
ihtiyacını karşılayan operasyonel tablo — şema/erişim değişikliğinin erken tespiti için.

| Alan | Tip | Nullable | Açıklama |
|---|---|---|---|
| `id` | uuid | NOT NULL, PK, DEFAULT gen_random_uuid() | |
| `source` | text | NOT NULL | `'yargitay' \| 'mevzuat'` |
| `islem` | text | NOT NULL | `'arama' \| 'detay' \| 'yeniden_dogrulama'` |
| `basarili` | boolean | NOT NULL | |
| `http_durumu` | integer | NULL | |
| `gecikme_ms` | integer | NULL | |
| `hata_mesaji` | text | NULL | |
| `created_at` | timestamptz | NOT NULL, DEFAULT now() | |

**Unique**: yok. **Index**: `(created_at)`, `(source, basarili)`. **FK**: yok (bağımsız log tablosu).
**Silme davranışı**: bu tabloda **retention politikası önerilir** (ör. 90 gün sonrası otomatik
temizlik) — sınırsız büyümesin diye; bu turda bir job olarak yazılmadı, yalnızca öneridir.

*(Değerlendirilip MVP'ye dahil edilmeyen ek tablo adayları: `abonelik_olaylari` — RevenueCat
webhook geçmişi, `profiles.abonelik_durumu` önbelleği MVP için yeterli görüldüğü için şimdilik
eklenmedi, event-history ihtiyacı doğarsa additive olarak eklenebilir. `mevzuat_maddeleri` — madde
düzeyi granülerlik MVP'de yok, bkz. §7.)*

---

## 2. RLS (Row Level Security)

| Tablo | Kapsam | Politika |
|---|---|---|
| `profiles` | Kullanıcıya özel | SELECT/UPDATE: `auth.uid() = id`. INSERT: yalnızca kayıt (signup) akışıyla, `auth.uid() = id`. DELETE: yok (hesap silme `auth.users` DELETE'i ile cascade olur, tabloya doğrudan DELETE yazılmaz). `abonelik_*` alanlarının webhook'tan güncellenmesi **service_role** ile yapılır. |
| `muvekkiller` | Kullanıcıya özel | SELECT/INSERT/UPDATE/DELETE: `auth.uid() = user_id`. |
| `dosyalar` | Kullanıcıya özel | Aynı: `auth.uid() = user_id`. |
| `kaydedilen_kararlar` | Kullanıcıya özel | Aynı: `auth.uid() = user_id`. |
| `notlar` | Kullanıcıya özel | Aynı: `auth.uid() = user_id`. |
| `kararlar` | **Paylaşılan/ortak** | SELECT: `authenticated` rolüne açık (herkes aynı veriyi okur). INSERT/UPDATE/DELETE: yalnızca **service_role** (Edge Function) — hiçbir client doğrudan yazamaz. |
| `mevzuat` | Paylaşılan/ortak | `kararlar` ile birebir aynı desen. |
| `mevzuat_surumleri` | Paylaşılan/ortak | `kararlar` ile birebir aynı desen (MVP'de boş olsa da politika baştan tanımlı). |
| `karar_ai_analizleri` | Paylaşılan/ortak | SELECT: `authenticated`. Yazma: yalnızca **service_role** (AI üretim pipeline'ı). |
| `karar_embeddingleri` | **Yalnızca service_role** | SELECT dahil hiçbir işlem `authenticated`'a açık değil — embedding hiçbir zaman client'a sızmaz, yalnızca backend'in benzerlik aramasında kullanılır. |
| `karar_mevzuat_atiflari` | Paylaşılan/ortak | SELECT: `authenticated`. Yazma: yalnızca **service_role**. |
| `entegrasyon_loglari` | **Yalnızca service_role** | Hiçbir client erişimi yok (SELECT dahil) — saf operasyonel/iç tablo. |

Ortak ilke: **hiçbir tabloda `anon` rolüne (giriş yapmamış kullanıcı) erişim yoktur** — PRD'nin
MVP kapsamı zorunlu kayıt/giriş öngörüyor (bkz. `PRD.md` Bölüm 8), anonim tarama yok.

---

## 3. İlişkiler (ER şeması — metin)

İki ayrı, birbirine köprüyle bağlı alt-graf vardır: **kullanıcı verisi ağacı** (RLS: kullanıcıya
özel) ve **paylaşılan referans veri ağacı** (RLS: herkese salt-okunur). Köprü tek yönlüdür:
`kaydedilen_kararlar.karar_id → kararlar.id`.

```
auth.users (Supabase yönetimli)
  └─(1:1, id)── profiles
                   └─(1:N, user_id)── muvekkiller
                                         └─(1:N, muvekkil_id)── dosyalar
                                                                  ├─(1:N, dosya_id)── notlar
                                                                  └─(1:N, dosya_id)── kaydedilen_kararlar
                                                                                          │
                                                                                          │ (N:1, karar_id)
                                                                                          ▼
                                              ╔═══════════ PAYLAŞILAN REFERANS VERİ ═══════════╗
                                              ║  kararlar                                       ║
                                              ║    ├─(1:N, karar_id)── karar_ai_analizleri       ║
                                              ║    ├─(1:N, karar_id)── karar_embeddingleri        ║
                                              ║    └─(1:N, karar_id)── karar_mevzuat_atiflari      ║
                                              ║                              │ (N:1, mevzuat_id, nullable)
                                              ║                              ▼                     ║
                                              ║                          mevzuat                    ║
                                              ║                            └─(1:N, mevzuat_id)──     ║
                                              ║                                mevzuat_surumleri      ║
                                              ╚═════════════════════════════════════════════════════╝

entegrasyon_loglari — bağımsız, hiçbir tabloya FK ile bağlı değil (yalnızca `source` alanıyla mantıksal ilişki)
```

Kullanıcının örnek şemasıyla karşılaştırma: `Users → Müvekkiller → Dosyalar → Kaydedilen Kararlar →
Kararlar → AI Analizleri` zinciri birebir korunmuştur; tek fark, `Kararlar`dan sonrasının
kullanıcıdan bağımsız, paylaşılan bir alt-graf olarak ayrılmasıdır (bu, Sprint 4B'de kurulan
"aynı kararın birden fazla dosyaya kaydedilebilmesi" ve Sprint 5A/5B'nin "veri tekrarı olmasın"
ilkelerinin doğrudan sonucudur).

---

## 4. Index Stratejisi

| Tablo.Index | Neden | Hangi sorguyu hızlandırır |
|---|---|---|
| `kararlar (source, natural_key_hash)` UNIQUE | Duplicate önleme + kimlik stratejisinin temeli | Senkronizasyon sırasında "bu karar zaten var mı" upsert lookup'u |
| `kararlar (source, source_id)` | Kaynaktan yeniden çekerken hızlı eşleme | "Bu `sourceId` hangi kaydımıza karşılık geliyor" |
| `kararlar (last_verified_at)` | TTL taraması | "30 günden eski kayıtları bul" (yeniden doğrulama job'ı) |
| `kararlar (status) WHERE status <> 'active'` (kısmi index) | Dikkat gerektiren kayıtları izleme | "removedFromSource/unverifiable/updated durumundakileri listele" — küçük, ucuz bir index (çoğu satır `active` olacağından kısmi index tam tablo taramasından çok daha küçük kalır |
| `kararlar` GIN (tsvector: `tam_metin` + `ozet`) | **Kritik** — uygulamanın temel işlevi arama | Tam metin arama (Sonuçlar/Ara ekranı) |
| `kararlar (mahkeme, daire)` | Filtre bazlı arama | Sonuçlar ekranındaki "Daire" filtre chip'i |
| `mevzuat (source, natural_key_hash)` UNIQUE, `(source, source_id)`, `(last_verified_at)`, GIN(`tam_metin`) | `kararlar` ile birebir aynı gerekçeler | Aynı sorgu türleri, mevzuat için |
| `karar_ai_analizleri (karar_id, model, prompt_version)` UNIQUE | Duplicate önleme | "Bu karar+model+prompt kombinasyonu için analiz var mı" |
| `karar_ai_analizleri (status)` | Bayatlama taraması | "stale olan analizleri bul, yeniden üret" |
| `karar_embeddingleri (karar_id, model)` UNIQUE | Duplicate önleme | Model başına tek embedding garantisi |
| `karar_embeddingleri (embedding)` pgvector ANN index (ivfflat/hnsw) | **Semantik arama** — klasik B-tree değil, yaklaşık en-yakın-komşu | "Konu özetiyle birebir ara" (PRD MVP maddesi) — anlam benzerliğine göre sıralama |
| `karar_mevzuat_atiflari (karar_id)`, `(mevzuat_id)` | Çift yönlü sorgu | "Bu karar neye atıf yapmış" / "Bu maddeye kim atıf yapmış" |
| `muvekkiller (user_id)` | RLS + liste ekranı | "Bu kullanıcının müvekkilleri" |
| `dosyalar (muvekkil_id)`, `(user_id)` | RLS + liste ekranı | "Bu müvekkilin dosyaları" / RLS satır filtresi |
| `kaydedilen_kararlar (dosya_id)`, `(karar_id)`, UNIQUE`(dosya_id, karar_id)` | Liste + duplicate önleme + ters sorgu | "Bu dosyaya kaydedilenler" / "Bu karar kaç kez kaydedilmiş" |
| `notlar (dosya_id)` | Liste ekranı | "Bu dosyanın notları" |
| `entegrasyon_loglari (created_at)`, `(source, basarili)` | İzleme/dashboard | Zaman bazlı ve kaynak/başarı bazlı log sorguları |

---

## 5. Hash ve Kimlik — Tablo Dağılımı

| Alan | Bulunduğu tablo(lar) |
|---|---|
| `id` (uygulama içi UUID) | Her tabloda PK olarak — `kararlar.id`, `mevzuat.id` dahil hepsi |
| `source` | `kararlar`, `mevzuat` |
| `source_id` | `kararlar`, `mevzuat` |
| `natural_key_hash` | `kararlar`, `mevzuat` (kaynak-özel `naturalKey` hesaplama mantığı backend'de yaşar, yalnızca **hash sonucu** DB'de tutulur — ham `naturalKey` string'i tabloya YAZILMAZ, yalnızca hash'i; bu, gereksiz veri tekrarını ve alan-değişimi hassasiyetini azaltır) |
| `sourceContentHash` | `kararlar.source_content_hash`, `mevzuat.source_content_hash` |
| `sourceContentHashAtGeneration` | `karar_ai_analizleri`, `karar_embeddingleri` |

Kullanıcı verisi tablolarında (`muvekkiller`, `dosyalar`, `kaydedilen_kararlar`, `notlar`) bu
alanlardan hiçbiri **yoktur** — onlar zaten kendi UUID `id`'leriyle kimliklenir, kaynak-bağımlı
değildir (Sprint 4B kararı, değişmedi).

---

## 6. Performans Değerlendirmesi (100k / 500k / 1M karar)

| Tablo | 100k karar | 500k karar | 1M karar | Not |
|---|---|---|---|---|
| `kararlar` | ~1-3 GB (tam metin ortalama 10-30KB varsayımıyla) | ~5-15 GB | ~10-30 GB | Postgres TOAST büyük `text` alanlarını otomatik sıkıştırır/ayrı saklar; tek başına sorun değil |
| GIN full-text index (`kararlar`) | Birkaç yüz MB | ~1-3 GB | ~2-6 GB | İndeks boyutu veriyle orantılı büyür — Supabase compute/disk planı buna göre seçilmeli |
| `karar_embeddingleri` | ~0.6 GB (1536 boyut × 4 byte × 100k) | ~3 GB | ~6 GB | + pgvector ANN index overhead'i (kabaca vektör verisiyle aynı mertebede) — bu tablo en dikkat gerektiren |
| `karar_ai_analizleri` | Küçük (metin alanları) | Orta | Orta-büyük | Model/prompt versiyonu arttıkça (tarihçe tutulduğu için) satır sayısı `kararlar`'ın katı olabilir |
| `karar_mevzuat_atiflari` | ~2-5x `kararlar` satır sayısı (bir karar birden fazla maddeye atıf yapabilir) | Aynı oran | Aynı oran | Postgres için önemsiz — milyonlarca satırlı ilişkisel tablolar rutindir |
| `muvekkiller`/`dosyalar`/`kaydedilen_kararlar`/`notlar` | Kullanıcı sayısına bağlı, **karar korpusundan bağımsız** | Aynı | Aynı | Bu tablolar karar korpusu büyüse de büyümez — aktif kullanıcı sayısıyla orantılı, çok daha küçük kalması beklenir |

**Partition gerekli mi?** **Hayır, bu ölçekte gerekmez.** Postgres tek tabloda düzgün index'lenmiş
onlarca milyon satırı rahatça kaldırır; 1M satır bu eşiğin çok altındadır. Partitioning genellikle
10M+ satır veya zaman-bazlı doğal sorgu deseni (ör. "yalnızca son 1 yılın loglarını tara") olduğunda
anlamlı hale gelir — `entegrasyon_loglari` ileride bu ikinci kategoriye girebilir (zaman bazlı
partition + retention), ama `kararlar`/`mevzuat` için 1M satırda gerekmez.

Eğer ileride (Danıştay/AYM/BAM/KİK/EPDK eklenip) toplam satır sayısı 5-10M'yi aşarsa: `kararlar`
tablosu `source` alanına göre partition edilebilir — bu, **fiziksel bir operasyon** olur, mantıksal
şema/`KararRepository` sözleşmesi değişmez (uygulama sorguları aynı kalır). Bugünden partition
kurmak, bu ölçekte gereksiz operasyonel karmaşıklık olurdu (Solo Founder ilkesi — CLAUDE.md §11).

---

## 7. Future-proof: Danıştay, AYM, BAM, KİK, EPDK Eklendiğinde

| Tablo | Değişir mi? | Açıklama |
|---|---|---|
| `kararlar` | **Değişmeden kullanılabilir** | `source` alanına yeni değer eklenir (additive CHECK genişletmesi). `mahkeme`/`daire`/`esas_no`/`karar_no`/`tarih` şeması tüm yargı organları için yeterince geneldir. Kaynağa özgü ek bilgi gerekirse (`kaynak_ozel_veri jsonb`) **şema değişmeden** saklanır — bu alan tam bu senaryo için baştan eklendi. |
| `mevzuat` | **Değişmeden kullanılabilir** | KİK/EPDK gibi düzenleyici kurumların tebliğ/yönetmelikleri de aynı tür/no/ad yapısına oturur; aynı `kaynak_ozel_veri` sübabı geçerli. |
| `karar_ai_analizleri`, `karar_embeddingleri`, `karar_mevzuat_atiflari` | **Değişmeden kullanılabilir** | Tümü `karar_id` FK'sine bağlı; kararın hangi kaynaktan geldiği bu tablolar için görünmez. |
| `naturalKey` hesaplama mantığı *(kod, tablo değil)* | **Genişler** | AYM "başvuru no" gibi Yargıtay'dan farklı bir doğal anahtar kavramına sahip olabilir — bu, backend'deki normalize/hash fonksiyonunun kaynak-türüne göre dallanmasıyla çözülür; `natural_key_hash` sütununun kendisi (tek bir hash string'i) **değişmez**. |
| `mevzuat_surumleri` | **Değişmeden kullanılabilir** | Zaten kaynak-bağımsız tasarlandı. |
| `muvekkiller`/`dosyalar`/`kaydedilen_kararlar`/`notlar` | **Hiç etkilenmez** | Kullanıcı verisi, kaynak sayısından tamamen izole. |
| `entegrasyon_loglari` | **Değişmeden kullanılabilir** | `source` alanı zaten serbest metin. |

**Genişleyecek olan tek şey**: `source` CHECK listesi (additive) ve normalize/ingestion **kodu**
(bu belgenin kapsamı dışında) — hiçbiri mevcut tabloları, mevcut satırları veya `KararRepository`/
`MevzuatRepository` sözleşmesini bozmaz.

---

## 8. Nihai Değerlendirme

> **"Bu veri modeliyle en az 5 yıl boyunca breaking change yaşamadan devam edebilir miyiz?"**

**Evet.** Gerekçe:

1. **Kaynak genişlemesi additive'dir**: yeni yargı organı/kurum eklemek `source` enum'una değer
   eklemek + `kaynak_ozel_veri jsonb` sübabını kullanmaktır — mevcut satırlar, sorgular, repository
   sözleşmesi bozulmaz. Bu jsonb alanı bu turda **bilinçli olarak eklendi** çünkü onsuz, her yeni
   kaynağın kendine özgü bir alanı (ör. AYM "başvuru no"su) yeni bir NOT NULL olmayan sütun eklemeyi
   gerektirebilirdi — additive olsa da, sık sık şema değişikliği anlamına gelirdi. jsonb sübabıyla bu
   ihtiyacın büyük kısmı hiç şema değişikliği gerektirmeden karşılanır.
2. **AI katmanı kaynak veriden zaten ayrık**: yeni bir AI özelliği (ör. "çoklu karar özeti" — PRD
   MVP maddesi) yeni bir tablo veya `karar_ai_analizleri`'ne yeni bir `output_version` satırı olarak
   eklenir; `kararlar` tablosuna hiç dokunulmaz.
3. **Mevzuat sürümleme önceden iskeletlenmiş**: `mevzuat_surumleri` boş ama var — tam sürüm geçmişi
   ihtiyacı doğduğunda yalnızca doldurulmaya başlanır, şema kırılmaz.
4. **Kullanıcı verisi ve referans veri baştan izole**: `Kararlar`'dan sonrası tamamen kaynaktan
   bağımsız paylaşılan bir alt-graf; `Müvekkil→Dosya→...` zinciri buna yalnızca tek bir FK
   (`kaydedilen_kararlar.karar_id`) ile bağlı. Birinde yapılacak bir değişiklik diğerini hiç
   etkilemez.
5. **Kimlik stratejisi kaynağın kırılganlığına karşı zaten dayanıklı**: `sourceId` değişse bile
   `naturalKeyHash` eşleşmesi sayesinde uygulamanın kendi `id`'si ve tüm ilişkiler sabit kalır —
   kaynak tarafındaki bir değişiklik hiçbir zaman bizim şemamıza "breaking" olarak yansımaz.
6. **Ölçek, 5 yıllık ufukta partition/breaking-change gerektirmeyecek düzeyde**: §6'da gösterildiği
   gibi 1M satırda bile klasik indexli Postgres yeterli; gerçek korpus (Yargıtay + birkaç ek kaynak)
   bu eşiğin makul bir katı kadar büyüse dahi partition'a geçiş **fiziksel** bir operasyondur,
   mantıksal şemayı bozmaz.

**Tek dürüstçe belirtilmesi gereken sınır**: bu güven, "şema düzeyinde" breaking change'e karşıdır.
Bir kaynağın veri kalitesi/yapısı **kavramsal olarak** mevcut alanlara hiç oturmayacak kadar farklı
çıkarsa (ör. bir kurumun kararlarında "esas no" kavramı hiç yoksa) — bu durumda dahi tablo şeması
kırılmaz (`esas_no` NOT NULL DEFAULT '' ile boş bırakılabilir, gerçek veri `kaynak_ozel_veri`'ye
gider), ama normalize/ingestion **kodu** o kaynak için özel bir dal gerektirir. Bu, veri modelinin
değil, ingestion mantığının genişlemesidir — bu belgenin "breaking change yok" iddiasını geçersiz
kılmaz.

---

## 9. Bu turda yapılmayanlar (net)

Kod, SQL, migration, Edge Function, repository, mobil dosya değişikliği yazılmadı. Bu belge yalnızca
tasarımdır. Sıradaki adım (kullanıcının belirttiği gibi) SQL migration tasarımıdır.
