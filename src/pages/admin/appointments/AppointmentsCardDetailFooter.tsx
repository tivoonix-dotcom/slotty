import { apptCardActions, apptOutlineBtn } from './adminAppointmentsTheme';

type Props = {
  onClick: () => void;
};

export function AppointmentsCardDetailFooter({ onClick }: Props) {
  return (
    <div className={`${apptCardActions} border-t border-[#EEEEEE]`}>
      <button type="button" onClick={onClick} className={`${apptOutlineBtn} w-full`}>
        Подробнее
      </button>
    </div>
  );
}
