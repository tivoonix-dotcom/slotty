import { useCallback, useState, type FC, type FormEvent } from 'react';
import { HiMagnifyingGlass } from 'react-icons/hi2';
import { homePinkBtn } from './homeTheme';

const HERO_BG = '/photos/heroo.webp';

const heroMasterBtn =
  'inline-flex min-h-12 w-full items-center justify-center rounded-full border-0 bg-[#F1EFEF] px-6 text-[15px] font-semibold text-[#374151] shadow-[0_2px_12px_rgba(17,24,39,0.06)] transition hover:bg-[#E8E6E6] active:scale-[0.98] sm:w-auto sm:min-w-[10.5rem]';

export type HomeHeroProps = {
  onFindMaster: () => void;
  onBecomeMaster: () => void;
  onSearch: (query: string) => void;
  masterCtaLabel: string;
};

export const HomeHero: FC<HomeHeroProps> = ({
  onFindMaster,
  onBecomeMaster,
  onSearch,
  masterCtaLabel,
}) => {
  const [query, setQuery] = useState('');

  const submitSearch = useCallback(
    (e?: FormEvent) => {
      e?.preventDefault();
      onSearch(query.trim());
    },
    [onSearch, query],
  );

  return (
    <section className="scroll-mt-28" aria-labelledby="home-hero-heading">
      <div
        className="
          relative isolate w-full overflow-hidden
          rounded-[24px]
          shadow-[0_20px_56px_rgba(244,124,140,0.14),0_8px_32px_rgba(17,24,39,0.06)]
          ring-1 ring-[#F47C8C]/10
          min-h-[clamp(560px,78dvh,680px)]
          sm:min-h-[620px]
          sm:rounded-[28px]
          lg:min-h-[720px]
        "
        style={{
          backgroundImage: `url(${HERO_BG})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        <div
          className="
            relative z-10 mx-auto flex min-h-[inherit] w-full max-w-[36rem]
            flex-col items-center justify-center px-5 py-10 text-center
            sm:max-w-[42rem] sm:px-8 sm:py-12
          "
        >
          <h1
            id="home-hero-heading"
            className="max-w-[22rem] text-balance text-[clamp(1.65rem,5.5vw,2.5rem)] font-bold leading-[1.06] tracking-[-0.04em] text-[#111827] [text-shadow:0_1px_20px_rgba(255,255,255,0.9)] sm:max-w-[32rem]"
          >
            Запишитесь к мастеру за пару кликов
          </h1>

          <form
            className="mt-6 hidden w-full max-w-[min(100%,26rem)] sm:block sm:max-w-[28rem]"
            onSubmit={submitSearch}
          >
            <div
              className="
                flex items-center gap-1 rounded-full
                bg-white/95 p-1.5 pl-3
                shadow-[0_8px_32px_rgba(17,24,39,0.08),0_0_0_2px_rgba(255,255,255,0.9)]
                ring-1 ring-[#F3F4F6]
                backdrop-blur-md
              "
            >
              <HiMagnifyingGlass className="h-5 w-5 shrink-0 text-[#9CA3AF]" aria-hidden />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Услуга, мастер или салон"
                className="min-w-0 flex-1 border-0 bg-transparent py-2.5 text-left text-[15px] text-[#111827] outline-none placeholder:text-[#9CA3AF]"
                aria-label="Поиск услуги, мастера или салона"
              />
              <button
                type="submit"
                className={`shrink-0 px-5 py-2.5 ${homePinkBtn} text-[14px] sm:text-[15px]`}
              >
                Найти
              </button>
            </div>
          </form>

          <div className="mt-6 flex w-full max-w-[20rem] flex-col items-center gap-2.5 sm:mt-7 sm:max-w-[24rem] sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={() => onFindMaster()}
              className={`w-full sm:flex-1 ${homePinkBtn} min-h-12 px-7 text-[15px]`}
            >
              Найти мастера
            </button>
            <button type="button" onClick={() => onBecomeMaster()} className={`${heroMasterBtn} sm:flex-1`}>
              {masterCtaLabel}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
