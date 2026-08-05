# CLAUDE.md — Proje Anayasası

Bu dosya, "Yargıtay İçtihat" mobil uygulamasının geliştirme sürecinde uyulması zorunlu kurallarını içerir. Planlama aşaması tamamlanmıştır; bu belge o sürecin (analiz, mimari, PRD, ürün incelemesi) nihai özetidir ve bundan sonraki her kodlama oturumunda referans alınmalıdır. Bu belgedeki kurallarla çelişen hiçbir değişiklik, açık onay alınmadan yapılmaz.

---

## 1. Proje Amacı

Türkiye'deki avukatların ve hukuk öğrencilerinin Yargıtay kararlarına saniyeler içinde ulaşmasını sağlayan, yapay zekâ destekli bir mobil uygulama geliştirmek. Ürün, tek bir avukat/girişimci tarafından teknik ekip kurulmadan (solo founder) geliştirilecek ve işletilecektir.

Tasarım referansı proje kökündeki `html-export/` klasörüdür — bu klasördeki 7 HTML dosyası (`ara.html`, `sonu-lar.html`, `geli-mi-filtreleme.html`, `karar-detay.html`, `kay-tl-lar-m.html`, `hesab-m.html`, `abonelik.html`) yalnızca **görsel ve içerik referansıdır**, doğrudan koda dönüştürülmeyecek, kendisi hiçbir zaman değiştirilmeyecektir.

## 2. MVP Sınırları

**MVP kapsamında olanlar:**
- Kayıt/giriş: email + parola, Apple Sign-In (zorunlu), Google Sign-In (opsiyonel)
- Arama: Postgres full-text search, temel filtreler (daire, tarih aralığı, esas/karar no, hukuk dalı, dahil/hariç anahtar kelime)
- Sonuç listesi + Karar Detayı: tam metin + **önceden üretilmiş** (precomputed) AI özeti
- **Alıntı Kopyala**: karar metninden standart formatta alıntının panoya kopyalanması
- Kaydetme + **Dava Dosyası** (tek seviyeli klasörleme, opsiyonel dava adı/referans no alanı — eski adıyla "klasör", davaya özel çalışma alanı olarak yeniden çerçevelenmiştir)
- **Kaldığın Yerden Devam Et**: son görüntülenen karar/arama, yerel state ile
- Hesabım: profil, abonelik durumu, kullanım istatistiği
- Abonelik: RevenueCat + Apple/Google IAP (haftalık/aylık/yıllık, 3 gün deneme)
- Premium sınırlaması: sınırsız arama, gelişmiş filtre, semantik arama, sınırsız Dava Dosyası, Alıntı Kopyala
- Hesap silme, Satın Alımları Geri Yükle (mağaza zorunluluğu)
- Gerçek, barındırılan Gizlilik Politikası / Kullanım Koşulları sayfaları
- Yalnızca Türkçe, yalnızca dark tema

**MVP kapsamında OLMAYANLAR (v1.1/v2'ye ertelendi):**
- Canlı/gerçek zamanlı AI özet üretimi, RAG/citation sistemi, çoklu AI model desteği
- PDF dışa aktarma
- Takım/kurum (çoklu kullanıcı) hesapları
- Offline-first senkronizasyon motoru
- Bildirim tabanlı kayıtlı arama uyarıları (yalnızca işlemsel bildirimler — yenileme, deneme bitişi — MVP'de var)
- Çok seviyeli/paylaşılan Dava Dosyaları
- Arama teriminin tam metinde vurgulanması
- Web companion uygulama, ayrı admin panel uygulaması
- Duruşma takvimi, ana ekran widget'ı, karşılaştırmalı AI özet, sorgu genişletme, "günün içtihadı", yıllık kullanım özeti

Bu listenin dışına çıkan hiçbir özellik onay alınmadan kodlanmaz.

## 3. Teknoloji Yığını

- **Mobil**: Expo (managed workflow) + React Native + TypeScript (strict mode)
- **Routing**: Expo Router
- **Stil**: NativeWind
- **Sunucu state**: TanStack Query
- **İstemci state**: Zustand (minimal sayıda store)
- **Form/validasyon**: React Hook Form + Zod
- **İkon**: lucide-react-native
- **Font**: expo-font + @expo-google-fonts/manrope + @expo-google-fonts/source-sans-3
- **Görsel**: expo-image
- **Safe area**: react-native-safe-area-context
- **Gesture/animasyon**: react-native-reanimated + react-native-gesture-handler (yalnızca gerçekten gerekli yerlerde — ör. Dava Dosyası kartlarında kaydırma aksiyonu)
- **Backend**: Supabase (Postgres + Auth + Storage + Edge Functions)
- **Abonelik**: RevenueCat (expo-purchases)
- **Hata takibi**: Sentry
- **Bildirim**: Expo Push Notifications
- **Build/Yayın**: EAS Build + EAS Submit + EAS Update

**Kesinlikle kullanılmayacaklar**: Docker, Kubernetes, Nginx, Redis, Kafka, self-hosted herhangi bir servis, ayrı sunucu/VM.

## 4. Dosya Yapısı

```
mobile/                            (Expo projesi kökü)
└── src/
    ├── app/                        (Expo Router — yalnızca ekran giriş noktaları/kompozisyon)
    │   ├── _layout.tsx
    │   ├── index.tsx
    │   ├── (auth)/giris.tsx
    │   ├── (tabs)/
    │   │   ├── _layout.tsx
    │   │   ├── ara/{_layout,index,sonuclar,gelismis-filtreleme}.tsx
    │   │   ├── kayitlilarim/index.tsx
    │   │   └── hesabim/index.tsx
    │   ├── karar/[id].tsx
    │   └── abonelik.tsx
    ├── components/
    │   ├── ui/            (Button, Card, Badge, IconCircle, Input, Chip, StatBox…)
    │   ├── layout/         (ScreenHeader, StickyFooterBar, CustomTabBar)
    │   ├── search/          (SearchBar, RecentSearchChip, CategoryGridCard)
    │   ├── filters/          (FilterCheckboxGroup, DateRangeSlider, KeywordTagInput)
    │   ├── decisions/         (DecisionResultCard, DecisionSummaryCard, SimilarDecisionCard, CopyCitationButton)
    │   ├── account/            (ProfileHeaderCard, SubscriptionStatusCard, UsageStatBox)
    │   └── subscription/        (PlanOptionRow, FeatureChecklistItem)
    ├── theme/               (colors.ts, typography.ts, spacing.ts, index.ts)
    ├── hooks/                (useSearch, useDecision, useSavedDecisions, useAuth, useSubscription)
    ├── services/              (supabase.ts, searchService.ts, decisionService.ts, folderService.ts…)
    ├── stores/                 (searchFilterStore.ts, uiStore.ts)
    ├── types/                   (decision.ts, user.ts, subscription.ts, search.ts)
    ├── utils/                    (formatters.ts, validation.ts)
    ├── constants/                 (lawAreas.ts, chambers.ts)
    └── global.css                  (Tailwind/NativeWind giriş noktası)

html-export/                      (yalnızca tasarım referansı — dokunulmaz)
CLAUDE.md
```

Not: Expo Router'ın route kökü `app/` proje kökünde değil, `src/app/`'dadır (Metro bunu otomatik algılar). `src/app/` içine iş mantığı yazılmaz; her ekran `src/` altındaki diğer klasörlerdeki hook/component'leri çağıran ince bir kompozisyon katmanıdır.

## 5. Kod Standartları

- TypeScript strict mode zorunlu; `any` kullanılmaz (gerekirse `unknown` + tip daraltma).
- ESLint + Prettier kurallarına uyulur; hatalı/uyarılı kod commit edilmez.
- Fonksiyon, değişken ve component isimleri açıklayıcıdır, kısaltma kullanılmaz.
- Bir dosyada tek bir ana export (component/hook/servis) bulunur.
- Yorum satırı yalnızca "neden" sorusuna cevap gerektiğinde yazılır; "ne yaptığı" zaten okunur kod ile anlaşılmalıdır.
- Bir kalıp üçüncü kez tekrar etmeden component/hook'a çıkarılmaz — erken soyutlama yapılmaz.

## 6. React Native Kuralları

- Ekranlar (`app/`) yalnızca kompozisyon içerir; state/iş mantığı `src/hooks` ve `src/services` içinde yaşar.
- Liste render'ları `FlatList` ile yapılır; uzun listeler `map()` ile doğrudan render edilmez.
- `useSafeAreaInsets` tüm ekranlarda tutarlı kullanılır; HTML referansındaki manuel `pt-12/pt-14` boşlukları burada native karşılığıyla çözülür.
- Yeni bir native modül eklemeden önce Expo SDK içinde hazır bir karşılığı olup olmadığı kontrol edilir.

## 7. TypeScript Kuralları

- `tsconfig.json`'da `strict: true`, `noImplicitAny`, `strictNullChecks` açıktır.
- Tüm veri modelleri (`Decision`, `SavedDecision`, `DavaDosyasi`, `Subscription`, `Profile` vb.) `src/types/` altında tek kaynaktan tanımlanır.
- Supabase/API yanıtları `any` ile tiplenmez; Zod şeması ile doğrulanır, tip oradan türetilir (`z.infer`).

## 8. Component Kuralları

- `src/components/ui/` yalnızca tasarım sistemine ait, iş mantığından bağımsız bileşenler içerir.
- Domain component'leri (`search/`, `filters/`, `decisions/`, `account/`, `subscription/`) yalnızca ilgili ekran/akışla sınırlı kalır, `ui/` ile karışmaz.
- Her component tek sorumluluk taşır; 150-200 satırı aşan component'ler bölünür.
- Prop sayısı 6-7'yi aştığında tek bir obje prop'a (`props: XProps`) geçilir.

## 9. State Yönetimi Kuralları

- Sunucu verisi (arama sonucu, karar detayı, kayıtlı kararlar, abonelik durumu) → **TanStack Query**.
- Yalnızca UI'a özel state (aktif filtre seçimi, modal açık/kapalı, son görüntülenen karar id'si) → **Zustand**, minimal sayıda store ile.
- Redux, MobX veya başka bir state kütüphanesi eklenmez.
- Global state'e yalnızca gerçekten birden fazla ekranın ihtiyaç duyduğu veri konur; ekrana özel state component içinde kalır.

## 10. UI Prensipleri

- `html-export/` klasöründeki tasarım birebir referans alınır; renk, tipografi, radius, spacing değerleri `src/theme/` içinde **tek kaynaktan** tanımlanır (background `#081321`, primary `#35B9C9`, accent `#D7AE58`, success `#51C58B`, destructive `#EF6C6C`, font-heading Manrope, font-body Source Sans 3, radius `12px`).
- MVP'de yalnızca dark tema, yalnızca Türkçe dil desteği vardır.
- Her interaktif elemanda `accessibilityLabel` bulunur, dokunma alanı en az 44x44pt'tir.
- Marka tonu: güvenilir, sade, "deneyimli bir meslektaş" hissi. Sonuç garantisi çağrıştıran ifadeler ("davanızı kazandırır" vb.) hiçbir metinde kullanılmaz.

## 11. Solo Founder Prensipleri

- Her yeni bağımlılık/servis eklenmeden önce soru sorulur: **"Bunu tek kişi hafta sonu tatilinde tek başına tamir edebilir mi?"** Cevap hayırsa eklenmez.
- Managed servis, self-hosted alternatife her zaman tercih edilir.
- Hiçbir sunucu/VM/container işletilmez.
- Ayrı bir admin panel uygulaması yazılmaz; Supabase Studio bu amaçla kullanılır.
- Yeni bir üçüncü parti servis eklemeden önce mevcut yığında (Supabase/Expo/RevenueCat/Sentry) karşılığı olup olmadığı kontrol edilir.

## 12. Performans Kuralları

- Liste ekranlarında virtualization (`FlatList`) zorunludur.
- Görsellerde `expo-image` kullanılır, boyut ve placeholder belirtilir.
- `React.memo` / `useMemo` / `useCallback` yalnızca ölçülebilir bir performans sorunu tespit edildiğinde eklenir — önden optimizasyon yapılmaz.
- Supabase sorgularında yalnızca ihtiyaç duyulan kolonlar seçilir (`select()` ile sınırlandırılır), gereksiz `select('*')` kullanılmaz.

## 13. Güvenlik Prensipleri

- Hiçbir API anahtarı/secret client koduna gömülmez; AI ve hassas çağrılar her zaman bir Supabase Edge Function arkasında kalır.
- Supabase `service_role` anahtarı asla client'a taşınmaz.
- Kullanıcıya özel tüm tablolarda Row Level Security zorunludur (`auth.uid() = user_id`).
- Abonelik iptali her zaman gerçek mağaza yönetim sayfasına yönlendirilir; uygulama içi sahte iptal akışı yazılmaz.
- Kullanıcı girdisi (arama sorgusu, not, dava adı) hiçbir zaman sanitize edilmeden doğrudan bir LLM prompt'una eklenmez.
- AI hiçbir zaman hukuki tavsiye vermez; yalnızca içtihat özetler/bulur — bu sınır hem prompt tasarımında hem UI metinlerinde korunur.

## 14. Git Commit Kuralları

- Her commit tek, anlaşılır bir değişikliği temsil eder (bir ekran, bir bileşen, bir düzeltme).
- Commit mesajları Conventional Commits formatındadır: `feat:`, `fix:`, `refactor:`, `chore:`, `docs:`.
- Her sprint sonunda `main` branch derlenebilir ve çalışır durumda olmalıdır — kırık/yarım kod commit edilmez.
- Çok dosyalı, birden fazla değişikliği birleştiren "mega commit" yapılmaz; iş küçük, gözden geçirilebilir parçalara bölünür.

## 15. Yapılmaması Gerekenler

- `html-export/` klasöründeki hiçbir dosya değiştirilmez — yalnızca görsel/içerik referansıdır.
- Docker, Kubernetes, Nginx, Redis, Kafka veya herhangi bir self-hosted altyapı kurulmaz.
- Redux, MobX gibi ek state kütüphaneleri eklenmez.
- Bölüm 2'de "MVP dışı" olarak listelenen hiçbir özellik onay alınmadan kodlanmaz.
- Gereksiz yorum satırı, gereksiz soyutlama, kullanılmayan kod bırakılmaz.
- `any` tipi veya gerekçesiz `@ts-ignore` kullanılmaz.
- Onay alınmadan yeni bağımlılık/kütüphane eklenmez.
- Onay alınmadan büyük mimari değişiklik yapılmaz — önce plan sunulur, onay sonrası uygulanır.
- Çalışma sırası her zaman şu şekildedir: Analiz → Plan → Onay → Kodlama → Test → Sonuç raporu.
