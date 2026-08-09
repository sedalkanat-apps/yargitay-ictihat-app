# SPRINT_5C_BACKLOG.md — Staging Doğrulama + Permission Model Teknik Backlog

Sprint 5B'de staging'e uygulanan 8 migration'ın (001-008) fiilen doğru çalıştığını kanıtlamak için
`MIGRATION_PLAN.md` §15'teki "Migration Sonrası Doğrulama Planı" bu sprintte staging üzerinde
uygulandı. Doğrulama sırasında bir eksiklik bulundu (table-level GRANT katmanı) ve aynı sprint
içinde kapatıldı.

Referans belgeler: `MIGRATION_PLAN.md` §15 (doğrulama planının kaynağı), `SPRINT_5B_BACKLOG.md`
madde 1 (bu sprintin doğruladığı iş).

---

## Runtime Doğrulama (staging, `MIGRATION_PLAN.md` §15 ile birebir)

1. ✅ **Tamamlandı** — Runtime Test 1: Tablo sayısı. 12/12 tablo mevcut.
2. ✅ **Tamamlandı** — Runtime Test 2: FK'ler. 14/14 foreign key doğru tabloya/ON DELETE
   davranışıyla bağlı.
3. ✅ **Tamamlandı** — Runtime Test 3: Unique constraint yapısal doğrulaması. 6/6 mekanizma
   beklenen kolon setiyle eşleşiyor.
4. ✅ **Tamamlandı** — Runtime Test 4: RLS açık mı. 12/12 tabloda `pg_class.relrowsecurity = true`.
5. ✅ **Tamamlandı** — Runtime Test 5: `muvekkiller` policy davranışı, iki test kullanıcısıyla
   (User A/User B, pozitif+negatif, 4 kontrol). **İlk çalıştırmada `authenticated` rolü için
   `permission denied for table muvekkiller` hatası alındı** — RLS policy hatası değil, table-level
   GRANT eksikliği (aşağıya bkz). Düzeltme sonrası tekrar çalıştırıldı: 4/4 PASS, transaction
   rollback ile temiz kapandı, kalıcı veri/kullanıcı bırakılmadı.
6. ⏳ **Bekliyor** — Runtime Test 6: GIN index var mı (`arama_vektoru` + trigram).
7. ⏳ **Bekliyor** — Runtime Test 7: Vector extension/HNSW index (not: HNSW index'i şu an bilinçli
   olarak yok — `ai_tables.sql`'deki embedding boyutu henüz sabitlenmedi notuna bkz; bu madde model
   seçilene kadar teknik olarak "N/A" olabilir, ayrı değerlendirilmeli).
8. ⏳ **Bekliyor** — Runtime Test 8: `auth.uid()` izolasyonu (User A/User B ile `dosyalar` üzerinde,
   nested-ownership `EXISTS` dahil).
9. ⏳ **Bekliyor** — Runtime Test 9: `service_role` davranışı (`kararlar`'a `service_role` INSERT
   başarılı + aynı deneme `authenticated` ile başarısız, birlikte test).

## Permission Model (Runtime Test 5'in bulgusu üzerine açılan iş)

10. ✅ **Tamamlandı** — Permission model incelemesi: 8 migration dosyasının tamamı `GRANT`/`REVOKE`
    için tarandı. Sonuç: hiçbir migration'da table-level GRANT yok (yalnızca RLS policy'leri var,
    bunlar GRANT'in yerine geçmiyor). `config.toml`'daki `auto_expose_new_tables` notu bunu
    doğruluyor — Supabase'in yeni cloud default'unda tablolar artık otomatik açılmıyor.
11. ✅ **Tamamlandı** — Permission matrisi tasarımı: 12 tablo × `anon`/`authenticated`/
    `service_role` × SELECT/INSERT/UPDATE/DELETE, her hücre mevcut RLS policy'sine veya açık bir
    mimari yoruma (ör. "hiçbir zaman DELETE edilmez", "client'a asla açılmaz") dayandırıldı.
12. ✅ **Tamamlandı** — Araştırma: `GRANT USAGE ON SCHEMA public` gerekli mi? Sonuç: **hayır** —
    hem ampirik kanıtla (staging'deki asıl hata "for table", "for schema" değildi) hem Supabase'in
    resmi changelog'uyla (breaking change yalnızca tablo/sequence seviyesini etkiledi) doğrulandı.
    Migration'a bilerek eklenmedi.
13. ✅ **Tamamlandı** — `supabase/migrations/20260808090000_table_grants.sql` oluşturuldu: matrisin
    birebir uygulanması, `anon`/`authenticated` için deterministik `REVOKE ALL` ile başlıyor,
    `service_role`'a dokunmuyor. Mevcut 001-008 migration'ları, RLS policy'leri, trigger'lar,
    function'lar veya tablo şeması değiştirilmedi.
14. ✅ **Tamamlandı** — Statik doğrulama: migration, gerçek Postgres 17 parser'ının (libpg-query,
    `libpgQueryTag: 17-6.1.0`) WASM derlemesiyle parse edildi — 24/24 ifade (2 REVOKE + 22 GRANT)
    hatasız.
15. ✅ **Tamamlandı** — Staging'e uygulandı: tek transaction içinde (`--single-transaction`), 24
    ifade de başarılı, commit oldu. `information_schema.role_table_grants` ile doğrulandı: 22 satır,
    matrisle birebir eşleşiyor; `anon` için hiçbir satır yok.
16. ✅ **Tamamlandı** — Runtime Test 5 tekrarı: migration sonrası 4/4 PASS (bkz. madde 5).

---

## Sıradaki

- Runtime Test 6-9 (yukarıda ⏳ işaretli).
- `SPRINT_5B_BACKLOG.md` madde 2 ve sonrası (Edge Function implementasyonları) — bu sprintin
  kapsamı dışında, henüz başlanmadı.

---

## Değişiklik Geçmişi

- **Sprint 5C açılışı**: staging'de 8/8 migration uygulanmış, Runtime Test 1-4 sonuçları (dosyaya
  yazılmadan) bildirildi.
- **Sprint 5C kapanışı (bu tur)**: Runtime Test 5 + permission model incelemesi + grant migration
  tasarımı/statik doğrulama/staging uygulaması + Runtime Test 5 tekrarı bu dosyaya işlendi. Bu
  dosya ilk kez oluşturuldu.
