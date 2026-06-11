import type { FC } from 'react';
import {
  HiArrowPath,
  HiArrowRight,
  HiCalendarDays,
  HiCheck,
  HiShieldCheck,
  HiSparkles,
} from 'react-icons/hi2';
import {
  LegalMiniAside,
  LegalMiniCard,
  LegalMiniDesc,
  LegalMiniFlow,
  LegalMiniIconBox,
  LegalMiniMeta,
  LegalMiniPulseDots,
  LegalMiniRow,
  LegalMiniTag,
  LegalMiniTags,
  LegalMiniTitle,
} from './legalMiniDemoUi';

/** Мини: запись без оплаты. */
export const PaymentLegalMiniBooking: FC = () => (
  <LegalMiniCard>
    <LegalMiniRow>
      <LegalMiniIconBox pink>
        <HiCalendarDays className="h-5 w-5 text-[#F47C8C]" />
      </LegalMiniIconBox>
      <div className="min-w-0 flex-1">
        <LegalMiniTitle>Запись клиента</LegalMiniTitle>
        <LegalMiniDesc>Оформление записи на сайте не требует онлайн-оплаты.</LegalMiniDesc>
        <LegalMiniMeta>Услугу мастера клиент оплачивает на месте по договорённости.</LegalMiniMeta>
      </div>
      <LegalMiniAside>
        <LegalMiniTag success>
          <HiCheck className="h-3 w-3" aria-hidden />
          0 BYN
        </LegalMiniTag>
      </LegalMiniAside>
    </LegalMiniRow>
    <LegalMiniTags>
      <LegalMiniTag>Клиент</LegalMiniTag>
      <LegalMiniTag>Без карты</LegalMiniTag>
      <LegalMiniTag success>Бесплатно</LegalMiniTag>
    </LegalMiniTags>
  </LegalMiniCard>
);

/** Мини: тариф Pro → bePaid. */
export const PaymentLegalMiniPro: FC = () => (
  <LegalMiniCard>
    <LegalMiniRow>
      <div className="flex shrink-0 items-center gap-1 rounded-[12px] bg-white p-1">
        <span className="rounded-[8px] px-2 py-1 font-landing text-[10px] font-medium text-[#9CA3AF] sm:text-[11px]">
          Free
        </span>
        <span className="inline-flex items-center gap-0.5 rounded-[8px] bg-[#FFF1F4] px-2 py-1 font-landing text-[10px] font-semibold text-[#F47C8C] sm:text-[11px]">
          <HiSparkles className="h-3 w-3" aria-hidden />
          Pro
        </span>
      </div>
      <HiArrowRight className="mt-2 h-4 w-4 shrink-0 animate-legal-mini-arrow text-[#F47C8C] motion-reduce:animate-none" />
      <div className="min-w-0 flex-1">
        <LegalMiniTitle>Оплата подписки Pro</LegalMiniTitle>
        <LegalMiniDesc>Кабинет → «Тариф и оплата» → защищённая страница bePaid.</LegalMiniDesc>
        <LegalMiniFlow steps={['Номер карты', 'Срок', 'CVC']} />
      </div>
      <LegalMiniAside>
        <LegalMiniTag accent>45 BYN</LegalMiniTag>
      </LegalMiniAside>
    </LegalMiniRow>
    <LegalMiniTags>
      <LegalMiniTag>Visa</LegalMiniTag>
      <LegalMiniTag>Mastercard</LegalMiniTag>
      <LegalMiniTag>Белкарт</LegalMiniTag>
    </LegalMiniTags>
  </LegalMiniCard>
);

/** Мини: подтверждение платежа. */
export const PaymentLegalMiniResult: FC = () => (
  <LegalMiniCard>
    <LegalMiniRow>
      <LegalMiniIconBox className="bg-[#ECFDF5]">
        <HiCheck className="h-5 w-5 animate-legal-mini-check text-[#047857] motion-reduce:animate-none" />
      </LegalMiniIconBox>
      <div className="min-w-0 flex-1">
        <LegalMiniTitle>Оплата принята</LegalMiniTitle>
        <LegalMiniDesc>Банк подтверждает платёж — статус Pro обновляется в кабинете.</LegalMiniDesc>
        <LegalMiniMeta>Обычно занимает от нескольких секунд до нескольких минут.</LegalMiniMeta>
      </div>
      <LegalMiniAside>
        <LegalMiniPulseDots />
      </LegalMiniAside>
    </LegalMiniRow>
    <LegalMiniTags>
      <LegalMiniTag success>Pro активен</LegalMiniTag>
      <LegalMiniTag>45 BYN</LegalMiniTag>
      <LegalMiniTag>Мастер</LegalMiniTag>
    </LegalMiniTags>
  </LegalMiniCard>
);

/** Мини: безопасность / HTTPS. */
export const PaymentLegalMiniSecurity: FC = () => (
  <LegalMiniCard>
    <LegalMiniRow>
      <LegalMiniIconBox className="animate-legal-mini-shield motion-reduce:animate-none">
        <HiShieldCheck className="h-5 w-5 text-[#F47C8C]" />
      </LegalMiniIconBox>
      <div className="min-w-0 flex-1">
        <LegalMiniTitle>Безопасная оплата</LegalMiniTitle>
        <LegalMiniDesc>Платёж проходит на стороне bePaid по защищённому соединению HTTPS.</LegalMiniDesc>
        <LegalMiniMeta>SLOTTY не хранит полный номер карты, CVC и срок действия.</LegalMiniMeta>
      </div>
      <LegalMiniAside>
        <LegalMiniTag accent>3-D Secure</LegalMiniTag>
      </LegalMiniAside>
    </LegalMiniRow>
    <LegalMiniTags>
      <LegalMiniTag>HTTPS</LegalMiniTag>
      <LegalMiniTag>bePaid</LegalMiniTag>
      <LegalMiniTag success>PCI DSS</LegalMiniTag>
    </LegalMiniTags>
  </LegalMiniCard>
);

/** Мини: возврат средств. */
export const PaymentLegalMiniRefund: FC = () => (
  <LegalMiniCard>
    <LegalMiniRow>
      <LegalMiniIconBox>
        <HiArrowPath className="h-5 w-5 animate-legal-mini-arrow text-[#6B7280] motion-reduce:animate-none" />
      </LegalMiniIconBox>
      <div className="min-w-0 flex-1">
        <LegalMiniTitle>Возврат за Pro</LegalMiniTitle>
        <LegalMiniDesc>Условия и сроки — на странице «Возвраты и отмена оплаты».</LegalMiniDesc>
        <LegalMiniMeta>Обращение в поддержку с датой, суммой и email аккаунта.</LegalMiniMeta>
      </div>
    </LegalMiniRow>
    <LegalMiniTags>
      <LegalMiniTag>Pro</LegalMiniTag>
      <LegalMiniTag accent>Политика возврата</LegalMiniTag>
      <LegalMiniTag>Поддержка</LegalMiniTag>
    </LegalMiniTags>
  </LegalMiniCard>
);
