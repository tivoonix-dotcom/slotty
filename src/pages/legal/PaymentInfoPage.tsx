import type { FC } from 'react';
import { LEGAL_REFUND_PATH } from '../../app/paths';
import { PaymentLogos } from '../../shared/ui/PaymentLogos';
import { PAYMENT_DISCLAIMER_LEGAL_PAGE } from '../../shared/ui/PaymentLogos/paymentLogosConfig';
import { SITE_SUPPORT_EMAIL } from './legalSiteInfo';
import { PaymentFlowDemo } from './PaymentFlowDemo';
import {
  PaymentLegalMiniBooking,
  PaymentLegalMiniPro,
  PaymentLegalMiniRefund,
  PaymentLegalMiniResult,
  PaymentLegalMiniSecurity,
} from './paymentLegalMiniDemos';
import { LegalPageShell } from './LegalPageShell';
import {
  LegalDocLandingIntro,
  LegalDocLandingSection,
  legalDocLinkClass,
  legalDocListClass,
  type LegalTocItem,
} from './legalDocumentUi';

const TOC: LegalTocItem[] = [
  { id: 'methods', label: 'Способы оплаты' },
  { id: 'current', label: 'Как оплатить Pro' },
  { id: 'booking', label: 'Запись к мастеру' },
  { id: 'pro', label: 'Подписка Pro' },
  { id: 'result', label: 'Результат платежа' },
  { id: 'security', label: 'Безопасность' },
  { id: 'refunds', label: 'Возвраты' },
];

export const PaymentInfoPage: FC = () => {
  return (
    <LegalPageShell
      title="Оплата и безопасность платежей"
      titleHighlight="безопасность платежей"
      toc={TOC}
    >
      <LegalDocLandingIntro>
        На <strong className="font-semibold text-[#111827]">SLOTTY</strong> онлайн-оплата доступна{' '}
        <strong className="font-semibold text-[#111827]">только мастерам</strong> — для подписки Pro через{' '}
        <strong className="font-semibold text-[#111827]">bePaid</strong>. Клиенты записываются бесплатно; оплата
        услуги мастера обычно происходит на месте. Данные карты обрабатывает провайдер — SLOTTY не хранит полные
        реквизиты.
      </LegalDocLandingIntro>

      <div className="flex flex-col gap-12 sm:gap-14 lg:gap-20">
        <LegalDocLandingSection
          id="methods"
          step={1}
          title="Способы оплаты"
          wideChildren={
            <PaymentLogos
              variant="cards"
              showDisclaimer
              disclaimerText={PAYMENT_DISCLAIMER_LEGAL_PAGE}
            />
          }
        >
          <p>
            Оплата подписки Pro выполняется банковской картой (Visa, Mastercard, Белкарт) и другими методами,
            которые поддерживает bePaid при оформлении платежа.
          </p>
        </LegalDocLandingSection>

        <PaymentFlowDemo />

        <LegalDocLandingSection
          id="booking"
          step={2}
          title="Запись к мастеру (клиент)"
          miniVisual={<PaymentLegalMiniBooking />}
        >
          <p>
            Оформление записи в SLOTTY <strong>бесплатно</strong> и не требует онлайн-оплаты на сайте. Оплата услуги
            мастера, как правило, производится на месте по договорённости с мастером.
          </p>
        </LegalDocLandingSection>

        <LegalDocLandingSection
          id="pro"
          step={3}
          title="Подписка Pro (мастер)"
          miniVisual={<PaymentLegalMiniPro />}
        >
          <p>
            Мастер оплачивает подписку в кабинете в разделе «Тариф и оплата». После выбора тарифа Pro вы переходите
            на страницу bePaid, вводите данные карты и возвращаетесь в SLOTTY с результатом операции.
          </p>
        </LegalDocLandingSection>

        <LegalDocLandingSection
          id="result"
          step={4}
          title="Результат платежа"
          miniVisual={<PaymentLegalMiniResult />}
        >
          <p>
            При успешной оплате подписки Pro статус обновляется автоматически после подтверждения банком. При ошибке
            или отмене можно повторить оплату или обратиться в поддержку.
          </p>
        </LegalDocLandingSection>

        <LegalDocLandingSection
          id="security"
          step={5}
          title="Безопасность платежей"
          miniVisual={<PaymentLegalMiniSecurity />}
        >
          <ul className={legalDocListClass}>
            <li>
              Платёж обрабатывается на инфраструктуре <strong>bePaid</strong> — сертифицированного платёжного
              провайдера.
            </li>
            <li>SLOTTY не хранит полный номер карты, CVV и срок действия на своих серверах.</li>
            <li>
              Соединение с платёжной страницей защищено (HTTPS). Проверяйте адрес страницы оплаты и не передавайте
              коды из SMS третьим лицам.
            </li>
            <li>
              При ошибке, двойном списании или вопросе по чеку напишите на{' '}
              <a className={legalDocLinkClass} href={`mailto:${SITE_SUPPORT_EMAIL}`}>
                {SITE_SUPPORT_EMAIL}
              </a>{' '}
              — укажите дату, сумму и email аккаунта.
            </li>
          </ul>
        </LegalDocLandingSection>

        <LegalDocLandingSection
          id="refunds"
          step={6}
          title="Возвраты"
          miniVisual={<PaymentLegalMiniRefund />}
        >
          <p>
            Условия возврата средств за платные функции SLOTTY описаны на странице{' '}
            <a className={legalDocLinkClass} href={LEGAL_REFUND_PATH}>
              «Возвраты»
            </a>
            . Обращения рассматриваются в сроки, указанные в политике возврата.
          </p>
        </LegalDocLandingSection>
      </div>
    </LegalPageShell>
  );
};
