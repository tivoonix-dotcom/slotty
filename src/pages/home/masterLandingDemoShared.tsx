import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

const LANDING_DEMO_MOBILE_MQ = '(max-width: 1023px)';

type LandingDemoLayoutValue = {
  mobile: boolean;
};

const LandingDemoLayoutContext = createContext<LandingDemoLayoutValue>({ mobile: false });

export function LandingDemoLayoutProvider({
  mobile,
  children,
}: {
  mobile: boolean;
  children: ReactNode;
}) {
  return (
    <LandingDemoLayoutContext.Provider value={{ mobile }}>{children}</LandingDemoLayoutContext.Provider>
  );
}

export function useLandingDemoLayout(): LandingDemoLayoutValue {
  return useContext(LandingDemoLayoutContext);
}

/** Мобильная вёрстка демо кабинета (< lg), как на телефоне. */
export function useLandingDemoMobileLayout(): boolean {
  const [mobile, setMobile] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(LANDING_DEMO_MOBILE_MQ).matches : false,
  );

  useEffect(() => {
    const mq = window.matchMedia(LANDING_DEMO_MOBILE_MQ);
    const apply = () => setMobile(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  return mobile;
}

export function useLandingDemoReducedMotion(): boolean {
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = () => setReducedMotion(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);
  return reducedMotion;
}

export async function landingDemoTap(
  setPressing: (v: boolean) => void,
  waitMs = 340,
): Promise<void> {
  setPressing(true);
  await new Promise((r) => setTimeout(r, waitMs));
  setPressing(false);
}

export async function landingDemoType(
  setter: (v: string) => void,
  value: string,
  charMs = 55,
): Promise<void> {
  setter('');
  for (let i = 1; i <= value.length; i += 1) {
    setter(value.slice(0, i));
    await new Promise((r) => setTimeout(r, charMs));
  }
}
