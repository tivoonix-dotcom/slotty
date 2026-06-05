import type { FC } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { LEGAL_CONSENT_PATH, LEGAL_PRIVACY_PATH } from '../../app/paths';
import { LEGAL_EFFECTIVE_FROM } from '../../shared/legal/legalConfig';
import {
  formatSiteOperatorLegal,
  PD_CONSENT_WEB_HREF,
  SITE_BRAND_NAME,
  SITE_PUBLIC_URL,
  SITE_SUPPORT_EMAIL,
} from './legalSiteInfo';
import { LegalPageShell } from './LegalPageShell';
import {
  LegalDocIntro,
  LegalDocSection,
  legalDocLinkClass,
  legalDocListClass,
  type LegalTocItem,
} from './legalDocumentUi';

const TOC: LegalTocItem[] = [
  { id: 'intro', label: '1. Общие положения' },
  { id: 'parties', label: '2. Субъект и оператор' },
  { id: 'scope', label: '3. Состав данных' },
  { id: 'purposes', label: '4. Цели и действия' },
  { id: 'transfer', label: '5. Передача третьим лицам' },
  { id: 'term', label: '6. Срок и отзыв' },
  { id: 'accept', label: '7. Как даётся согласие' },
];

export const PersonalDataConsentPage: FC = () => {
  const operator = formatSiteOperatorLegal();

  return (
    <LegalPageShell
      title="Согласие на обработку персональных данных"
      toc={TOC}
      meta={`Версия 1 · действует с ${LEGAL_EFFECTIVE_FROM}`}
    >
      <LegalDocIntro>
        Настоящий текст относится к сервису <strong>{SITE_BRAND_NAME}</strong> ({SITE_PUBLIC_URL}) — платформе
        онлайн-записи к мастерам. Актуальная политика обработки персональных данных:{' '}
        <Link to={LEGAL_PRIVACY_PATH} className={legalDocLinkClass}>
          {SITE_PUBLIC_URL}/legal/privacy
        </Link>
        .
      </LegalDocIntro>

      <LegalDocSection id="intro" title="1. Общие положения">
        <p>
          Настоящее согласие определяет условия, на которых субъект персональных данных (пользователь сервиса{' '}
          {SITE_BRAND_NAME}) разрешает обработку своих персональных данных в соответствии с Законом Республики
          Беларусь от 07.05.2021 № 99-З «О защите персональных данных» и{' '}
          <Link to={LEGAL_PRIVACY_PATH} className={legalDocLinkClass}>
            Политикой обработки персональных данных {SITE_BRAND_NAME}
          </Link>
          , размещённой на сайте {SITE_PUBLIC_URL}.
        </p>
      </LegalDocSection>

      <LegalDocSection id="parties" title="2. Субъект и оператор">
        <p>
          <strong>Субъект персональных данных</strong> — дееспособное физическое лицо, использующее сервис{' '}
          {SITE_BRAND_NAME} (клиент, мастер или иной зарегистрированный пользователь).
        </p>
        <p>
          <strong>Оператор персональных данных</strong> — {operator}.
        </p>
        <p>
          Контакт для обращений по вопросам персональных данных:{' '}
          <a href={`mailto:${SITE_SUPPORT_EMAIL}`} className={legalDocLinkClass}>
            {SITE_SUPPORT_EMAIL}
          </a>
          .
        </p>
      </LegalDocSection>

      <LegalDocSection id="scope" title="3. Состав персональных данных">
        <p>Согласие распространяется на обработку следующих данных (в объёме, который вы предоставляете):</p>
        <ul className={legalDocListClass}>
          <li>идентификаторы и данные учётной записи при входе через Telegram, Google или email;</li>
          <li>имя (отображаемое имя), номер телефона, адрес электронной почты;</li>
          <li>адрес приёма / выезда, если указан в профиле или при записи;</li>
          <li>фото профиля, reference-фото к записи (если загружены);</li>
          <li>сведения о записях на услуги, избранных мастерах, уведомлениях, отзывах;</li>
          <li>данные кабинета мастера: описание услуг, расписание, портфолио, локация;</li>
          <li>обращения в поддержку и переписка по ним;</li>
          <li>
            технические данные: IP-адрес, cookie, сведения об устройстве и браузере — в объёме, необходимом для
            работы и защиты сервиса.
          </li>
        </ul>
        <p>
          Отдельно, при добровольной подписке на email-новости в футере сайта, обрабатывается адрес электронной почты
          и факт согласия на маркетинговую рассылку.
        </p>
      </LegalDocSection>

      <LegalDocSection id="purposes" title="4. Цели обработки и перечень действий">
        <p>Персональные данные обрабатываются в целях:</p>
        <ul className={legalDocListClass}>
          <li>регистрации, идентификации и авторизации в сервисе {SITE_BRAND_NAME};</li>
          <li>создания и ведения профиля пользователя или кабинета мастера;</li>
          <li>оформления, подтверждения, изменения и отмены записей на услуги;</li>
          <li>связи клиента с мастером и исполнения пользовательского соглашения;</li>
          <li>отправки сервисных уведомлений (Telegram, email, push/in-app);</li>
          <li>обработки обращений в поддержку и обеспечения безопасности сервиса;</li>
          <li>улучшения качества работы платформы и соблюдения требований законодательства.</li>
        </ul>
        <p>
          Оператор вправе совершать с персональными данными действия: сбор, систематизацию, хранение, уточнение
          (обновление, изменение), использование, передачу (предоставление, доступ), обезличивание, блокирование,
          удаление — с использованием автоматизированных и неавтоматизированных средств.
        </p>
      </LegalDocSection>

      <LegalDocSection id="transfer" title="5. Передача третьим лицам">
        <p>
          Передача персональных данных третьим лицам допускается в объёме, необходимом для работы сервиса: хостинг,
          база данных, хранение файлов, доставка email (в т.ч. Resend), авторизация через Telegram/Google. При
          трансграничной передаче применяется отдельное{' '}
          <Link to="/legal/cross-border" className={legalDocLinkClass}>
            согласие на трансграничную передачу
          </Link>
          . Оператор не продаёт персональные данные в маркетинговых целях.
        </p>
      </LegalDocSection>

      <LegalDocSection id="term" title="6. Срок действия согласия и отзыв">
        <p>
          Согласие действует с момента его предоставления до достижения целей обработки, удаления аккаунта или отзыва
          согласия, если иной срок не предусмотрен законодательством Республики Беларусь.
        </p>
        <p>
          Отозвать согласие можно, направив обращение на{' '}
          <a href={`mailto:${SITE_SUPPORT_EMAIL}`} className={legalDocLinkClass}>
            {SITE_SUPPORT_EMAIL}
          </a>
          . Отзыв не отменяет законность обработки, произведённой до момента отзыва, и может ограничить доступ к
          функциям сервиса, требующим обработки данных.
        </p>
      </LegalDocSection>

      <LegalDocSection id="accept" title="7. Как даётся согласие">
        <p>
          Нажимая кнопку «Продолжить» (или аналогичную) при регистрации / входе, отмечая соответствующий пункт при
          принятии документов, заполняя профиль, создавая запись на услугу или отправляя обращение в поддержку, я
          подтверждаю, что:
        </p>
        <ul className={legalDocListClass}>
          <li>ознакомлен(а) с настоящим согласием и Политикой обработки персональных данных {SITE_BRAND_NAME};</li>
          <li>
            даю согласие {operator} на обработку моих персональных данных в указанном составе, для указанных целей и
            на условиях Политики, размещённой на сайте {SITE_PUBLIC_URL};
          </li>
          <li>понимаю порядок отзыва согласия и свои права как субъекта персональных данных.</li>
        </ul>
        <p className="text-[13px] text-[#6B7280]">
          Постоянная ссылка на этот документ:{' '}
          <Link to={LEGAL_CONSENT_PATH} className={legalDocLinkClass}>
            {SITE_PUBLIC_URL}{PD_CONSENT_WEB_HREF}
          </Link>
        </p>
      </LegalDocSection>
    </LegalPageShell>
  );
};

export const PersonalDataConsentLegacyRedirect: FC = () => (
  <Navigate to={LEGAL_CONSENT_PATH} replace />
);
