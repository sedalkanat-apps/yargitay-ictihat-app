# SPRINT_5B_BACKLOG.md — Gerçek Veri Entegrasyonu Teknik Backlog

Bu liste Sprint 5A'nın kapanışında belirlenmiş, Sprint 5A/5B netleştirme turunda revize edilmiş ve
bu turda (Sprint 5B.1 API Contract eki) iki yeni maddeyle güncellenmiştir. **Yalnızca gerçek
geliştirme işlerini içerir — araştırma maddesi yoktur.** Sıra, doğal bağımlılık sırasını yansıtır;
katı bir taahhüt değildir.

Referans belgeler: `VERI_MIMARISI.md` (mimari kararlar + Go/No-Go kapısı), `VERI_MODELI.md`
(Supabase tablo tasarımı), `API_CONTRACT.md` (mobil↔backend sözleşmesi).

---

## Blokaj (production/toplu/ticari canlı veri çekimi için — POC için değil)

0. **G1 + G2 kapanmadan** (`VERI_MIMARISI.md` §2) hiçbir production, toplu veya ticari canlı veri
   çekimi başlatılamaz. Şema/kod hazırlığı (aşağıdaki tüm maddeler) bu kapı beklenmeden paralel
   ilerleyebilir — hiçbiri gerçek kaynağa canlı bağlanmaz.

---

## Backend / Supabase

1. ✅ **Tamamlandı** — Tablolar: `kararlar`, `mevzuat`, `karar_ai_analizleri`, `karar_embeddingleri`,
   `karar_mevzuat_atiflari`, `mevzuat_surumleri` (`VERI_MODELI.md`'de kararlaştırılan alan setiyle).
   8 migration (001-008) staging'e uygulandı, Runtime Test 1-4 ile doğrulandı (bkz.
   `MIGRATION_PLAN.md` §15, `SPRINT_5C_BACKLOG.md`). Doğrulama sırasında table-level GRANT
   katmanının eksik olduğu bulundu — bu, ayrı bir Sprint 5C işi olarak ele alındı ve
   `20260808090000_table_grants.sql` ile kapatıldı (madde 1'in kendisi değil, bir yan bulgu).
2. **`/v1/health` Edge Function implementasyonu** *(bu turda eklendi)* — tablolardan hemen sonra,
   diğer Edge Function'lardan önce: dağıtım/DB bağlantısının doğrulanması için en basit, en erken
   yapılabilecek iş; sonraki tüm backend işleri için operasyonel bir güven temeli sağlar
3. `karar-ara` Edge Function: cache-first arama (`kararlar` üzerinden, TTL/stale-while-revalidate)
4. `karar-detay` Edge Function: cache-first tam metin + `status`/`lastVerifiedAt` yanıta ekleme
5. Kaynak→şema normalize modülü + `naturalKeyHash` hesaplama/duplicate-eşleme mantığı
6. Yeniden doğrulama job'ı: TTL dolan kayıtları tarayıp `status`/`sourceContentHash` güncelleme
7. AI staleness tetikleyicisi: `sourceContentHash` değiştiğinde ilgili AI kayıtlarını `stale`
   işaretleme
8. Hata/circuit-breaker + throttle
9. 🔶 **Kısmen tamamlandı** — Entegrasyon logu (`entegrasyon_loglari`): tablo + `request_id` sütunu
   madde 1 kapsamında oluşturuldu (`API_CONTRACT.md` §10 önerisi migration'a işlendi). Tabloyu
   fiilen dolduran backend kodu (Edge Function'ların loglama çağrısı) henüz yazılmadı — bu kısım
   hâlâ bekliyor.
10. Mevzuat için eşdeğer Edge Function + tablo altyapısı (mobilde henüz açılmayacak)

## Mobil

11. `repositories/kararRepository.ts` yanına `remoteKararRepository.ts` (mock↔remote geçiş,
    env/flag ile)
12. `types/karar.ts`'e arama kriteri/sonuç/pagination tipleri (additive)

## Dokümantasyon / Araç Altyapısı

13. **OpenAPI 3.1 specification oluşturulması** *(bu turda eklendi)* — backend endpoint'leri
    (madde 2-4, 10) stabilize olduktan, POC'lardan (madde 14-15) önce: `API_CONTRACT.md` §16'daki
    haritalamadan türetilir; POC'ların gerçek yanıtlarını doğrulamak için bir referans şema olarak
    kullanılabilir. SQL migration'dan önce yapılması gereken bir blokaj **değildir**.

## Test/POC (düşük hacim, G4 kapsamında — production izni değil)

14. Sınırlı ölçekli Yargıtay POC (CAPTCHA/şema/TLS/gecikme ölçümü)
15. Sınırlı ölçekli mevzuat.gov.tr POC

---

## Değişiklik Geçmişi

- **Sprint 5A/5B netleştirme**: backlog ilk kez tanımlandı (yalnızca sohbette, dosyaya
  yazılmamıştı).
- **Sprint 5B.1 eki**: backlog bu dosyaya taşındı; madde 2 (`/v1/health`) ve madde 13
  (OpenAPI 3.1) eklendi, sıralama buna göre güncellendi.
- **Sprint 5C kapanışı (bu tur)**: madde 1 tamamlandı olarak işaretlendi (8 migration staging'de,
  Runtime Test 1-4 ile doğrulandı); madde 9 kısmen tamamlandı olarak işaretlendi (tablo/kolon hazır,
  Edge Function loglama çağrısı bekliyor). Detay: `SPRINT_5C_BACKLOG.md`,
  `SPRINT_5C_KAPANIS_RAPORU.md`.
