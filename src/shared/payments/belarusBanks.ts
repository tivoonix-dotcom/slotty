export type BelarusBank = {
  id: string;
  name: string;
  shortName?: string;
  logoSrc: string;
  popular?: boolean;
};

const BANK_LOGO_BASE = '/photos/banks';

export const BELARUS_BANKS: readonly BelarusBank[] = [
  { id: 'belarusbank', name: 'Беларусбанк', logoSrc: `${BANK_LOGO_BASE}/belarusbank.jpg`, popular: true },
  {
    id: 'belagroprombank',
    name: 'Белагропромбанк',
    shortName: 'Белагро',
    logoSrc: `${BANK_LOGO_BASE}/belagroprombank.png`,
    popular: true,
  },
  {
    id: 'belinvestbank',
    name: 'Белинвестбанк',
    shortName: 'Белинвест',
    logoSrc: `${BANK_LOGO_BASE}/belinvestbank.png`,
    popular: true,
  },
  { id: 'priorbank', name: 'Приорбанк', logoSrc: `${BANK_LOGO_BASE}/priorbank.webp`, popular: true },
  { id: 'belveb', name: 'Банк БелВЭБ', shortName: 'БелВЭБ', logoSrc: `${BANK_LOGO_BASE}/belveb.png` },
  {
    id: 'paritetbank',
    name: 'Паритетбанк',
    logoSrc: `${BANK_LOGO_BASE}/paritetbank.jpg`,
    popular: true,
  },
  { id: 'bnb', name: 'БНБ-Банк', logoSrc: `${BANK_LOGO_BASE}/bnb.png` },
  {
    id: 'belgazprombank',
    name: 'Белгазпромбанк',
    shortName: 'БГПБ',
    logoSrc: `${BANK_LOGO_BASE}/belgazprombank.png`,
    popular: true,
  },
  { id: 'rrb', name: 'Банк РРБ', shortName: 'РРБ', logoSrc: `${BANK_LOGO_BASE}/rrb.png` },
  { id: 'mtbank', name: 'МТБанк', logoSrc: `${BANK_LOGO_BASE}/mtbank.png`, popular: true },
  { id: 'technobank', name: 'Технобанк', logoSrc: `${BANK_LOGO_BASE}/technobank.jpg` },
  { id: 'reshenie', name: 'Банк Решение', logoSrc: `${BANK_LOGO_BASE}/reshenie.png` },
  {
    id: 'vtb',
    name: 'Банк ВТБ Беларусь',
    shortName: 'ВТБ',
    logoSrc: `${BANK_LOGO_BASE}/vtb.jpg`,
    popular: true,
  },
  { id: 'alfabank', name: 'Альфа-Банк', logoSrc: `${BANK_LOGO_BASE}/alfabank.png`, popular: true },
  { id: 'dabrabyt', name: 'Банк Дабрабыт', logoSrc: `${BANK_LOGO_BASE}/dabrabyt.jpg` },
  { id: 'statusbank', name: 'СтатусБанк', logoSrc: `${BANK_LOGO_BASE}/statusbank.png` },
  { id: 'neo', name: 'Нео Банк Азия', shortName: 'Neo', logoSrc: `${BANK_LOGO_BASE}/neo.png` },
  { id: 'bsb', name: 'БСБ Банк', logoSrc: `${BANK_LOGO_BASE}/bsb.png` },
  { id: 'tkbank', name: 'ТК Банк', logoSrc: `${BANK_LOGO_BASE}/tkbank.jpg` },
  { id: 'sber', name: 'Сбер Банк', logoSrc: `${BANK_LOGO_BASE}/sber.jpg`, popular: true },
] as const;

export const BELARUS_BANK_IDS = new Set(BELARUS_BANKS.map((b) => b.id));

export const POPULAR_BELARUS_BANKS = BELARUS_BANKS.filter((b) => b.popular);

export function getBelarusBankById(id: string): BelarusBank | undefined {
  return BELARUS_BANKS.find((b) => b.id === id);
}

export function resolveBelarusBanks(ids: string[]): BelarusBank[] {
  const seen = new Set<string>();
  const out: BelarusBank[] = [];
  for (const id of ids) {
    if (seen.has(id)) continue;
    const bank = getBelarusBankById(id);
    if (!bank) continue;
    seen.add(id);
    out.push(bank);
  }
  return out;
}

export function filterValidBankIds(ids: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const id of ids) {
    if (!BELARUS_BANK_IDS.has(id) || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}

export function searchBelarusBanks(query: string): BelarusBank[] {
  const q = query.trim().toLowerCase();
  if (!q) return [...BELARUS_BANKS];
  return BELARUS_BANKS.filter(
    (b) =>
      b.name.toLowerCase().includes(q) ||
      b.id.toLowerCase().includes(q) ||
      b.shortName?.toLowerCase().includes(q),
  );
}
