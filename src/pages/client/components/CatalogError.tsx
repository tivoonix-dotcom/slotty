import { HiExclamationTriangle } from 'react-icons/hi2';
import { EmptyState } from './EmptyState';

type Props = {
  message?: string;
  onRetry: () => void;
};

export function CatalogError({ message, onRetry }: Props) {
  return (
    <EmptyState
      icon={<HiExclamationTriangle className="h-10 w-10" />}
      title="Не получилось загрузить каталог"
      description={message ?? 'Проверьте соединение и попробуйте ещё раз'}
      actionLabel="Повторить"
      onAction={onRetry}
      variant="catalog"
    />
  );
}
