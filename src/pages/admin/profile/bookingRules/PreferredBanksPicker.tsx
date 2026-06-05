import { useMemo, useState } from 'react';
import { HiCheck, HiChevronDown, HiMagnifyingGlass } from 'react-icons/hi2';
import {
  POPULAR_BELARUS_BANKS,
  searchBelarusBanks,
  type BelarusBank,
} from '../../../../shared/payments/belarusBanks';
import { sheetFieldClass, sheetHintClass, sheetLabelClass } from '../adminProfileCabinetTheme';
import { needsPreferredBanks } from '../../../../shared/payments/paymentMethodCodes';

type Props = {
  paymentMethods: string[];
  selectedBankIds: string[];
  onToggleBank: (bankId: string) => void;
};

function BankCard({
  name,
  logoSrc,
  selected,
  onToggle,
}: {
  name: string;
  logoSrc: string;
  selected: boolean;
  onToggle: () => void;
}) {
  const [logoFailed, setLogoFailed] = useState(false);

  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onToggle}
      className={`relative flex min-h-[5.75rem] flex-col items-center justify-center gap-2 rounded-[16px] border-2 p-3 text-center transition active:scale-[0.98] ${
        selected
          ? 'border-[#F47C8C] bg-[#FFF1F4] text-[#111827] shadow-[0_0_0_1px_rgba(244,124,140,0.15)]'
          : 'border-transparent bg-[#FAFAFA] text-[#111827] hover:bg-[#F5F5F5]'
      }`}
    >
      {selected ? (
        <span
          className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#F47C8C] text-white"
          aria-hidden
        >
          <HiCheck className="h-3 w-3" />
        </span>
      ) : null}
      <span className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-[14px] bg-white ring-1 ring-[#EEEEEE]">
        {!logoFailed ? (
          <img
            src={logoSrc}
            alt=""
            className="h-8 w-8 object-contain"
            loading="lazy"
            onError={() => setLogoFailed(true)}
          />
        ) : (
          <span className="text-[11px] font-bold text-[#9CA3AF]">{name.slice(0, 2)}</span>
        )}
      </span>
      <span className="line-clamp-2 text-[11px] font-semibold leading-snug">{name}</span>
    </button>
  );
}

function BankGrid({
  banks,
  selectedBankIds,
  onToggleBank,
}: {
  banks: readonly BelarusBank[];
  selectedBankIds: string[];
  onToggleBank: (bankId: string) => void;
}) {
  if (!banks.length) {
    return <p className="text-[13px] text-[#9CA3AF]">Банки не найдены</p>;
  }
  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
      {banks.map((bank) => (
        <BankCard
          key={bank.id}
          name={bank.name}
          logoSrc={bank.logoSrc}
          selected={selectedBankIds.includes(bank.id)}
          onToggle={() => onToggleBank(bank.id)}
        />
      ))}
    </div>
  );
}

export function PreferredBanksPicker({ paymentMethods, selectedBankIds, onToggleBank }: Props) {
  const [showAll, setShowAll] = useState(false);
  const [query, setQuery] = useState('');

  const showBanks = needsPreferredBanks(paymentMethods);
  const hasCard = paymentMethods.includes('Карта');
  const hasTransfer = paymentMethods.includes('Перевод');

  const heading = useMemo(() => {
    if (hasCard && hasTransfer) {
      return 'Какие банки удобнее для оплаты картой или перевода?';
    }
    if (hasCard) {
      return 'Какие банки удобнее для оплаты картой или перевода?';
    }
    return 'На карты каких банков удобнее принимать перевод?';
  }, [hasCard, hasTransfer]);

  const filteredPopular = useMemo(
    () => searchBelarusBanks(query).filter((b) => b.popular),
    [query],
  );
  const filteredOther = useMemo(
    () => searchBelarusBanks(query).filter((b) => !b.popular),
    [query],
  );

  if (!showBanks) return null;

  return (
    <div className="mt-5">
      <p className={sheetLabelClass}>Предпочтительные банки</p>
      <p className={`mt-1 ${sheetHintClass}`}>{heading}</p>
      <p className={`mt-2 ${sheetHintClass}`}>
        Выберите банки, через которые мастеру удобнее принимать оплату. Клиент увидит логотипы и
        сможет выбрать удобный вариант.
      </p>

      <div className="relative mt-3">
        <HiMagnifyingGlass
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]"
          aria-hidden
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Поиск банка"
          className={`${sheetFieldClass} pl-10`}
        />
      </div>

      {filteredPopular.length > 0 ? (
        <div className="mt-4">
          <p className="text-[12px] font-semibold uppercase tracking-wide text-[#9CA3AF]">
            Популярные банки
          </p>
          <div className="mt-2.5">
            <BankGrid
              banks={filteredPopular}
              selectedBankIds={selectedBankIds}
              onToggleBank={onToggleBank}
            />
          </div>
        </div>
      ) : null}

      {filteredOther.length > 0 ? (
        <div className="mt-4">
          <button
            type="button"
            onClick={() => setShowAll((v) => !v)}
            className="flex w-full items-center justify-between rounded-[12px] bg-[#F5F5F5] px-3.5 py-2.5 text-left text-[13px] font-semibold text-[#374151] transition hover:bg-[#EBEBEB]"
          >
            <span>{showAll || query.trim() ? 'Все банки' : `Все банки (${filteredOther.length})`}</span>
            <HiChevronDown
              className={`h-4 w-4 text-[#9CA3AF] transition ${showAll || query.trim() ? 'rotate-180' : ''}`}
              aria-hidden
            />
          </button>
          {showAll || query.trim() ? (
            <div className="mt-2.5">
              <BankGrid
                banks={filteredOther}
                selectedBankIds={selectedBankIds}
                onToggleBank={onToggleBank}
              />
            </div>
          ) : null}
        </div>
      ) : null}

      {selectedBankIds.length === 0 ? (
        <p className="mt-3 rounded-[12px] bg-[#FFFBEB] px-3.5 py-2.5 text-[12px] leading-relaxed text-[#92400E]">
          Можно сохранить без банков, но клиенту будет понятнее, если выбрать 1–3 удобных банка.
        </p>
      ) : null}
    </div>
  );
}

export function preferredBanksHeadingForMethods(methods: string[]): string | null {
  if (!needsPreferredBanks(methods)) return null;
  if (methods.includes('Карта') && methods.includes('Перевод')) {
    return 'Какие банки удобнее для оплаты картой или перевода?';
  }
  if (methods.includes('Карта')) {
    return 'Какие банки удобнее для оплаты картой или перевода?';
  }
  return 'На карты каких банков удобнее принимать перевод?';
}

/** @deprecated use POPULAR_BELARUS_BANKS from belarusBanks */
export { POPULAR_BELARUS_BANKS };
