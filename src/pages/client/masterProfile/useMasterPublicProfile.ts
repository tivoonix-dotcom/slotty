import { useEffect, useMemo, useState } from 'react';
import { getApiBaseUrl } from '../../../shared/api/backendClient';
import {
  fetchMasterPublicDetail,
  mapCareerToDraftItems,
  mapCertificatesFromDetail,
  mapMasterDetailToDemoProfile,
  mapPortfolioFromDetail,
} from '../../../features/masters/api/masterPublicApi';
import { getDemoMasterProfile } from '../../../features/services/model/demoMasters';
import type { ExtendedMasterProfile } from './types';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isMasterUuid(id: string): boolean {
  return UUID_RE.test(id);
}

export function useMasterPublicProfile(masterId: string) {
  const [apiProfile, setApiProfile] = useState<ExtendedMasterProfile | null | undefined>(undefined);
  const [reloadKey, setReloadKey] = useState(0);

  const demoMaster = useMemo(() => {
    if (!masterId) return undefined;
    if (getApiBaseUrl() && isMasterUuid(masterId)) return undefined;
    return getDemoMasterProfile(masterId) as ExtendedMasterProfile | undefined;
  }, [masterId]);

  useEffect(() => {
    if (!masterId) {
      setApiProfile(undefined);
      return;
    }
    if (!getApiBaseUrl() || !isMasterUuid(masterId)) {
      setApiProfile(undefined);
      return;
    }

    let cancelled = false;
    setApiProfile(undefined);

    void (async () => {
      try {
        const detail = await fetchMasterPublicDetail(masterId);
        if (cancelled) return;
        const base = mapMasterDetailToDemoProfile(detail);
        setApiProfile({
          ...base,
          careerItems: mapCareerToDraftItems(detail.career),
          certificates: mapCertificatesFromDetail(detail),
          portfolio: mapPortfolioFromDetail(detail),
          bookingRules: detail.bookingRules?.bookingRules ?? undefined,
          cancellationPolicy: detail.bookingRules?.cancellationPolicy ?? undefined,
          paymentNote: detail.bookingRules?.paymentNote ?? undefined,
          paymentMethods: detail.bookingRules?.paymentMethods?.length
            ? detail.bookingRules.paymentMethods
            : undefined,
        });
      } catch {
        if (!cancelled) setApiProfile(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [masterId, reloadKey]);

  const master = useMemo((): ExtendedMasterProfile | undefined => {
    if (getApiBaseUrl() && masterId && isMasterUuid(masterId)) {
      return apiProfile === undefined ? undefined : apiProfile ?? undefined;
    }
    return demoMaster;
  }, [apiProfile, demoMaster, masterId]);

  const loading = Boolean(getApiBaseUrl() && masterId && isMasterUuid(masterId) && apiProfile === undefined);
  const error = Boolean(getApiBaseUrl() && masterId && isMasterUuid(masterId) && apiProfile === null);

  return { master, loading, error, reload: () => setReloadKey((k) => k + 1) };
}
