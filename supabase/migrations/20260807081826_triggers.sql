-- 007_triggers.sql
-- Bkz. MIGRATION_PLAN.md §12.
--
-- Tüm trigger'lar merkezi olarak burada -- "hangi tabloda hangi davranış var" sorusunun
-- tek yerden cevaplanabilmesi için (şemanın değil davranışın parçası).

-- updated_at trigger'ları -- yalnızca updated_at sütunu bulunan 7 tabloya bağlanır.
-- kaydedilen_kararlar, karar_embeddingleri, karar_mevzuat_atiflari, mevzuat_surumleri,
-- entegrasyon_loglari BİLİNÇLİ OLARAK dışarıda -- hepsi append-only veya değişmez
-- ilişki kayıtları (gerekçe ilgili CREATE TABLE dosyalarında).

create trigger set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger set_updated_at before update on public.muvekkiller
  for each row execute function public.set_updated_at();

create trigger set_updated_at before update on public.dosyalar
  for each row execute function public.set_updated_at();

create trigger set_updated_at before update on public.notlar
  for each row execute function public.set_updated_at();

create trigger set_updated_at before update on public.kararlar
  for each row execute function public.set_updated_at();

create trigger set_updated_at before update on public.mevzuat
  for each row execute function public.set_updated_at();

create trigger set_updated_at before update on public.karar_ai_analizleri
  for each row execute function public.set_updated_at();

-- auth.users -> profiles otomasyonu. Özel durum: bizim şemamızdaki değil, Supabase'in
-- auth şemasındaki tabloya bağlanır. Fonksiyon tanımı 002_functions.sql'de (handle_new_user).
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
