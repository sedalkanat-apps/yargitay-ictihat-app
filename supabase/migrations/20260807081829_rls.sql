-- 008_rls.sql
-- Bkz. MIGRATION_PLAN.md §11, VERI_MODELI.md §2.
--
-- Tüm RLS enable + policy tanımları TEK yerde -- güvenlik politikalarını tek bakışta
-- denetleyebilmek için (şema/trigger dosyalarına dağıtılmadı).

-- ============================================================================
-- Kullanıcıya ait tablolar -- auth.uid() temelli
-- ============================================================================

alter table public.profiles enable row level security;

create policy profiles_select_own on public.profiles
  for select using (auth.uid() = id);

create policy profiles_insert_own on public.profiles
  for insert with check (auth.uid() = id);

create policy profiles_update_own on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- DELETE policy'si yok: hesap silme auth.users DELETE'i ile cascade olur (VERI_MODELI.md §1.1).


alter table public.muvekkiller enable row level security;

create policy muvekkiller_select_own on public.muvekkiller
  for select using (auth.uid() = user_id);

create policy muvekkiller_insert_own on public.muvekkiller
  for insert with check (auth.uid() = user_id);

create policy muvekkiller_update_own on public.muvekkiller
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy muvekkiller_delete_own on public.muvekkiller
  for delete using (auth.uid() = user_id);


-- dosyalar: yalnızca doğrudan user_id'ye güvenilmiyor -- EXISTS ile muvekkiller
-- sahipliği AYRICA doğrulanır (nested ownership). dosyalar.user_id ile
-- muvekkiller.user_id'nin herhangi bir nedenle tutarsız kaldığı bir senaryoda dahi
-- bir kullanıcının başkasının müvekkiline bağlı dosyayı görmesi/değiştirmesi engellenir.

alter table public.dosyalar enable row level security;

create policy dosyalar_select_own on public.dosyalar
  for select using (
    auth.uid() = user_id
    and exists (
      select 1 from public.muvekkiller m
      where m.id = dosyalar.muvekkil_id and m.user_id = auth.uid()
    )
  );

create policy dosyalar_insert_own on public.dosyalar
  for insert with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.muvekkiller m
      where m.id = dosyalar.muvekkil_id and m.user_id = auth.uid()
    )
  );

create policy dosyalar_update_own on public.dosyalar
  for update using (
    auth.uid() = user_id
    and exists (
      select 1 from public.muvekkiller m
      where m.id = dosyalar.muvekkil_id and m.user_id = auth.uid()
    )
  ) with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.muvekkiller m
      where m.id = dosyalar.muvekkil_id and m.user_id = auth.uid()
    )
  );

create policy dosyalar_delete_own on public.dosyalar
  for delete using (
    auth.uid() = user_id
    and exists (
      select 1 from public.muvekkiller m
      where m.id = dosyalar.muvekkil_id and m.user_id = auth.uid()
    )
  );


-- kaydedilen_kararlar: aynı nested-ownership deseni, dosyalar üzerinden.

alter table public.kaydedilen_kararlar enable row level security;

create policy kaydedilen_kararlar_select_own on public.kaydedilen_kararlar
  for select using (
    auth.uid() = user_id
    and exists (
      select 1 from public.dosyalar d
      where d.id = kaydedilen_kararlar.dosya_id and d.user_id = auth.uid()
    )
  );

create policy kaydedilen_kararlar_insert_own on public.kaydedilen_kararlar
  for insert with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.dosyalar d
      where d.id = kaydedilen_kararlar.dosya_id and d.user_id = auth.uid()
    )
  );

create policy kaydedilen_kararlar_delete_own on public.kaydedilen_kararlar
  for delete using (
    auth.uid() = user_id
    and exists (
      select 1 from public.dosyalar d
      where d.id = kaydedilen_kararlar.dosya_id and d.user_id = auth.uid()
    )
  );

-- UPDATE policy'si yok: kaydedilen_kararlar bir ilişki kaydıdır, değiştirilmez (VERI_MODELI.md §1.4).


-- notlar: aynı nested-ownership deseni, dosyalar üzerinden.

alter table public.notlar enable row level security;

create policy notlar_select_own on public.notlar
  for select using (
    auth.uid() = user_id
    and exists (
      select 1 from public.dosyalar d
      where d.id = notlar.dosya_id and d.user_id = auth.uid()
    )
  );

create policy notlar_insert_own on public.notlar
  for insert with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.dosyalar d
      where d.id = notlar.dosya_id and d.user_id = auth.uid()
    )
  );

create policy notlar_update_own on public.notlar
  for update using (
    auth.uid() = user_id
    and exists (
      select 1 from public.dosyalar d
      where d.id = notlar.dosya_id and d.user_id = auth.uid()
    )
  ) with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.dosyalar d
      where d.id = notlar.dosya_id and d.user_id = auth.uid()
    )
  );

create policy notlar_delete_own on public.notlar
  for delete using (
    auth.uid() = user_id
    and exists (
      select 1 from public.dosyalar d
      where d.id = notlar.dosya_id and d.user_id = auth.uid()
    )
  );


-- ============================================================================
-- Paylaşılan referans veri -- authenticated SELECT, yazma yalnızca service_role
--
-- service_role RLS'i Supabase'de OTOMATİK bypass eder (platform davranışı) -- bu
-- yüzden burada service_role için AYRI bir yazma policy'si YAZILMIYOR. authenticated/
-- anon için INSERT/UPDATE/DELETE policy'si TANIMLANMADIĞI için, RLS'in varsayılan-red
-- davranışı gereği bu roller için bu işlemler zaten örtük olarak reddedilir.
-- ============================================================================

alter table public.kararlar enable row level security;

create policy kararlar_select_authenticated on public.kararlar
  for select to authenticated using (true);


alter table public.mevzuat enable row level security;

create policy mevzuat_select_authenticated on public.mevzuat
  for select to authenticated using (true);


alter table public.mevzuat_surumleri enable row level security;

create policy mevzuat_surumleri_select_authenticated on public.mevzuat_surumleri
  for select to authenticated using (true);


alter table public.karar_ai_analizleri enable row level security;

create policy karar_ai_analizleri_select_authenticated on public.karar_ai_analizleri
  for select to authenticated using (true);


alter table public.karar_mevzuat_atiflari enable row level security;

create policy karar_mevzuat_atiflari_select_authenticated on public.karar_mevzuat_atiflari
  for select to authenticated using (true);


-- ============================================================================
-- Client'a tamamen kapalı -- RLS açık, HİÇBİR policy tanımlanmadı (yalnızca
-- service_role erişir; authenticated/anon için SELECT dahil her şey reddedilir).
-- ============================================================================

alter table public.karar_embeddingleri enable row level security;
-- Kasıtlı olarak hiçbir policy yok.

alter table public.entegrasyon_loglari enable row level security;
-- Kasıtlı olarak hiçbir policy yok.
