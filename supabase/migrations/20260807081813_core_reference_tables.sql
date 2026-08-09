-- 003_core_reference_tables.sql
-- Bkz. MIGRATION_PLAN.md §4, §5, §8, §10.
--
-- kararlar ve mevzuat: kullanıcıya ait olmayan, paylaşılan referans veri. FK
-- bağımlılığı olmadığı için en erken oluşturulabilir tablolar.

-- ============================================================================
-- kararlar
-- ============================================================================

create table public.kararlar (
  id uuid primary key default gen_random_uuid(),

  -- Kimlik stratejisi (VERI_MODELI.md §5, MIGRATION_PLAN.md §5) --------------
  source text not null,
  source_id text not null,
  natural_key text not null,
  natural_key_hash text not null,

  -- Kaynak/normalizasyon verisi ------------------------------------------
  mahkeme text not null,
  daire text not null,
  esas_no text not null,
  karar_no text not null,
  tarih date not null,
  hukuk_dali text not null default '',
  ozet text,
  tam_metin text,

  -- Genişleme sübabı (VERI_MODELI.md §7) ----------------------------------
  kaynak_ozel_veri jsonb not null default '{}'::jsonb,

  -- Cache/freshness (VERI_MIMARISI.md §3.1) -------------------------------
  last_verified_at timestamptz not null default now(),
  verification_status text not null default 'active',
  source_content_hash text not null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint kararlar_source_check check (source in ('yargitay')),
  constraint kararlar_verification_status_check check (
    verification_status in ('active', 'removedFromSource', 'updated', 'unverifiable')
  ),
  constraint kararlar_source_id_not_blank check (btrim(source_id) <> ''),
  constraint kararlar_natural_key_hash_not_blank check (btrim(natural_key_hash) <> ''),
  constraint kararlar_mahkeme_not_blank check (btrim(mahkeme) <> ''),
  constraint kararlar_daire_not_blank check (btrim(daire) <> ''),
  constraint kararlar_esas_no_not_blank check (btrim(esas_no) <> ''),
  constraint kararlar_karar_no_not_blank check (btrim(karar_no) <> '')
);

comment on table public.kararlar is
  'Yargıtay (ve ileride diğer yargı organlarının) paylaşılan referans karar verisi. Kullanıcıya ait değildir, hiçbir zaman DELETE edilmez — bkz. VERI_MIMARISI.md §3.1, VERI_MODELI.md §1.6.';

comment on column public.kararlar.tam_metin is
  'Kararın kaynaktan alınan tam metni. Bu, AI özeti DEĞİLDİR — AI üretimleri ayrı tabloda (karar_ai_analizleri), bkz. VERI_MIMARISI.md §5.';

comment on column public.kararlar.ozet is
  'Kaynağın (Yargıtay) kendi sağladığı kısa özet -- yalnızca kaynak/normalizasyon verisi. AI tarafından üretilmiş bir özet DEĞİLDİR; AI özeti karar_ai_analizleri.ozet''tedir.';

comment on column public.kararlar.natural_key is
  'Ham, okunabilir normalize doğal anahtar (daire+esas+karar+tarih). Yalnızca hash''i (natural_key_hash) benzersizlik için kullanılır; bu sütun debug/teşhis amaçlı saklanır — MIGRATION_PLAN.md §5''teki VERI_MODELI.md''den revizyon.';

alter table public.kararlar
  add constraint kararlar_source_natural_key_hash_key unique (source, natural_key_hash);

create index kararlar_source_source_id_idx on public.kararlar (source, source_id);
create index kararlar_last_verified_at_idx on public.kararlar (last_verified_at);
create index kararlar_verification_status_partial_idx on public.kararlar (verification_status)
  where verification_status <> 'active';
create index kararlar_mahkeme_daire_idx on public.kararlar (mahkeme, daire);

-- Full-text arama: generated tsvector + GIN, config: simple (MIGRATION_PLAN.md §8 kararı).
alter table public.kararlar
  add column arama_vektoru tsvector
  generated always as (
    to_tsvector('simple', coalesce(ozet, '') || ' ' || coalesce(tam_metin, ''))
  ) stored;

create index kararlar_arama_vektoru_idx on public.kararlar using gin (arama_vektoru);

-- Kısmi esas/karar no arama (pg_trgm) -- yalnızca gerçekten planlanan iki alan.
create index kararlar_esas_no_trgm_idx on public.kararlar using gin (esas_no extensions.gin_trgm_ops);
create index kararlar_karar_no_trgm_idx on public.kararlar using gin (karar_no extensions.gin_trgm_ops);


-- ============================================================================
-- mevzuat
-- ============================================================================

create table public.mevzuat (
  id uuid primary key default gen_random_uuid(),

  source text not null,
  source_id text not null,
  natural_key text not null,
  natural_key_hash text not null,

  mevzuat_turu text not null,
  mevzuat_no text not null,
  baslik text not null,
  metin text,

  effective_from date,
  effective_to date,

  kaynak_ozel_veri jsonb not null default '{}'::jsonb,

  last_verified_at timestamptz not null default now(),
  verification_status text not null default 'active',
  source_content_hash text not null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint mevzuat_source_check check (source in ('mevzuat_gov_tr')),
  constraint mevzuat_turu_check check (
    mevzuat_turu in ('kanun', 'khk', 'yonetmelik', 'teblig', 'diger')
  ),
  constraint mevzuat_verification_status_check check (
    verification_status in ('active', 'removedFromSource', 'updated', 'unverifiable')
  ),
  constraint mevzuat_source_id_not_blank check (btrim(source_id) <> ''),
  constraint mevzuat_natural_key_hash_not_blank check (btrim(natural_key_hash) <> ''),
  constraint mevzuat_baslik_not_blank check (btrim(baslik) <> ''),
  constraint mevzuat_effective_range_check check (
    effective_to is null or effective_from is null or effective_to >= effective_from
  )
);

comment on table public.mevzuat is
  'mevzuat.gov.tr paylaşılan referans mevzuat verisi (belge düzeyi, MVP). yururluk_durumu BURADA SAKLANMAZ -- effective_from/effective_to üzerinden API katmanında türetilir, bkz. VERI_MODELI.md §7 / API_CONTRACT.md / MIGRATION_PLAN.md §2.';

alter table public.mevzuat
  add constraint mevzuat_source_natural_key_hash_key unique (source, natural_key_hash);

create index mevzuat_source_source_id_idx on public.mevzuat (source, source_id);
create index mevzuat_last_verified_at_idx on public.mevzuat (last_verified_at);

alter table public.mevzuat
  add column arama_vektoru tsvector
  generated always as (to_tsvector('simple', coalesce(baslik, '') || ' ' || coalesce(metin, ''))) stored;

create index mevzuat_arama_vektoru_idx on public.mevzuat using gin (arama_vektoru);
