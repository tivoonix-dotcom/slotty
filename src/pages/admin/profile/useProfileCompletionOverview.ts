import { useMemo } from 'react';
import { useAuth } from '../../../features/auth/AuthProvider';
import {
  computeProfileCompletionSections,
  type ProfileCompletionSectionsResult,
} from '../../../features/admin/lib/profileCompletionSections';
import { useAdminMasterCabinet } from '../AdminMasterCabinetContext';
import { useProfileCompletionSlots } from './useProfileCompletionSlots';

export function useProfileCompletionOverview(): ProfileCompletionSectionsResult & {
  showLoading: boolean;
} {
  const { profile } = useAuth();
  const { draft, useCabinetApi, cabinetLoading, publicationStatus } = useAdminMasterCabinet();
  const { activeBookableSlots, slotsLoading } = useProfileCompletionSlots(
    useCabinetApi,
    cabinetLoading,
  );

  const result = useMemo(
    () =>
      computeProfileCompletionSections({
        draft,
        publicationStatus,
        activeBookableSlots,
        useCabinetApi,
        cabinetLoading,
        slotsLoading,
        authProfile: profile,
      }),
    [
      activeBookableSlots,
      cabinetLoading,
      draft,
      profile,
      publicationStatus,
      slotsLoading,
      useCabinetApi,
    ],
  );

  const showLoading =
    useCabinetApi && (cabinetLoading || slotsLoading) && !result.readinessKnown;

  return { ...result, showLoading };
}
