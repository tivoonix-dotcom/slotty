import type { FC } from 'react';
import { Navigate } from 'react-router-dom';
import { LEGAL_CONSENT_PATH } from '../../app/paths';
import { LEGAL_EFFECTIVE_FROM } from '../../shared/legal/legalConfig';
import { PD_CONSENT_PDF_HREF, SITE_OPERATOR_LEGAL, SITE_SUPPORT_EMAIL } from './legalSiteInfo';
import { LegalPageShell } from './LegalPageShell';

/** Согласие на обработку ПД — канонический маршрут `/legal/consent`. */
export const PersonalDataConsentPage: FC = () => {
  return (
    <LegalPageShell title="Согласие на обработку персональных данных">
      <p className="text-[13px] font-medium text-neutral-500">
        Версия 1 · действует с {LEGAL_EFFECTIVE_FROM}. Архивная PDF-копия:{' '}
        <a href={PD_CONSENT_PDF_HREF} className="font-semibold text-[#E29595] underline-offset-2 hover:underline">
          скачать PDF
        </a>
        . TODO: финальная юридическая проверка.
      </p>

      <section>
        <h2 className="text-[17px] font-semibold text-neutral-950">1. Субъект и оператор</h2>
        <p>
          Я, пользователь сервиса SLOTTY, даю {SITE_OPERATOR_LEGAL} согласие на обработку моих персональных
          данных в соответствии с Законом РБ «О защите персональных данных» и Политикой обработки
          персональных данных SLOTTY.
        </p>
      </section>

      <section>
        <h2 className="text-[17px] font-semibold text-neutral-950">2. Состав данных</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>идентификаторы Telegram / Google / email;</li>
          <li>имя, телефон, адрес (если указаны);</li>
          <li>данные записей, избранного, уведомлений;</li>
          <li>фото профиля, reference-фото к записи (если загружены);</li>
          <li>технические данные (IP, cookie, устройство).</li>
        </ul>
      </section>

      <section>
        <h2 className="text-[17px] font-semibold text-neutral-950">3. Цели</h2>
        <p>
          Регистрация и вход, запись к мастерам, личный кабинет, уведомления, безопасность сервиса, исполнение
          пользовательского соглашения.
        </p>
      </section>

      <section>
        <h2 className="text-[17px] font-semibold text-neutral-950">4. Срок и отзыв</h2>
        <p>
          До достижения целей или отзыва согласия. Отзыв — на {SITE_SUPPORT_EMAIL}. TODO: почтовый адрес
          оператора.
        </p>
      </section>
    </LegalPageShell>
  );
};

/** Редирект со старого URL. */
export const PersonalDataConsentLegacyRedirect: FC = () => (
  <Navigate to={LEGAL_CONSENT_PATH} replace />
);
