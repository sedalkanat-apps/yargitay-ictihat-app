// PRD v1.0-R2 Bölüm 12 — Ücretsiz plan sınırı. Henüz gerçek abonelik/plan
// state altyapısı (Hesabım, RevenueCat) kurulmadığı için bu değer hiçbir
// ekranda çağrılmıyor; ileride bağlanacak temiz bir entegrasyon noktasıdır.
export const UCRETSIZ_PLAN_MUVEKKIL_LIMITI = 3;

export function ucretsizLimitAsildiMi(muvekkilSayisi: number, isPremium: boolean): boolean {
  if (isPremium) return false;
  return muvekkilSayisi >= UCRETSIZ_PLAN_MUVEKKIL_LIMITI;
}
