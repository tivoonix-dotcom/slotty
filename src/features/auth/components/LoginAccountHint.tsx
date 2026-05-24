type Props = {
  className?: string;
};

const baseClass =
  'rounded-2xl bg-[#F3F4F6] px-4 py-3 text-[13px] leading-relaxed text-[#6B7280]';

/** Подсказка: не создавать второй аккаунт при входе с сайта после Telegram. */
export function LoginAccountHint({ className }: Props) {
  return (
    <p className={className ? `${baseClass} ${className}` : baseClass}>
      Становились мастером в Telegram? Сначала войдите через Telegram, затем в кабинете откройте «Способы входа»
      и привяжите Google и email — иначе вход с сайта создаст отдельный профиль клиента.
    </p>
  );
}
