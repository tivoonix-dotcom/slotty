import { AdminBottomSheet } from '../shared/AdminBottomSheet';
import type { ManagedService } from './servicesFormat';

type Props = {
  open: boolean;
  service: ManagedService | null;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onClose: () => void;
  onEdit: () => void;
  onToggleActive: () => void;
  onDuplicate: () => void;
  onPreview: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
};

function MenuButton({
  label,
  onClick,
  danger,
  disabled,
}: {
  label: string;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`flex min-h-12 w-full items-center rounded-[16px] px-4 text-left text-[15px] font-semibold transition active:scale-[0.98] disabled:opacity-35 ${
        danger ? 'text-[#EF4444]' : 'text-[#111827] hover:bg-[#F7F7F8]'
      }`}
    >
      {label}
    </button>
  );
}

export function ServicesServiceMenuSheet({
  open,
  service,
  canMoveUp,
  canMoveDown,
  onClose,
  onEdit,
  onToggleActive,
  onDuplicate,
  onPreview,
  onMoveUp,
  onMoveDown,
  onDelete,
}: Props) {
  if (!service) return null;

  return (
    <AdminBottomSheet open={open} onClose={onClose} title={service.title}>
      <div className="space-y-0.5 pb-2">
        <MenuButton label="Редактировать" onClick={onEdit} />
        <MenuButton
          label={service.isActive ? 'Скрыть услугу' : 'Показать услугу'}
          onClick={onToggleActive}
        />
        <MenuButton label="Дублировать" onClick={onDuplicate} />
        <MenuButton label="Предпросмотр для клиента" onClick={onPreview} />
        <MenuButton label="Поднять выше" onClick={onMoveUp} disabled={!canMoveUp} />
        <MenuButton label="Опустить ниже" onClick={onMoveDown} disabled={!canMoveDown} />
        <div className="my-2 h-px bg-[#EAECEF]" />
        <MenuButton label="Удалить" onClick={onDelete} danger />
        <MenuButton label="Отмена" onClick={onClose} />
      </div>
    </AdminBottomSheet>
  );
}
