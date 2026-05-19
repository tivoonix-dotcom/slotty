import { useEffect, useRef } from 'react';
import { useClientErrorModal } from '../ClientErrorModalContext';

/** Показывает модалку при ошибке загрузки каталога (один раз на каждое новое сообщение). */
export function useCatalogErrorModal(
  error: string | null,
  reload: () => void | Promise<void>,
  title = 'Каталог',
) {
  const { showError } = useClientErrorModal();
  const lastShown = useRef<string | null>(null);

  useEffect(() => {
    if (!error) {
      lastShown.current = null;
      return;
    }
    if (lastShown.current === error) return;
    lastShown.current = error;
    showError(error, { title, onRetry: () => void reload() });
  }, [error, reload, showError, title]);
}
