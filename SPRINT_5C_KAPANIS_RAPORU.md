# Sprint 5C Kapanış Raporu — Staging Doğrulama + Permission Model

## Kapsam

Sprint 5B'de staging Supabase projesine (`yargitay-ictihat-staging`) uygulanan 8 migration'ın
(001-008: extensions, functions, core_reference_tables, user_data_tables, ai_tables, ops_tables,
triggers, rls) fiilen doğru çalıştığını `MIGRATION_PLAN.md` §15'teki 9 maddelik doğrulama planıyla
kanıtlamak. Sprint açılışında Runtime Test 1-4 zaten tamamlanmıştı; bu sprint Runtime Test 5 ile
başladı ve bir permission-model bulgusuyla genişledi.

## Yapılanlar (kronolojik)

1. **Runtime Test 5 tasarımı**: `muvekkiller` RLS policy'sini iki simüle kullanıcıyla (User A/User
   B) doğrulayan, transaction içinde çalışıp koşulsuz rollback yapan bir SQL script yazıldı
   (`authenticated` rolüne geçip `request.jwt.claims` üzerinden `auth.uid()` simüle ediliyor).
2. **Araç kurulumu**: Bu makinede `psql` yoktu. Sudo/Homebrew gerektirmeyen bir yol seçildi:
   Postgres.app (resmi, PG17 — staging ile aynı sürüm) indirilip `~/Applications`'a kuruldu,
   `psql` `~/.local/bin`'e symlink'lendi.
3. **Kimlik bilgisi güvenliği**: Staging DB şifresi hiçbir noktada sohbete yazılmadı. İlk deneme
   (`read -s` ile terminal-siz interaktif giriş) bu ortamda çalışmadığı için (boş şifre yakalandı),
   native macOS dialog (`osascript ... with hidden answer`) ile şifre doğrudan `~/.staging_rt5.env`
   dosyasına yazıldı — kullanıcı onayı alınarak.
4. **Runtime Test 5 — ilk çalıştırma**: İki script hatası bulunup düzeltildi (profiles trigger'ıyla
   çakışan gereksiz bir INSERT; psql'in `:'var'` ikamesinin `DO $$...$$` blokları içinde
   çalışmaması — GUC üzerinden taşımaya çevrildi). Üçüncü denemede script'in kendisi çalıştı ama
   **`authenticated` rolü için `permission denied for table muvekkiller` hatası alındı.**
5. **Kök neden analizi**: 8 migration dosyasının tamamı `GRANT`/`REVOKE` için tarandı — **hiçbirinde
   yok**. `supabase/config.toml`'daki `auto_expose_new_tables` notu doğrulandı: Supabase'in yeni
   cloud default'unda tablolar artık `anon`/`authenticated`/`service_role`'e otomatik açılmıyor.
6. **Permission matrisi**: 12 tablo × 3 rol × 4 işlem (SELECT/INSERT/UPDATE/DELETE), her hücre
   mevcut RLS policy'sine veya açık bir mimari yoruma dayandırılarak tasarlandı (RLS mantığı
   değiştirilmedi, yalnızca ona karşılık gelen temel tablo yetkisi belirlendi).
7. **`GRANT USAGE ON SCHEMA public` araştırması**: Gerekli mi diye ayrıca sorgulandı. Kanıt: (a)
   staging'deki asıl hata "for table muvekkiller" idi, "for schema public" değil — Postgres şema
   USAGE kontrolünü tablo çözümlemesinden önce yapar, yani bu kontrol zaten geçilmişti; (b)
   Supabase'in resmi "Tables not exposed..." changelog'undaki revoke script'i yalnızca tablo/sequence
   seviyesini hedefliyor, şema USAGE'ını hiç revoke etmiyor. Sonuç: **gerekmiyor**, migration'a
   eklenmedi.
8. **Migration**: `supabase/migrations/20260808090000_table_grants.sql` oluşturuldu — matrisin
   birebir uygulanması. `anon`/`authenticated` için deterministik `REVOKE ALL ON ALL TABLES IN
   SCHEMA public` ile başlıyor (önceki/miras her türlü grant sıfırlanıyor), `service_role`'a hiç
   dokunulmadı. Mevcut 8 migration, RLS policy'leri, trigger'lar, function'lar, tablo şeması
   değişmedi.
9. **Statik doğrulama**: Migration, gerçek Postgres 17 parser'ının (`libpg-query`, WASM,
   `libpgQueryTag: 17-6.1.0` — staging'in PG17.6'sıyla aynı major sürüm) ile parse edildi:
   **24/24 ifade hatasız** (2 REVOKE + 22 GRANT).
10. **Staging'e uygulama**: `psql --single-transaction` ile tek transaction içinde çalıştırıldı —
    24 ifade de başarılı, commit oldu. `information_schema.role_table_grants` ile bağımsız
    doğrulandı: 22 satır, matrisle birebir eşleşiyor; `anon` için sıfır satır.
11. **Runtime Test 5 — tekrar**: Aynı (değiştirilmemiş) script tekrar çalıştırıldı — **4/4 PASS**,
    rollback ile temiz kapandı, kalıcı veri/kullanıcı bırakılmadı.

## Bulgular

- **Kritik bulgu**: RLS policy'leri doğru tasarlanmıştı ama hiçbir zaman devreye giremiyordu —
  table-level GRANT eksikliği yüzünden `authenticated` rolü tabloya erişim aşamasında (RLS'e
  ulaşmadan) reddediliyordu. Bu, yalnızca `muvekkiller` değil, muhtemelen **tüm public tablolar**
  için geçerliydi (hiçbir migration'da hiçbir GRANT yoktu).
- Bu proje Supabase'in "tablolar artık otomatik Data API'ye açılmıyor" yeni cloud default'una tabi
  (`config.toml`'da doğrulandı) — eski nesil Supabase projelerinde bu sorun görülmezdi.
- `GRANT USAGE ON SCHEMA public` bu değişiklikten etkilenmiyor, halihazırda proje kurulumunda
  sağlanıyor.

## Sonuç

Runtime Test 1-5 (`MIGRATION_PLAN.md` §15) tamamlandı. Şema doğru, RLS policy'leri doğru, ve artık
table-level GRANT katmanı da doğru — üçü birlikte staging'de kanıtlandı. Runtime Test 6-9 ve Sprint
5B'nin geri kalan Edge Function işleri bu sprintin kapsamı dışında, henüz başlanmadı.

## Kalıcı Etkiler

- **Yeni migration**: `supabase/migrations/20260808090000_table_grants.sql` (staging'e uygulandı).
- **Yeni dosyalar**: `SPRINT_5C_BACKLOG.md`, bu rapor.
- **Güncellenen dosyalar**: `MIGRATION_PLAN.md` (§15 durum sütunu), `SPRINT_5B_BACKLOG.md` (madde
  1 ve 9 durumu).
- Staging'de kalıcı test verisi/kullanıcısı **yok** — tüm Runtime Test 5 denemeleri transaction +
  rollback ile çalıştırıldı.
- Production'a bu sprintte hiç dokunulmadı.

## Sıradaki

- Runtime Test 6 (GIN index), 7 (vector/HNSW — model henüz seçilmedi, N/A olabilir), 8 (`auth.uid()`
  izolasyonu, `dosyalar` üzerinde), 9 (`service_role` davranışı).
- `SPRINT_5B_BACKLOG.md` madde 2: `/v1/health` Edge Function (bu sprintte bilerek ertelendi).
