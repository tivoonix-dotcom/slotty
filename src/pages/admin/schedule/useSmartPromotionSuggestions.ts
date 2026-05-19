import { useCallback, useEffect, useState } from 'react';
import {
  fetchSmartPromotionSuggestions,
  type SmartPromotionSuggestionsResponse,
} from '../../../features/admin/api/smartPromotionSuggestionsApi';
import { getApiBaseUrl } from '../../../shared/api/backendClient';

export type SmartPromotionSuggestionsState =
  | { status: 'idle' }
  | { status: 'skipped' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ok'; data: SmartPromotionSuggestionsResponse };

export function useSmartPromotionSuggestions(enabled: boolean) {
  const [state, setState] = useState<SmartPromotionSuggestionsState>(
    enabled ? { status: 'loading' } : { status: 'skipped' },
  );

  const reload = useCallback(async () => {
    if (!enabled || !getApiBaseUrl()) {
      setState({ status: 'skipped' });
      return;
    }
    setState({ status: 'loading' });
    try {
      const data = await fetchSmartPromotionSuggestions();
      setState({ status: 'ok', data });
    } catch (e) {
      setState({
        status: 'error',
        message: e instanceof Error ? e.message : 'Не удалось загрузить идеи для акций',
      });
    }
  }, [enabled]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { state, reload };
}
