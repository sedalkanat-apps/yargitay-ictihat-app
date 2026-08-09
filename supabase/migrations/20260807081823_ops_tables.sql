-- 006_ops_tables.sql
-- Bkz. MIGRATION_PLAN.md §5 (request_id takibi), API_CONTRACT.md §2.1/§6/§10.
--
-- Yalnızca backend/service_role tarafından yazılan operasyonel log. Kullanıcı verisi
-- veya kaynak-özel hassas içerik ASLA burada saklanmaz.

create table public.entegrasyon_loglari (
  id uuid primary key default gen_random_uuid(),

  -- API_CONTRACT.md'deki requestId ile birebir aynı değer -- Edge Function'ın ürettiği
  -- kimlik hem response'a hem bu log satırına yazılır (destek/hata takibi için).
  request_id uuid not null,

  source text not null,
  operation text not null,
  status text not null,

  duration_ms integer,
  error_code text,
  metadata jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now(),

  constraint entegrasyon_loglari_source_check check (source in ('yargitay', 'mevzuat_gov_tr')),
  constraint entegrasyon_loglari_operation_check check (
    operation in ('arama', 'detay', 'yeniden_dogrulama')
  ),
  constraint entegrasyon_loglari_status_check check (status in ('success', 'error')),
  constraint entegrasyon_loglari_duration_non_negative check (
    duration_ms is null or duration_ms >= 0
  )
);

comment on table public.entegrasyon_loglari is
  'Yalnızca backend/service_role tarafından yazılır. Secret, ham HTML veya kaynağın hassas yanıt gövdesi ASLA metadata''ya yazılmaz -- bkz. API_CONTRACT.md §2.1/§6/§10.';

comment on column public.entegrasyon_loglari.error_code is
  'API_CONTRACT.md ApiError.code taksonomisiyle hizalı tutulmalıdır (VALIDATION_ERROR, SOURCE_UNAVAILABLE, vb.) ama burada CHECK ile zorlanmaz -- loglama, beklenmedik bir kodu reddetmek yerine her zaman kabul etmelidir.';

comment on column public.entegrasyon_loglari.metadata is
  'Yalnızca güvenli, teşhis amaçlı bağlam (ör. ilgili karar_id, http_status). Secret/PII/ham kaynak yanıtı YAZILMAZ.';

create index entegrasyon_loglari_request_id_idx on public.entegrasyon_loglari (request_id);
create index entegrasyon_loglari_created_at_idx on public.entegrasyon_loglari (created_at);
create index entegrasyon_loglari_source_status_idx on public.entegrasyon_loglari (source, status);
