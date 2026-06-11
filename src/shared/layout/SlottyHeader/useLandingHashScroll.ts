import { useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { HUB_PATH, MASTER_START_PATH } from '../../../app/paths';
import {
  isLandingHowTab,
  isLandingMastersTab,
  LANDING_ANCHOR_FOR_MASTERS,
  LANDING_ANCHOR_HOW,
} from './headerNav';

function resolveLandingScrollTarget(hash: string): string | null {
  const id = hash.replace(/^#/, '');
  if (!id) return null;

  if (isLandingHowTab(id) || id === LANDING_ANCHOR_HOW) return 'how-it-works';
  if (isLandingMastersTab(id) || id === LANDING_ANCHOR_FOR_MASTERS) return 'for-masters';
  return id;
}

/** Прокрутка к якорю после перехода между лендингами `/book` и `/master/start`. */
export function useLandingHashScroll() {
  const { pathname, hash } = useLocation();

  useLayoutEffect(() => {
    const onLanding = pathname === HUB_PATH || pathname === '/' || pathname === MASTER_START_PATH;
    if (!onLanding || !hash) return;

    const targetId = resolveLandingScrollTarget(hash);
    if (!targetId) return;

    const scroll = () => {
      document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    requestAnimationFrame(scroll);
    const t = window.setTimeout(scroll, 120);
    return () => window.clearTimeout(t);
  }, [pathname, hash]);
}
