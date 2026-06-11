import type { FC } from 'react';
import { Link } from 'react-router-dom';
import { LEGAL_CONSENT_PATH, LEGAL_PRIVACY_PATH } from '../../app/paths';
import { LEGAL_EFFECTIVE_FROM } from '../../shared/legal/legalConfig';
import {
  formatSiteOperatorLegal,
  SITE_BRAND_NAME,
  SITE_PUBLIC_URL,
  SITE_SUPPORT_EMAIL,
} from './legalSiteInfo';
import { LegalPageShell } from './LegalPageShell';
import {
  CrossBorderMiniConsent,
  CrossBorderMiniData,
  CrossBorderMiniRecipients,
  CrossBorderMiniTerm,
} from './crossBorderLegalMiniDemos';
import {
  LegalDocLandingIntro,
  LegalDocLandingSection,
  legalDocLinkClass,
  legalDocListClass,
  type LegalTocItem,
} from './legalDocumentUi';

const TOC: LegalTocItem[] = [
  { id: 'consent', label: 'Суть согласия' },
  { id: 'data', label: 'Состав данных' },
  { id: 'recipients', label: 'Цели и получатели' },
  { id: 'term', label: 'Срок и отзыв' },
];

export const CrossBorderConsentPage: FC = () => {
  const operator = formatSiteOperatorLegal();

  return (
    <LegalPageShell
      title="Согласие на трансграничную передачу персональных данных"
      titleHighlight="трансграничную передачу"
      toc={TOC}
      meta={`Действует с ${LEGAL_EFFECTIVE_FROM}`}
    >
      <LegalDocLandingIntro>
        Настоящий документ относится к сервису{' '}
        <strong className="font-semibold text-[#111827]">{SITE_BRAND_NAME}</strong> ({SITE_PUBLIC_URL}). Он
        дополняет{' '}
        <Link to={LEGAL_CONSENT_PATH} className={legalDocLinkClass}>
          Согласие на обработку персональных данных
        </Link>{' '}
        и{' '}
        <Link to={LEGAL_PRIVACY_PATH} className={legalDocLinkClass}>
          Политику обработки персональных данных
        </Link>
        , если обработка или хранение данных осуществляется с использованием инфраструктуры за пределами Республики
        Беларусь.
      </LegalDocLandingIntro>

      <div className="flex flex-col gap-12 sm:gap-14 lg:gap-20">
        <LegalDocLandingSection
          id="consent"
          step={1}
          title="Суть согласия"
          miniVisual={<CrossBorderMiniConsent />}
        >
          <p>
            Настоящим субъект персональных данных (пользователь {SITE_BRAND_NAME}) даёт{' '}
            <strong>{operator}</strong> (далее — «Оператор») согласие на трансграничную передачу персональных данных —
            когда обработка, хранение или иное действие с данными выполняется с привлечением серверов, облачных сервисов
            или иных получателей, находящихся за пределами Республики Беларусь.
          </p>
          <p>
            Согласие даётся добровольно при регистрации, оформлении записи или ином использовании Сервиса с отметкой
            соответствующего чекбокса, а также в объёме, необходимом для работы выбранных функций (авторизация через
            Telegram, email-уведомления и т.п.).
          </p>
        </LegalDocLandingSection>

        <LegalDocLandingSection
          id="data"
          step={2}
          title="Какие данные могут передаваться"
          miniVisual={<CrossBorderMiniData />}
        >
          <p>
            В зависимости от используемых функций трансгранично могут передаваться следующие категории данных (в
            объёме, который вы предоставляете):
          </p>
          <ul className={legalDocListClass}>
            <li>идентификатор и данные учётной записи Telegram, Google или email при входе и регистрации;</li>
            <li>имя, контактные данные и иные сведения профиля клиента или мастера;</li>
            <li>сведения о записях на услуги, уведомлениях, избранных мастерах;</li>
            <li>загруженные фото услуг, портфолио и иные материалы кабинета мастера;</li>
            <li>
              технические данные (IP-адрес, сведения об устройстве и браузере, cookie) — в объёме, необходимом для
              работы и защиты Сервиса.
            </li>
          </ul>
        </LegalDocLandingSection>

        <LegalDocLandingSection
          id="recipients"
          step={3}
          title="Цели и получатели передачи"
          miniVisual={<CrossBorderMiniRecipients />}
        >
          <p>Трансграничная передача осуществляется для целей:</p>
          <ul className={legalDocListClass}>
            <li>предоставления функций онлайн-записи, личного кабинета и уведомлений;</li>
            <li>хостинга сайта, хранения базы данных и файлов;</li>
            <li>авторизации через сторонние сервисы (Telegram, Google);</li>
            <li>отправки сервисных и маркетинговых email (в т.ч. через Resend или аналогичный провайдер);</li>
            <li>обеспечения безопасности, аналитики и стабильной работы платформы.</li>
          </ul>
          <p>
            Конкретный перечень категорий получателей и стран размещения может уточняться в{' '}
            <Link to={LEGAL_PRIVACY_PATH} className={legalDocLinkClass}>
              Политике обработки персональных данных
            </Link>
            . Оператор передаёт данные только при наличии законных оснований и в объёме, необходимом для указанных
            целей.
          </p>
          <p>
            Оператор не продаёт персональные данные третьим лицам в маркетинговых целях без отдельного согласия
            пользователя.
          </p>
        </LegalDocLandingSection>

        <LegalDocLandingSection
          id="term"
          step={4}
          title="Срок действия и отзыв согласия"
          miniVisual={<CrossBorderMiniTerm />}
        >
          <p>
            Согласие действует до достижения целей обработки, прекращения использования Сервиса или его отзыва
            субъектом персональных данных — в зависимости от того, что наступит ранее, если иное не предусмотрено
            законодательством Республики Беларусь.
          </p>
          <p>
            Отозвать согласие можно, направив обращение на{' '}
            <a className={legalDocLinkClass} href={`mailto:${SITE_SUPPORT_EMAIL}`}>
              {SITE_SUPPORT_EMAIL}
            </a>
            . Отзыв не влияет на законность обработки, осуществлённой до его получения Оператором, и может повлечь
            невозможность использования отдельных функций Сервиса, для которых трансграничная передача необходима.
          </p>
          <p>
            По вопросам обработки и защиты персональных данных также действуют положения{' '}
            <Link to={LEGAL_PRIVACY_PATH} className={legalDocLinkClass}>
              Политики обработки персональных данных
            </Link>{' '}
            и{' '}
            <Link to={LEGAL_CONSENT_PATH} className={legalDocLinkClass}>
              Согласия на обработку персональных данных
            </Link>
            .
          </p>
        </LegalDocLandingSection>
      </div>
    </LegalPageShell>
  );
};
