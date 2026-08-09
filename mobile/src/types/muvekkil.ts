export type MuvekkilTuru = 'gercek' | 'tuzel';

export interface Muvekkil {
  id: string;
  ad: string;
  tur: MuvekkilTuru;
}

export interface MuvekkilListeItem {
  muvekkil: Muvekkil;
  dosyaSayisi: number;
  sonKullanilmaTarihi: string | null;
}
