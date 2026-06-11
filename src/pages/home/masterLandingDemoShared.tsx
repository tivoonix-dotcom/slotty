import { useEffect, useState } from 'react';

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
