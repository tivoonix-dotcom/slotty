import type { FC } from 'react';
import { PaymentLegalTrustBlock } from '../../shared/ui/PaymentLogos';
import { LEGAL_PAYMENT_PATH } from '../../app/paths';
import { SITE_SUPPORT_EMAIL } from './legalSiteInfo';
import { RefundFlowDemo } from './RefundFlowDemo';
import { LegalPageShell } from './LegalPageShell';
import {
  LegalDocLandingIntro,
  LegalDocLandingSection,
  legalDocLinkClass,
  type LegalTocItem,
} from './legalDocumentUi';

const TOC: LegalTocItem[] = [
  { id: 'booking', label: '1. Запись к мастеру' },
  { id: 'pro', label: '2. Тариф Pro' },
  { id: 'online', label: '3. Онлайн-оплата' },
  { id: 'contact', label: '4. Контакты' },
];

export const RefundPolicyPage: FC = () => {
  return (
    <LegalPageShell
      title="Возвраты и отмена оплаты"
      titleHighlight="отмена оплаты"
      toc={TOC}
    >
      <LegalDocLandingIntro>
        Действует в отношении сервиса <strong className="font-semibold text-[#111827]">SLOTTY</strong>. До активации
        онлайн-оплаты возвраты по карте/ЕРИП на сайте не применяются.
      </LegalDocLandingIntro>

      <PaymentLegalTrustBlock className="mt-2" />

      <RefundFlowDemo />

      <div className="flex flex-col gap-12 sm:gap-14 lg:gap-20">
        <LegalDocLandingSection id="booking" step={1} title="Запись к мастеру (клиент)">
          <p>
            Отмена или перенос записи регулируются правилами мастера. Возврат за визит — по договорённости с мастером,
            если была предоплата вне SLOTTY.
          </p>
        </LegalDocLandingSection>

        <LegalDocLandingSection id="pro" step={2} title="Тариф Pro (мастер)">
          <p>
            При оплате Pro по реквизитам возврат рассматривается по обращению в поддержку с указанием даты платежа.
          </p>
        </LegalDocLandingSection>

        <LegalDocLandingSection id="online" step={3} title="Онлайн-оплата (после подключения)">
          <p>
            Порядок возврата будет опубликован на этой странице и на{' '}
            <a className={legalDocLinkClass} href={LEGAL_PAYMENT_PATH}>
              «Оплате и безопасности»
            </a>
            .
          </p>
        </LegalDocLandingSection>

        <LegalDocLandingSection id="contact" step={4} title="Контакты">
          <p>
            По вопросам возврата:{' '}
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
