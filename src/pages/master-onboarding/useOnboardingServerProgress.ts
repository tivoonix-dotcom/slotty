import { useCallback, useEffect, useRef } from 'react';
import {
  fetchMasterOnboardingProgress,
  patchMasterOnboardingProgress,
  type OnboardingProgressDto,
} from '../../features/master-onboarding/api/onboardingProgressApi';
import { getApiBaseUrl } from '../../shared/api/backendClient';

const SYNC_DEBOUNCE_MS = 800;

type SyncInput = {
  currentStep: number;
  furthestStep: number;
  selectedTariff?: 'basic' | 'pro_purchase';
  draftSnapshot?: Record<string, unknown> | null;
};

type Options = {
  enabled: boolean;
  isAuthenticated: boolean;
  onLoaded?: (progress: OnboardingProgressDto | null) => void;
};

export function useOnboardingServerProgress({ enabled, isAuthenticated, onLoaded }: Options) {
  const progressRef = useRef<OnboardingProgressDto | null>(null);
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (!enabled || !isAuthenticated || !getApiBaseUrl()) return;
    if (loadedRef.current) return;
    loadedRef.current = true;

    let cancelled = false;
    void (async () => {
      try {
        const progress = await fetchMasterOnboardingProgress();
        if (cancelled) return;
        progressRef.current = progress;
        onLoaded?.(progress);
      } catch {
        onLoaded?.(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled, isAuthenticated, onLoaded]);

  const queueSync = useCallback(
    (input: SyncInput) => {
      if (!isAuthenticated || !getApiBaseUrl()) return;
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
      syncTimerRef.current = setTimeout(() => {
        void patchMasterOnboardingProgress({
          currentStep: input.currentStep,
          furthestStep: input.furthestStep,
          selectedTariff: input.selectedTariff,
          draftSnapshot: input.draftSnapshot,
        })
          .then((p) => {
            progressRef.current = p;
          })
          .catch(() => {});
      }, SYNC_DEBOUNCE_MS);
    },
    [isAuthenticated],
  );

  useEffect(() => {
    return () => {
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    };
  }, []);

  return { queueSync, progressRef };
}
