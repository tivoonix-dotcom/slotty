import { LoadingVideo } from '../../../shared/ui/LoadingVideo';
import { ADMIN_SIDEBAR_OVERLAY_INSET } from '../adminCabinetLayout';

type Props = {
  show: boolean;
  className?: string;
};

/** Загрузка по центру рабочей области кабинета (не вверху страницы). */
export function AdminContentLoadingOverlay({ show, className = '' }: Props) {
  if (!show) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-white/94 backdrop-blur-[3px] ${ADMIN_SIDEBAR_OVERLAY_INSET} ${className}`.trim()}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <LoadingVideo size="lg" />
    </div>
  );
}
