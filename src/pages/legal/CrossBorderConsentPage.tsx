import type { FC } from 'react';
import { LEGAL_EFFECTIVE_FROM } from '../../shared/legal/legalConfig';
import { SITE_OPERATOR_LEGAL, SITE_SUPPORT_EMAIL } from './legalSiteInfo';
import { LegalPageShell } from './LegalPageShell';
import { LegalDocIntro, LegalDocSection, legalDocListClass, type LegalTocItem } from './legalDocumentUi';

const TOC: LegalTocItem[] = [
  { id: 'consent', label: '1. Суть согласия' },
  { id: 'data', label: '2. Какие данные передаются' },
  { id: 'recipients', label: '3. Цели и получатели' },
  { id: 'term', label: '4. Срок и отзыв' },
];

export const CrossBorderConsentPage: FC = () => {
  return (
    <LegalPageShell
      title="Согласие на трансграничную передачу персональных данных"
      toc={TOC}
      meta={`Версия 1 · действует с ${LEGAL_EFFECTIVE_FROM}`}
    >
      <LegalDocIntro>
        Документ относится к сервису SLOTTY. Оператор персональных данных — {SITE_OPERATOR_LEGAL}.
      </LegalDocIntro>

      <LegalDocSection id="consent" title="1. Суть согласия">
        <p>
          Настоящим я даю {SITE_OPERATOR_LEGAL} согласие на трансграничную передачу моих персональных данных — когда
          обработка или хранение осуществляется с использованием серверов и сервисов за пределами Республики
          Беларусь.
        </p>
      </LegalDocSection>

      <LegalDocSection id="data" title="2. Какие данные могут передаваться">
        <ul className={legalDocListClass}>
          <li>данные учётной записи Telegram / Google / email;</li>
          <li>имя, контакты, адрес в профиле;</li>
          <li>сведения о записях, уведомлениях, загруженных фото;</li>
          <li>технические данные, необходимые для работы сервиса.</li>
        </ul>
      </LegalDocSection>

      <LegalDocSection id="recipients" title="3. Цели и получатели">
        <p>
          Передача осуществляется для работы SLOTTY: хостинг, база данных, хранение файлов, уведомления, авторизация,
          email (в т.ч. Resend). Перечень сервисов уточняется в Политике обработки персональных данных.
        </p>
      </LegalDocSection>

      <LegalDocSection id="term" title="4. Срок и отзыв">
        <p>
          Согласие действует до достижения целей обработки или его отзыва. Отзыв возможен через обращение на{' '}
          {SITE_SUPPORT_EMAIL}.
        </p>
      </LegalDocSection>
    </LegalPageShell>
  );
};
