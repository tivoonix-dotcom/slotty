import type { FC } from 'react';
import {
  LEGAL_CONSENT_PATH,
  LEGAL_MASTER_TERMS_PATH,
  LEGAL_PAYMENT_PATH,
  LEGAL_PRIVACY_PATH,
  LEGAL_PUBLIC_OFFER_PATH,
} from '../../app/paths';
import { LEGAL_EFFECTIVE_FROM } from '../../shared/legal/legalConfig';
import { formatSiteOperatorLegal, SITE_BRAND_NAME, SITE_SUPPORT_EMAIL } from './legalSiteInfo';
import { LegalPageShell } from './LegalPageShell';
import { PaymentLegalMiniBooking } from './paymentLegalMiniDemos';
import { OfferMiniContact, OfferMiniLiability } from './publicOfferLegalMiniDemos';
import { TermsLegalIntroVisual } from './TermsLegalIntroVisual';
import {
  TermsMiniAccount,
  TermsMiniMaster,
  TermsMiniPrivacy,
  TermsMiniService,
} from './termsLegalMiniDemos';
import {
  LegalDocLandingIntro,
  LegalDocLandingSection,
  legalDocLinkClass,
  legalDocListClass,
  type LegalTocItem,
} from './legalDocumentUi';

const TOC: LegalTocItem[] = [
  { id: 'service', label: 'Сервис' },
  { id: 'account', label: 'Аккаунт' },
  { id: 'booking', label: 'Запись к мастеру' },
  { id: 'master', label: 'Кабинет мастера' },
  { id: 'privacy', label: 'Персональные данные' },
  { id: 'liability', label: 'Ответственность' },
  { id: 'contact', label: 'Контакты' },
];

export const UserAgreementPage: FC = () => {
  const operatorLegal = formatSiteOperatorLegal();

  return (
    <LegalPageShell
      title="Пользовательское соглашение"
      titleHighlight="соглашение"
      toc={TOC}
      meta={`Действует с ${LEGAL_EFFECTIVE_FROM}`}
    >
      <LegalDocLandingIntro>
        Настоящее соглашение регулирует использование сервиса онлайн-записи{' '}
        <strong className="font-semibold text-[#111827]">{SITE_BRAND_NAME}</strong> клиентами и мастерами.
        Регистрируясь или пользуясь платформой, вы подтверждаете, что ознакомились с условиями и принимаете их.
      </LegalDocLandingIntro>

      <TermsLegalIntroVisual />

      <div className="flex flex-col gap-12 sm:gap-14 lg:gap-20">
        <LegalDocLandingSection
          id="service"
          step={1}
          title="Сервис и роли сторон"
          miniVisual={<TermsMiniService />}
        >
          <p>
            <strong>{operatorLegal}</strong> (далее — «Оператор») предоставляет доступ к платформе {SITE_BRAND_NAME} для
            поиска мастеров beauty-индустрии, просмотра услуг и онлайн-записи.
          </p>
          <ul className={legalDocListClass}>
            <li>
              <strong>Клиент</strong> — физическое лицо, которое ищет мастера и оформляет запись через Сервис.
            </li>
            <li>
              <strong>Мастер</strong> — специалист, размещающий услуги и ведущий расписание в кабинете.
            </li>
          </ul>
          <p>
            Договор на оказание beauty-услуги заключается между клиентом и мастером. {SITE_BRAND_NAME} предоставляет
            технические средства для организации записи и не является стороной такого договора, если иное прямо не
            указано при оплате.
          </p>
          <p>
            Отношения по платным функциям для мастеров также описаны в{' '}
            <a className={legalDocLinkClass} href={LEGAL_PUBLIC_OFFER_PATH}>
              публичной оферте
            </a>
            .
          </p>
        </LegalDocLandingSection>

        <LegalDocLandingSection
          id="account"
          step={2}
          title="Регистрация и аккаунт"
          miniVisual={<TermsMiniAccount />}
        >
          <ul className={legalDocListClass}>
            <li>
              Для использования отдельных функций требуется регистрация или вход через поддерживаемые способы
              авторизации (в том числе Telegram).
            </li>
            <li>
              Пользователь обязуется указывать достоверные данные в разумном объёме и поддерживать актуальность
              контактов.
            </li>
            <li>
              Пользователь несёт ответственность за сохранность доступа к аккаунту и действия, совершённые под его
              учётной записью.
            </li>
            <li>
              Оператор вправе ограничить или прекратить доступ при нарушении соглашения, злоупотреблениях или угрозе
              безопасности Сервиса.
            </li>
          </ul>
        </LegalDocLandingSection>

        <LegalDocLandingSection
          id="booking"
          step={3}
          title="Запись к мастеру (клиент)"
          miniVisual={<PaymentLegalMiniBooking />}
        >
          <p>
            Оформление записи в {SITE_BRAND_NAME} <strong>бесплатно</strong> и не требует онлайн-оплаты на сайте.
            Стоимость услуги мастера, как правило, оплачивается на месте по договорённости сторон.
          </p>
          <p>
            Клиент выбирает мастера, услугу и удобное время с учётом доступных слотов. Мастер подтверждает, переносит
            или отменяет запись в соответствии со своими правилами и актуальным расписанием.
          </p>
          <p>
            Уведомления о статусе записи могут направляться через Telegram, email или в интерфейсе Сервиса — в
            зависимости от настроек и доступных каналов.
          </p>
        </LegalDocLandingSection>

        <LegalDocLandingSection
          id="master"
          step={4}
          title="Кабинет мастера"
          miniVisual={<TermsMiniMaster />}
        >
          <p>
            Мастер самостоятельно размещает сведения об услугах, ценах, фото и расписании, подтверждает записи и
            оказывает услуги клиентам.
          </p>
          <p>
            Доступны тарифы <strong>Free</strong> и <strong>Pro</strong>. Условия и стоимость Pro указываются в кабинете
            до оплаты. Оплата подписки выполняется через платёжного провайдера — подробнее на странице{' '}
            <a className={legalDocLinkClass} href={LEGAL_PAYMENT_PATH}>
              «Оплата и безопасность платежей»
            </a>
            .
          </p>
          <p>
            Расширенные условия для мастеров:{' '}
            <a className={legalDocLinkClass} href={LEGAL_MASTER_TERMS_PATH}>
              Условия для мастеров SLOTTY
            </a>
            .
          </p>
        </LegalDocLandingSection>

        <LegalDocLandingSection
          id="privacy"
          step={5}
          title="Персональные данные"
          miniVisual={<TermsMiniPrivacy />}
        >
          <p>
            Обработка персональных данных осуществляется в соответствии с законодательством Республики Беларусь и
            документами:
          </p>
          <ul className={legalDocListClass}>
            <li>
              <a className={legalDocLinkClass} href={LEGAL_PRIVACY_PATH}>
                Политика обработки персональных данных
              </a>
              ;
            </li>
            <li>
              <a className={legalDocLinkClass} href={LEGAL_CONSENT_PATH}>
                Согласие на обработку персональных данных
              </a>
              .
            </li>
          </ul>
          <p>
            Используя Сервис, вы подтверждаете ознакомление с указанными документами в объёме, необходимом для
            предоставления функций записи и кабинета.
          </p>
        </LegalDocLandingSection>

        <LegalDocLandingSection
          id="liability"
          step={6}
          title="Ограничение ответственности"
          miniVisual={<OfferMiniLiability />}
        >
          <ul className={legalDocListClass}>
            <li>
              Сервис предоставляется «как есть». Оператор не гарантирует бесперебойную работу при сбоях связи,
              оборудования третьих лиц и иных обстоятельствах вне разумного контроля Оператора.
            </li>
            <li>
              Оператор не отвечает за качество, безопасность и сроки услуг мастера, а также за достоверность
              сведений, размещённых мастером.
            </li>
            <li>
              Оператор не несёт ответственности за убытки, возникшие из отношений «клиент — мастер», в пределах,
              допускаемых применимым правом.
            </li>
          </ul>
        </LegalDocLandingSection>

        <LegalDocLandingSection
          id="contact"
          step={7}
          title="Изменение соглашения и контакты"
          miniVisual={<OfferMiniContact />}
        >
          <p>
            Оператор вправе обновлять настоящее соглашение. Актуальная редакция публикуется на этой странице;
            продолжение использования Сервиса после изменений означает согласие с новой редакцией, если иное не
            предусмотрено применимым правом.
          </p>
          <p>
            По вопросам работы {SITE_BRAND_NAME}:{' '}
            <a className={legalDocLinkClass} href={`mailto:${SITE_SUPPORT_EMAIL}`}>
              {SITE_SUPPORT_EMAIL}
            </a>
            .
          </p>
        </LegalDocLandingSection>
      </div>
    </LegalPageShell>
  );
};
