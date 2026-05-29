import type { FC } from 'react';
import { LEGAL_EFFECTIVE_FROM } from '../../shared/legal/legalConfig';
import { SITE_OPERATOR_LEGAL, SITE_SUPPORT_EMAIL } from './legalSiteInfo';
import { LegalPageShell } from './LegalPageShell';

export const CrossBorderConsentPage: FC = () => {
  return (
    <LegalPageShell title="Согласие на трансграничную передачу персональных данных">
      <p className="text-[13px] font-medium text-neutral-500">
        Версия 1 · действует с {LEGAL_EFFECTIVE_FROM}. TODO: финальная юридическая проверка и реквизиты оператора.
      </p>

      <section>
        <h2 className="text-[17px] font-semibold text-neutral-950">1. Суть согласия</h2>
        <p>
          Настоящим я даю {SITE_OPERATOR_LEGAL} согласие на трансграничную передачу моих персональных данных
          — когда обработка или хранение осуществляется с использованием серверов и сервисов, физически
          расположенных за пределами Республики Беларусь (в том числе в странах, где размещены облачные
          провайдеры, CDN, сервисы авторизации и почты).
        </p>
      </section>

      <section>
        <h2 className="text-[17px] font-semibold text-neutral-950">2. Какие данные могут передаваться</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>данные учётной записи Telegram / Google / email;</li>
          <li>имя, контакты, адрес в профиле;</li>
          <li>сведения о записях, уведомлениях, загруженных фото;</li>
          <li>технические данные, необходимые для работы сервиса.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-[17px] font-semibold text-neutral-950">3. Цели и получатели</h2>
        <p>
          Передача осуществляется для работы SLOTTY: хостинг, база данных, хранение файлов, отправка
          уведомлений, авторизация через Telegram/Google, email-рассылки. Перечень сервисов уточняется в
          Политике обработки персональных данных.
        </p>
      </section>

      <section>
        <h2 className="text-[17px] font-semibold text-neutral-950">4. Срок и отзыв</h2>
        <p>
          Согласие действует до достижения целей обработки или его отзыва. Отзыв возможен через обращение
          на {SITE_SUPPORT_EMAIL}. TODO: указать почтовый адрес оператора.
        </p>
      </section>
    </LegalPageShell>
  );
};
