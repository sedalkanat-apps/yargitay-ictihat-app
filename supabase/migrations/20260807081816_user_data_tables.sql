-- 004_user_data_tables.sql
-- Bkz. MIGRATION_PLAN.md §4.
--
-- PRD hiyerarşisi: profiles (auth.users uzantısı) -> muvekkiller -> dosyalar
-- -> {kaydedilen_kararlar, notlar}. kaydedilen_kararlar ayrıca kararlar'a (003) bağlanır.

-- ============================================================================
-- profiles
-- ============================================================================

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,

  ad text,
  revenuecat_customer_id text,
  abonelik_durumu text,
  abonelik_gecerlilik_tarihi timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is
  'auth.users''in uygulamaya özgü 1:1 uzantısı. Gereksiz alan eklenmedi -- yalnızca görünen ad ve RevenueCat önbelleği. abonelik_* alanları RevenueCat''ten senkronize edilen bir ÖNBELLEKTİR, kaynak-doğruluk RevenueCat''tir. Bkz. VERI_MODELI.md §1.1.';


-- ============================================================================
-- muvekkiller
-- ============================================================================

create table public.muvekkiller (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,

  ad text not null,
  tur text not null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint muvekkiller_tur_check check (tur in ('gercek', 'tuzel')),
  constraint muvekkiller_ad_not_blank check (btrim(ad) <> '')
);

create index muvekkiller_user_id_idx on public.muvekkiller (user_id);


-- ============================================================================
-- dosyalar
-- ============================================================================

create table public.dosyalar (
  id uuid primary key default gen_random_uuid(),
  muvekkil_id uuid not null references public.muvekkiller (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,

  ad text not null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint dosyalar_ad_not_blank check (btrim(ad) <> '')
);

comment on column public.dosyalar.user_id is
  'Denormalize edilmiş sahiplik alanı -- RLS''in muvekkiller''e join yapmadan doğrudan satır bazlı filtreleyebilmesi için (VERI_MODELI.md §1.3). RLS politikaları (008) buna EK olarak EXISTS ile muvekkiller sahipliğini de doğrular.';

create index dosyalar_muvekkil_id_idx on public.dosyalar (muvekkil_id);
create index dosyalar_user_id_idx on public.dosyalar (user_id);


-- ============================================================================
-- kaydedilen_kararlar
-- ============================================================================
-- Yalnızca ilişkiyi taşır -- kararın mahkeme/daire/esas/karar/tarih bilgisi BURADA
-- KOPYALANMAZ, kararlar.id ile okunur. Mobil kararId ilişkisiyle birebir (VERI_MODELI.md §1.4).

create table public.kaydedilen_kararlar (
  id uuid primary key default gen_random_uuid(),
  dosya_id uuid not null references public.dosyalar (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  karar_id uuid not null references public.kararlar (id) on delete restrict,

  kaydedilme_tarihi timestamptz not null default now()
);

alter table public.kaydedilen_kararlar
  add constraint kaydedilen_kararlar_dosya_karar_key unique (dosya_id, karar_id);

create index kaydedilen_kararlar_dosya_id_idx on public.kaydedilen_kararlar (dosya_id);
create index kaydedilen_kararlar_karar_id_idx on public.kaydedilen_kararlar (karar_id);


-- ============================================================================
-- notlar
-- ============================================================================

create table public.notlar (
  id uuid primary key default gen_random_uuid(),
  dosya_id uuid not null references public.dosyalar (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,

  metin text not null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint notlar_metin_not_blank check (btrim(metin) <> '')
);

create index notlar_dosya_id_idx on public.notlar (dosya_id);
