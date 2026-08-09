-- 002_functions.sql
-- Bkz. MIGRATION_PLAN.md §12.
--
-- Ortak updated_at trigger fonksiyonu. Her tabloya ayrı bir fonksiyon yazmak yerine
-- TEK, yeniden kullanılan bir fonksiyon; 007_triggers.sql'de yalnızca updated_at
-- sütunu bulunan 7 tabloya bağlanır.

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

comment on function public.set_updated_at() is
  'Ortak updated_at trigger fonksiyonu. Yalnızca updated_at sütunu bulunan tablolara bağlanır.';

-- auth.users -> profiles otomasyonu.
--
-- Gerekli mi: EVET. muvekkiller.user_id -> profiles.id FK'si (004_user_data_tables.sql),
-- kullanıcı ilk müvekkilini oluşturmadan önce bir profiles satırının VAR OLMASINI
-- gerektiriyor. Bu turda mobil/Edge Function kodu yazılmadığı için, profili oluşturacak
-- başka hiçbir mekanizma yok — bu, Supabase'in kendi yerleşik auth.users olayına
-- bağlanan standart, iyi bilinen deseni.
--
-- SECURITY DEFINER: auth.users INSERT'i tetiklendiğinde çalışan oturum bağlamı,
-- normal bir client isteğinin auth.uid() bağlamıyla aynı olmayabilir; fonksiyon
-- sahibi haklarıyla çalışması, profiles satırının güvenilir biçimde oluşmasını
-- garanti eder. search_path açıkça public'e sabitlenir (search_path hijacking'e
-- karşı standart güvenlik pratiği).

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id)
  values (new.id);
  return new;
end;
$$;

comment on function public.handle_new_user() is
  'auth.users''e yeni kullanıcı eklendiğinde public.profiles''ta karşılığını otomatik oluşturur.';
