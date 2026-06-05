import { useCallback } from 'react';
import { StatusCenterView } from '../../../features/systemStatus/StatusCenterView';
import { fetchPublicStatus } from '../../../features/systemStatus/systemStatusApi';
import { ClientSettingsHeader } from './ClientSettingsHeader';
import { CLIENT_SETTINGS_PAGE_META } from './clientSettingsNav';

const meta = CLIENT_SETTINGS_PAGE_META['system-status'];

export function ClientSettingsSystemStatusPage() {
  const load = useCallback(() => fetchPublicStatus(), []);

  return (
    <>
      <ClientSettingsHeader title={meta.title} description={meta.description} breadcrumb={meta.breadcrumb} />
      <StatusCenterView load={load} variant="cabinet" />
    </>
  );
}
