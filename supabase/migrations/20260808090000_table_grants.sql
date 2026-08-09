-- 009_table_grants.sql
-- Bkz. Sprint 5C Permission İncelemesi (Son Kontrol).
--
-- Eksik table-level GRANT katmanı. Hiçbir RLS policy, trigger, function veya tablo
-- şeması bu migration'da değiştirilmez -- yalnızca 001-008'de zaten tanımlanmış RLS
-- stratejisinin gerektirdiği temel tablo yetkileri ekleniyor.
--
-- `GRANT USAGE ON SCHEMA public` BİLEREK EKLENMEDİ -- Sprint 5C araştırmasında
-- doğrulandı: Supabase bunu proje kurulumunda anon/authenticated/service_role için
-- otomatik sağlıyor (kanıt: authenticated ile yapılan canlı testte hata "permission
-- denied for table muvekkiller" idi, "for schema public" değil -- şema kontrolü zaten
-- geçilmişti). Bu breaking change yalnızca tablo/sequence default privilege'larını
-- kaldırdı, şema USAGE'ını değil.
--
-- anon için BİLEREK HİÇBİR GRANT eklenmedi -- 008_rls.sql'de anon için tek bir policy
-- yok (giriş zorunlu mimari, PRD/ROADMAP'ta anonim erişim tanımlı değil). Yeni bir
-- anon erişimi burada önerilmiyor.

-- ============================================================================
-- Deterministik temiz başlangıç -- yalnızca anon ve authenticated. Mevcut/miras
-- (ör. Supabase'in eski auto-expose default'undan kalma) her türlü table-level
-- grant önce sıfırlanır; migration'ın geri kalanı ondan sonra YALNIZCA aşağıdaki
-- matriste açıkça belirtilen izinleri ekler -- migration'ın sonucu, önceki DB
-- durumundan bağımsız, her zaman aynı olur. service_role'a KASITLI dokunulmadı.
-- ============================================================================

revoke all on all tables in schema public from anon;
revoke all on all tables in schema public from authenticated;

-- ============================================================================
-- Kullanıcıya ait tablolar -- authenticated: policy'lerle birebir, service_role: tam CRUD
-- ============================================================================

-- profiles: DELETE grant YOK -- 008_rls.sql'de DELETE policy yok, hesap silme
-- auth.users cascade'i ile olur (client'ın public.profiles'ı doğrudan silmesine gerek yok).
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update, delete on public.profiles to service_role;

grant select, insert, update, delete on public.muvekkiller to authenticated;
grant select, insert, update, delete on public.muvekkiller to service_role;

grant select, insert, update, delete on public.dosyalar to authenticated;
grant select, insert, update, delete on public.dosyalar to service_role;

-- kaydedilen_kararlar: UPDATE grant YOK -- ilişki kaydı, 008_rls.sql'de UPDATE policy
-- yok (user_data_tables.sql yorumu: "değiştirilmez").
grant select, insert, delete on public.kaydedilen_kararlar to authenticated;
grant select, insert, update, delete on public.kaydedilen_kararlar to service_role;

grant select, insert, update, delete on public.notlar to authenticated;
grant select, insert, update, delete on public.notlar to service_role;


-- ============================================================================
-- Paylaşılan referans veri -- authenticated: yalnızca SELECT (008_rls.sql'deki tek
-- policy), yazma yalnızca service_role (RLS'i bypass eder, 008_rls.sql:172-177 notu)
-- ============================================================================

-- kararlar: service_role'a DELETE grant YOK -- core_reference_tables.sql'deki tablo
-- yorumu: "hiçbir zaman DELETE edilmez" (soft-delete: verification_status).
grant select on public.kararlar to authenticated;
grant select, insert, update on public.kararlar to service_role;

grant select on public.mevzuat to authenticated;
grant select, insert, update, delete on public.mevzuat to service_role;

grant select on public.mevzuat_surumleri to authenticated;
grant select, insert, update, delete on public.mevzuat_surumleri to service_role;

grant select on public.karar_ai_analizleri to authenticated;
grant select, insert, update, delete on public.karar_ai_analizleri to service_role;

grant select on public.karar_mevzuat_atiflari to authenticated;
grant select, insert, update, delete on public.karar_mevzuat_atiflari to service_role;


-- ============================================================================
-- Client'a tamamen kapalı -- 008_rls.sql'de RLS açık, hiçbir policy yok. authenticated
-- için HİÇBİR GRANT yok (RLS zaten reddediyor, ama tablo-level grant de bilerek
-- verilmiyor -- defense-in-depth). Yalnızca service_role (RLS'i bypass eder).
-- ============================================================================

-- karar_embeddingleri: ai_tables.sql yorumu -- "Client'a asla açılmaz".
grant select, insert, update, delete on public.karar_embeddingleri to service_role;

-- entegrasyon_loglari: ops_tables.sql yorumu -- "yalnızca backend/service_role
-- tarafından yazılır". UPDATE/DELETE grant YOK -- append-only log; retention/temizlik
-- job'ı henüz tasarlanmadı, gerekirse ayrı bir migration/karar olarak eklenmeli.
grant select, insert on public.entegrasyon_loglari to service_role;
