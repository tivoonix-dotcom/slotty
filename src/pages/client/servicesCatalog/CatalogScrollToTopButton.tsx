import { useCallback, useEffect, useState, type ReactNode } from 'react';

import { HiAdjustmentsHorizontal, HiArrowUp } from 'react-icons/hi2';



const SCROLL_THRESHOLD_PX = 280;



const floatingFabPosition =

  'fixed z-[55] max-lg:bottom-[calc(3.5rem+env(safe-area-inset-bottom,0px)+0.75rem)] lg:bottom-6';



const floatingFabVisible = 'pointer-events-auto translate-y-0 opacity-100';

const floatingFabHidden = 'pointer-events-none translate-y-2 opacity-0';



const floatingBtnBadgeClass =

  'absolute right-0 top-0 z-20 flex h-[18px] min-w-[18px] translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white px-1 text-[10px] font-bold leading-none text-[#F47C8C] ring-2 ring-[#F47C8C]';



function readCatalogScrollY(): number {

  return (

    window.scrollY ||

    document.documentElement.scrollTop ||

    document.body.scrollTop ||

    0

  );

}



function useCatalogScrollFabVisible(threshold = SCROLL_THRESHOLD_PX): boolean {

  const [visible, setVisible] = useState(false);



  useEffect(() => {

    const onScroll = () => {

      setVisible(readCatalogScrollY() > threshold);

    };



    onScroll();

    window.addEventListener('scroll', onScroll, { passive: true, capture: true });

    window.visualViewport?.addEventListener('scroll', onScroll, { passive: true });

    return () => {

      window.removeEventListener('scroll', onScroll, true);

      window.visualViewport?.removeEventListener('scroll', onScroll);

    };

  }, [threshold]);



  return visible;

}



function CatalogScrollFab({

  visible,

  sideClass,

  ariaLabel,

  onClick,

  children,

  badge,

}: {

  visible: boolean;

  sideClass: string;

  ariaLabel: string;

  onClick: () => void;

  children: ReactNode;

  badge?: ReactNode;

}) {

  return (

    <button

      type="button"

      onClick={onClick}

      aria-label={ariaLabel}

      aria-hidden={!visible}

      tabIndex={visible ? 0 : -1}

      className={`catalog-scroll-fab group fixed h-12 w-12 overflow-visible transition-all duration-300 active:scale-95 ${floatingFabPosition} ${sideClass} ${

        visible ? floatingFabVisible : floatingFabHidden

      }`}

    >

      <span className="catalog-scroll-fab__ring" aria-hidden />

      <span className="catalog-scroll-fab__core relative z-10 flex h-full w-full items-center justify-center rounded-full border-2 border-[#F47C8C] bg-[#F47C8C] text-white shadow-[0_8px_24px_rgba(244,124,140,0.45)] ring-4 ring-white transition-all duration-300">

        {children}

      </span>

      {badge}

    </button>

  );

}



type ScrollFilterButtonProps = {

  onOpenFilters: () => void;

  activeFilterCount?: number;

};



export function CatalogScrollFilterButton({

  onOpenFilters,

  activeFilterCount = 0,

}: ScrollFilterButtonProps) {

  const visible = useCatalogScrollFabVisible();



  return (

    <CatalogScrollFab

      visible={visible}

      sideClass="max-lg:left-3 lg:left-6 xl:left-10"

      ariaLabel={

        activeFilterCount > 0 ? `Фильтры, выбрано: ${activeFilterCount}` : 'Фильтры'

      }

      onClick={onOpenFilters}

      badge={

        activeFilterCount > 0 ? (

          <span className={floatingBtnBadgeClass}>

            {activeFilterCount > 9 ? '9+' : activeFilterCount}

          </span>

        ) : null

      }

    >

      <HiAdjustmentsHorizontal className="h-[22px] w-[22px]" aria-hidden />

    </CatalogScrollFab>

  );

}



export function CatalogScrollToTopButton() {

  const visible = useCatalogScrollFabVisible();



  const scrollTop = useCallback(() => {

    window.scrollTo({ top: 0, behavior: 'smooth' });

  }, []);



  return (

    <CatalogScrollFab

      visible={visible}

      sideClass="max-lg:right-3 lg:right-6 xl:right-10"

      ariaLabel="Наверх"

      onClick={scrollTop}

    >

      <HiArrowUp className="h-[22px] w-[22px]" aria-hidden />

    </CatalogScrollFab>

  );

}


