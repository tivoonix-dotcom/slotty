import type { FC } from 'react';
import {
  LEGAL_CONSENT_PATH,
  LEGAL_MASTER_TERMS_PATH,
  LEGAL_PAYMENT_PATH,
  LEGAL_PRIVACY_PATH,
  LEGAL_REFUND_PATH,
  LEGAL_TERMS_PATH,
} from '../../app/paths';
import { LEGAL_EFFECTIVE_FROM } from '../../shared/legal/legalConfig';
import { formatSiteOperatorLegal, SITE_BRAND_NAME, SITE_SUPPORT_EMAIL } from './legalSiteInfo';
import { LegalPageShell } from './LegalPageShell';
import {
  PaymentLegalMiniPro,
  PaymentLegalMiniRefund,
} from './paymentLegalMiniDemos';
import {
  OfferMiniAccept,
  OfferMiniContact,
  OfferMiniLiability,
  OfferMiniSubject,
} from './publicOfferLegalMiniDemos';
import {
  LegalDocLandingIntro,
  LegalDocLandingSection,
  legalDocLinkClass,
  legalDocListClass,
  type LegalTocItem,
} from './legalDocumentUi';

const TOC: LegalTocItem[] = [
  { id: 'subject', label: 'Предмет оферты' },
  { id: 'accept', label: 'Акцепт' },
  { id: 'payment', label: 'Стоимость и оплата' },
  { id: 'refunds', label: 'Возвраты' },
  { id: 'liability', label: 'Ответственность' },
  { id: 'contact', label: 'Контакты' },
];

export const PublicOfferPage: FC = () => {
  const operatorLegal = formatSiteOperatorLegal();

  return (
    <LegalPageShell
      title="Публичная оферта"
      titleHighlight="оферта"
      toc={TOC}
      meta={`Действует с ${LEGAL_EFFECTIVE_FROM}`}
    >
      <LegalDocLandingIntro>
        Настоящий документ является публичной офертой в смысле законодательства Республики Беларусь и определяет
        условия предоставления доступа к сервису онлайн-записи{' '}
        <strong className="font-semibold text-[#111827]">{SITE_BRAND_NAME}</strong>. Оферта адресована клиентам,
        которые записываются к мастерам, и мастерам, которые ведут кабинет и публикуют услуги на платформе.
      </LegalDocLandingIntro>

      <div className="flex flex-col gap-12 sm:gap-14 lg:gap-20">
        <LegalDocLandingSection
          id="subject"
          step={1}
          title="Предмет оферты"
          miniVisual={<OfferMiniSubject />}
        >
          <p>
            <strong>{operatorLegal}</strong> (далее — «Оператор») предоставляет Пользователю доступ к интернет-сервису{' '}
            {SITE_BRAND_NAME} — платформе для поиска мастеров beauty-индустрии, просмотра услуг и онлайн-записи.
          </p>
          <ul className={legalDocListClass}>
            <li>
              <strong>Клиентам</strong> — бесплатные функции поиска, выбора мастера и оформления записи на сайте или в
              приложении.
            </li>
            <li>
              <strong>Мастерам</strong> — кабинет для управления услугами, расписанием, записями и уведомлениями; тарифы
              Free и Pro с расширенными возможностями.
            </li>
          </ul>
          <p>
            Услуги маникюра, стрижки, массажа и иные beauty-услуги оказываются мастером напрямую клиенту. {SITE_BRAND_NAME}{' '}
            выступает информационно-технологической платформой и посредником при организации записи, если иное прямо не
            указано при оплате.
          </p>
          <p>
            Дополнительные условия для мастеров:{' '}
            <a className={legalDocLinkClass} href={LEGAL_MASTER_TERMS_PATH}>
              Условия для мастеров SLOTTY
            </a>
            .
          </p>
        </LegalDocLandingSection>

        <LegalDocLandingSection
          id="accept"
          step={2}
          title="Акцепт оферты"
          miniVisual={<OfferMiniAccept />}
        >
          <p>
            Акцептом настоящей оферты считается совершение Пользователем действий, свидетельствующих о принятии её
            условий, в том числе:
          </p>
          <ul className={legalDocListClass}>
            <li>регистрация или вход в аккаунт;</li>
            <li>оформление записи к мастеру;</li>
            <li>оплата платных функций (подписка Pro для мастера);</li>
            <li>иное использование Сервиса после ознакомления с документами.</li>
          </ul>
          <p>
            Акцепт возможен при одновременном принятии{' '}
            <a className={legalDocLinkClass} href={LEGAL_TERMS_PATH}>
              Пользовательского соглашения
            </a>
            ,{' '}
            <a className={legalDocLinkClass} href={LEGAL_PRIVACY_PATH}>
              Политики обработки персональных данных
            </a>{' '}
            и{' '}
            <a className={legalDocLinkClass} href={LEGAL_CONSENT_PATH}>
              Согласия на обработку персональных данных
            </a>
            .
          </p>
        </LegalDocLandingSection>

        <LegalDocLandingSection
          id="payment"
          step={3}
          title="Стоимость и оплата"
          miniVisual={<PaymentLegalMiniPro />}
        >
          <p>
            Оформление записи клиентом на платформе <strong>бесплатно</strong>. Оплата beauty-услуги мастера, как
            правило, производится на месте по договорённости сторон.
          </p>
          <p>
            Мастер может подключить платный тариф <strong>Pro</strong>. Стоимость, срок подписки и перечень функций
            указываются в кабинете до оплаты. Оплата Pro выполняется онлайн через платёжного провайдера{' '}
            <strong>bePaid</strong> банковской картой или иными доступными способами.
          </p>
          <p>
            Подробности о способах оплаты, безопасности и порядке проведения платежа:{' '}
            <a className={legalDocLinkClass} href={LEGAL_PAYMENT_PATH}>
              Оплата и безопасность платежей
            </a>
            .
          </p>
        </LegalDocLandingSection>

        <LegalDocLandingSection
          id="refunds"
          step={4}
          title="Возвраты"
          miniVisual={<PaymentLegalMiniRefund />}
        >
          <p>
            Порядок возврата средств за платные функции {SITE_BRAND_NAME}, в том числе за подписку Pro, описан на
            странице{' '}
            <a className={legalDocLinkClass} href={LEGAL_REFUND_PATH}>
              «Возвраты и отмена оплаты»
            </a>
            . Обращения рассматриваются в сроки, указанные в политике возврата.
          </p>
        </LegalDocLandingSection>

        <LegalDocLandingSection
          id="liability"
          step={5}
          title="Ответственность сторон"
          miniVisual={<OfferMiniLiability />}
        >
          <ul className={legalDocListClass}>
            <li>
              Сервис предоставляется «как есть». Оператор не гарантирует бесперебойную работу при сбоях связи,
              оборудования третьих лиц и иных обстоятельствах вне разумного контроля Оператора.
            </li>
            <li>
              Оператор не несёт ответственности за качество, сроки и безопасность услуг, оказываемых мастером клиенту,
              а также за достоверность сведений, размещённых мастером в профиле.
            </li>
            <li>
              Мастер самостоятельно отвечает за содержание профиля, цены, фото, расписание и исполнение записей.
            </li>
            <li>
              Пользователь обязуется предоставлять достоверные данные в разумном объёме и не нарушать права третьих лиц
              при использовании Сервиса.
            </li>
          </ul>
        </LegalDocLandingSection>

        <LegalDocLandingSection
          id="contact"
          step={6}
          title="Контакты и изменение оферты"
          miniVisual={<OfferMiniContact />}
        >
          <p>
            Оператор: <strong>{operatorLegal}</strong>
          </p>
          <p>
            По вопросам оферты, оплаты и работы Сервиса:{' '}
            <a className={legalDocLinkClass} href={`mailto:${SITE_SUPPORT_EMAIL}`}>
              {SITE_SUPPORT_EMAIL}
            </a>
            .
          </p>
          <p>
            Оператор вправе изменять условия оферты. Актуальная редакция публикуется на этой странице; продолжение
            использования Сервиса после публикации изменений означает согласие с новой редакцией, если иное не
            предусмотрено применимым правом.
          </p>
        </LegalDocLandingSection>
      </div>
    </LegalPageShell>
  );
};
