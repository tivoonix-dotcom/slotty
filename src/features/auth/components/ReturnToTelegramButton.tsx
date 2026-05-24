import { ADMIN_SETTINGS_LOGIN_METHODS_PATH } from '../../../app/paths';
import { useTelegramLoginUrl } from '../hooks/useTelegramLoginUrl';
import { sheetOutlineBtnClass } from '../../../pages/admin/profile/adminProfileCabinetTheme';

type Props = {
  className?: string;
  label?: string;
};

/** Открыть SLOTTY в Telegram (бот / Mini App) после привязки во внешнем браузере. */
export function ReturnToTelegramButton({
  className = sheetOutlineBtnClass,
  label = 'Вернуться в Telegram',
}: Props) {
  const telegramUrl = useTelegramLoginUrl(ADMIN_SETTINGS_LOGIN_METHODS_PATH);

  if (!telegramUrl) return null;

  return (
    <a href={telegramUrl} className={`${className} no-underline`}>
      {label}
    </a>
  );
}
