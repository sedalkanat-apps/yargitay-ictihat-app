-- 005_ai_tables.sql
-- Bkz. MIGRATION_PLAN.md §7, §9.
--
-- Kaynak verisi (kararlar/mevzuat) ile AI üretimleri kesin olarak ayrı tutulur --
-- hiçbir AI alanı kararlar/mevzuat tablolarına yazılmaz (VERI_MIMARISI.md §5).

-- ============================================================================
-- karar_ai_analizleri
-- ============================================================================

create table public.karar_ai_analizleri (
  id uuid primary key default gen_random_uuid(),
  karar_id uuid not null references public.kararlar (id) on delete cascade,

  model text not null,
  prompt_version text not null,
  output_version text not null,

  ozet text,
  anahtar_kavramlar text[],
  hukuk_dali text,
  atif_yapilan_mevzuat jsonb,

  source_content_hash_at_generation text not null,

  status text not null default 'generating',
  error text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint karar_ai_analizleri_status_check check (
    status in ('fresh', 'stale', 'generating', 'failed')
  ),
  constraint karar_ai_analizleri_model_not_blank check (btrim(model) <> ''),
  constraint karar_ai_analizleri_prompt_version_not_blank check (btrim(prompt_version) <> ''),
  constraint karar_ai_analizleri_output_version_not_blank check (btrim(output_version) <> '')
);

comment on table public.karar_ai_analizleri is
  'Kararların AI ile üretilmiş özet/analiz katmanı. hukuk_dali burada kararlar.hukuk_dali''dan bağımsız/tamamlayıcıdır (AI''ın kendi sınıflandırması). atif_yapilan_mevzuat hızlı-gösterim amaçlı denormalize kopyadır; ilişkisel/sorgulanabilir hali karar_mevzuat_atiflari''dadır.';

comment on column public.karar_ai_analizleri.source_content_hash_at_generation is
  'Üretim anındaki kararlar.source_content_hash değeri. kararlar.source_content_hash bundan farklılaşırsa bu analiz stale sayılır (VERI_MIMARISI.md §5.3).';

-- VERI_MODELI.md''den revizyon: unique kısıt output_version''ı da kapsıyor -- prompt_version
-- ve output_version bağımsız eksenlerdir (MIGRATION_PLAN.md §7).
alter table public.karar_ai_analizleri
  add constraint karar_ai_analizleri_unique_generation
  unique (karar_id, model, prompt_version, output_version);

create index karar_ai_analizleri_karar_id_idx on public.karar_ai_analizleri (karar_id);
create index karar_ai_analizleri_stale_partial_idx on public.karar_ai_analizleri (status)
  where status = 'stale';


-- ============================================================================
-- karar_embeddingleri
-- ============================================================================
--
-- DİKKAT -- embedding boyutu kararı (bu migration'ın kapanış raporunda ayrıca
-- vurgulanmıştır): embedding modeli HENÜZ SEÇİLMEDİ. pgvector'ın `vector(N)` tipi
-- kolon düzeyinde SABİT bir boyut gerektirir; gerçek bir sayı (ör. 1536) UYDURMAMAK
-- için `embedding` sınırsız boyutlu (parantezsiz `vector`) olarak tanımlanmıştır.
-- Bu, migration'ın GEÇERLİ ve UYGULANABİLİR kalmasını sağlar; yalnızca ANN index'i
-- (HNSW) bu turda OLUŞTURULMAMIŞTIR -- sabit boyut gerektirir.
--
-- Model seçildiğinde YENİ bir migration ile:
--   adim 1: alter table public.karar_embeddingleri alter column embedding type extensions.vector(N);
--   adim 2: create index karar_embeddingleri_embedding_hnsw_idx on public.karar_embeddingleri
--           using hnsw (embedding extensions.vector_cosine_ops);
-- uygulanmalıdır (MIGRATION_PLAN.md §9 -- HNSW kararı hâlâ geçerli, yalnızca N bekleniyor).

create table public.karar_embeddingleri (
  id uuid primary key default gen_random_uuid(),
  karar_id uuid not null references public.kararlar (id) on delete cascade,

  model text not null,
  embedding extensions.vector not null,
  dimensions integer generated always as (extensions.vector_dims(embedding)) stored,

  source_content_hash_at_generation text not null,
  created_at timestamptz not null default now(),

  constraint karar_embeddingleri_model_not_blank check (btrim(model) <> '')
);

comment on table public.karar_embeddingleri is
  'Semantik arama için embedding vektörleri -- kaynak metinden bağımsız yeniden üretilebilir. Client''a asla açılmaz (bkz. 008_rls.sql). embedding boyutu henüz sabitlenmedi -- yukarıdaki nota bakın.';

comment on column public.karar_embeddingleri.dimensions is
  'embedding''den türetilen boyut -- ayrıca saklanmaz, her zaman vector_dims(embedding) ile tutarlıdır.';

alter table public.karar_embeddingleri
  add constraint karar_embeddingleri_karar_model_key unique (karar_id, model);

create index karar_embeddingleri_karar_id_idx on public.karar_embeddingleri (karar_id);

-- NOT: HNSW vektör benzerlik index'i bilinçli olarak BURADA OLUŞTURULMADI -- yukarıdaki nota bakın.


-- ============================================================================
-- karar_mevzuat_atiflari
-- ============================================================================

create table public.karar_mevzuat_atiflari (
  id uuid primary key default gen_random_uuid(),
  karar_id uuid not null references public.kararlar (id) on delete cascade,
  mevzuat_id uuid references public.mevzuat (id) on delete set null,

  mevzuat_ad_ham text not null,
  madde_no text,
  kaynak text not null,

  created_at timestamptz not null default now(),

  constraint karar_mevzuat_atiflari_kaynak_check check (kaynak in ('AI', 'manuel')),
  constraint karar_mevzuat_atiflari_ad_ham_not_blank check (btrim(mevzuat_ad_ham) <> '')
);

comment on column public.karar_mevzuat_atiflari.mevzuat_id is
  'Atıf yapılan mevzuat henüz mevzuat tablosunda yoksa NULL kalır; mevzuat_ad_ham her zaman doludur. İleride bir arka plan işiyle geri doldurulabilir (VERI_MODELI.md §1.11).';

-- madde_no NULL olabildiği için düz UNIQUE kısıt NULL'ları "farklı" sayardı (Postgres
-- semantiği) -- coalesce ile bu boşluk kapatılıyor (MIGRATION_PLAN.md'nin küçük bir
-- NULL-güvenliği inceltmesi).
create unique index karar_mevzuat_atiflari_unique_atif_idx
  on public.karar_mevzuat_atiflari (karar_id, mevzuat_ad_ham, coalesce(madde_no, ''));

create index karar_mevzuat_atiflari_karar_id_idx on public.karar_mevzuat_atiflari (karar_id);
create index karar_mevzuat_atiflari_mevzuat_id_idx on public.karar_mevzuat_atiflari (mevzuat_id);


-- ============================================================================
-- mevzuat_surumleri -- MVP'de DOLDURULMAZ, yalnızca şema hazır (VERI_MODELI.md §1.8)
-- ============================================================================
-- Bilinçli olarak minimal: hiçbir otomatik versiyonlama tetikleyicisi/motoru yazılmadı.

create table public.mevzuat_surumleri (
  id uuid primary key default gen_random_uuid(),
  mevzuat_id uuid not null references public.mevzuat (id) on delete cascade,

  metin text not null,
  effective_from date not null,
  effective_to date,

  created_at timestamptz not null default now(),

  constraint mevzuat_surumleri_effective_range_check check (
    effective_to is null or effective_to >= effective_from
  )
);

comment on table public.mevzuat_surumleri is
  'MVP''de doldurulmaz -- yalnızca ileride mevzuat sürüm geçmişi açılırsa breaking change önlemek için şema düzeyinde hazır tutulur. Hiçbir versiyonlama motoru/tetikleyicisi bu turda yazılmadı.';

create index mevzuat_surumleri_mevzuat_id_effective_from_idx
  on public.mevzuat_surumleri (mevzuat_id, effective_from);
