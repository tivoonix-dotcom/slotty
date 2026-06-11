import type { FC } from 'react';
import {
  HiArrowRight,
  HiBellAlert,
  HiCalendarDays,
  HiCheck,
  HiClock,
  HiLink,
  HiPhoto,
  HiSparkles,
  HiXMark,
} from 'react-icons/hi2';
import {
  LegalMiniAside,
  LegalMiniCard,
  LegalMiniDesc,
  LegalMiniDivider,
  LegalMiniFlow,
  LegalMiniIconBox,
  LegalMiniMeta,
  LegalMiniPulseDots,
  LegalMiniRow,
  LegalMiniTag,
  LegalMiniTags,
  LegalMiniTitle,
} from '../../legal/legalMiniDemoUi';

/** Шаг 1: клиент выбирает услугу и время. */
export const RequestsGuideDemoPick: FC = () => (
  <LegalMiniCard>
    <LegalMiniRow>
      <LegalMiniIconBox pink>
        <HiCalendarDays className="h-5 w-5 text-[#F47C8C]" />
      </LegalMiniIconBox>
      <div className="min-w-0 flex-1">
        <LegalMiniTitle>Маникюр классический</LegalMiniTitle>
        <LegalMiniDesc>45 BYN · 60 мин · мастер Анна</LegalMiniDesc>
        <LegalMiniMeta>Страница мастера в каталоге SLOTTY</LegalMiniMeta>
      </div>
      <LegalMiniAside>
        <LegalMiniTag accent>Услуга</LegalMiniTag>
      </LegalMiniAside>
    </LegalMiniRow>
    <LegalMiniTags className="mt-2">
      <span className="rounded-full bg-white px-2.5 py-1 font-landing text-[10px] font-medium text-[#9CA3AF] sm:text-[11px]">
        14:00
      </span>
      <span className="rounded-full bg-[#FFF1F4] px-2.5 py-1 font-landing text-[10px] font-bold text-[#F47C8C] ring-2 ring-[#FDE8ED] motion-safe:animate-pulse sm:text-[11px]">
        15:30
      </span>
      <span className="rounded-full bg-white px-2.5 py-1 font-landing text-[10px] font-medium text-[#9CA3AF] sm:text-[11px]">
        17:00
      </span>
      <HiArrowRight
        className="h-4 w-4 shrink-0 animate-legal-mini-arrow text-[#F47C8C] motion-reduce:animate-none"
        aria-hidden
      />
      <span className="rounded-[10px] bg-[#F47C8C] px-2.5 py-1 font-landing text-[10px] font-semibold text-white sm:text-[11px]">
        Отправить заявку
      </span>
    </LegalMiniTags>
  </LegalMiniCard>
);

/** Шаг 2: заявка во вкладке «Заявки». */
export const RequestsGuideDemoInbox: FC = () => (
  <LegalMiniCard>
    <div className="flex items-center gap-2">
      <span className="rounded-full bg-[#FFF1F4] px-2.5 py-1 font-landing text-[10px] font-bold text-[#F47C8C] sm:text-[11px]">
        Заявки
      </span>
      <span className="rounded-full bg-white px-2.5 py-1 font-landing text-[10px] font-medium text-[#9CA3AF] sm:text-[11px]">
        Предстоящие
      </span>
      <span className="rounded-full bg-white px-2.5 py-1 font-landing text-[10px] font-medium text-[#9CA3AF] sm:text-[11px]">
        История
      </span>
    </div>
    <LegalMiniDivider />
    <LegalMiniRow>
      <div className="flex w-12 shrink-0 flex-col items-center justify-center rounded-[10px] bg-[#FFF1F4] py-2 text-center">
        <span className="font-landing text-[9px] font-bold uppercase text-[#F47C8C]">Новая</span>
        <span className="mt-0.5 font-landing text-[13px] font-black tabular-nums text-[#111827]">15:30</span>
        <span className="font-landing text-[9px] font-semibold text-[#6B7280]">12 июн</span>
      </div>
      <div className="min-w-0 flex-1">
        <LegalMiniTitle>Мария К.</LegalMiniTitle>
        <LegalMiniDesc>Маникюр классический · 45 BYN</LegalMiniDesc>
        <LegalMiniMeta>«Хочу покрытие nude, без дизайна»</LegalMiniMeta>
      </div>
      <LegalMiniAside>
        <span className="relative flex h-9 w-9 items-center justify-center rounded-[12px] bg-[#F47C8C] text-white">
          <HiBellAlert className="h-4 w-4 motion-safe:animate-pulse motion-reduce:animate-none" />
          <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-white ring-2 ring-[#F47C8C]" />
        </span>
      </LegalMiniAside>
    </LegalMiniRow>
    <LegalMiniTags>
      <LegalMiniTag>Клиенту: заявка отправлена</LegalMiniTag>
      <LegalMiniPulseDots />
    </LegalMiniTags>
  </LegalMiniCard>
);

/** Шаг 3: подтверждение или отклонение. */
export const RequestsGuideDemoDecide: FC = () => (
  <LegalMiniCard>
    <LegalMiniRow>
      <LegalMiniIconBox className="bg-[#ECFDF5]">
        <HiCheck className="h-5 w-5 animate-legal-mini-check text-[#047857] motion-reduce:animate-none" />
      </LegalMiniIconBox>
      <div className="min-w-0 flex-1">
        <LegalMiniTitle>Подтвердить → «Предстоящие»</LegalMiniTitle>
        <LegalMiniDesc>Клиент сразу получит уведомление о записи.</LegalMiniDesc>
        <LegalMiniFlow steps={['Заявки', 'Предстоящие', 'Календарь']} />
      </div>
    </LegalMiniRow>
    <LegalMiniDivider />
    <div className="flex gap-2">
      <span className="flex min-h-9 flex-1 items-center justify-center gap-1 rounded-[10px] bg-[#F47C8C] font-landing text-[11px] font-semibold text-white sm:text-[12px]">
        <HiCheck className="h-3.5 w-3.5" aria-hidden />
        Подтвердить
      </span>
      <span className="flex min-h-9 flex-1 items-center justify-center gap-1 rounded-[10px] bg-[#EBEBEB] font-landing text-[11px] font-semibold text-[#374151] sm:text-[12px]">
        <HiXMark className="h-3.5 w-3.5" aria-hidden />
        Отклонить
      </span>
    </div>
    <p className="mt-2 font-landing text-[11px] leading-relaxed text-[#9CA3AF] sm:text-[12px]">
      Отклонение закрывает заявку — она уйдёт в историю без записи в календаре.
    </p>
  </LegalMiniCard>
);

/** Шаг 4: срок ожидания. */
export const RequestsGuideDemoDeadline: FC = () => (
  <LegalMiniCard>
    <LegalMiniRow>
      <LegalMiniIconBox pink className="animate-legal-mini-shield motion-reduce:animate-none">
        <HiClock className="h-5 w-5 text-[#F47C8C]" />
      </LegalMiniIconBox>
      <div className="min-w-0 flex-1">
        <LegalMiniTitle>Срок ответа на заявку</LegalMiniTitle>
        <LegalMiniDesc>Если не ответить вовремя, заявка может истечь автоматически.</LegalMiniDesc>
        <LegalMiniMeta>Клиент увидит статус в своём кабинете.</LegalMiniMeta>
      </div>
      <LegalMiniAside>
        <span className="inline-flex items-center gap-1 rounded-full bg-[#FFF1F4] px-2.5 py-1 font-landing text-[10px] font-bold tabular-nums text-[#F47C8C] motion-safe:animate-pulse sm:text-[11px]">
          <HiClock className="h-3 w-3" aria-hidden />
          2ч 15м
        </span>
      </LegalMiniAside>
    </LegalMiniRow>
    <LegalMiniTags>
      <LegalMiniTag accent>Ждёт ответа</LegalMiniTag>
      <LegalMiniTag>Истекает</LegalMiniTag>
      <span className="inline-flex items-center rounded-full bg-white px-2.5 py-1 font-landing text-[10px] font-medium text-[#9CA3AF] line-through sm:text-[11px]">
        Просрочена
      </span>
    </LegalMiniTags>
  </LegalMiniCard>
);

/** Советы: как получить больше заявок. */
export const RequestsGuideDemoTips: FC = () => (
  <LegalMiniCard>
    <LegalMiniRow>
      <LegalMiniIconBox pink>
        <HiSparkles className="h-5 w-5 text-[#F47C8C]" />
      </LegalMiniIconBox>
      <div className="min-w-0 flex-1">
        <LegalMiniTitle>Профиль готов к записи</LegalMiniTitle>
        <LegalMiniDesc>Услуги, окна и доверие — три опоры для новых заявок.</LegalMiniDesc>
      </div>
    </LegalMiniRow>
    <ul className="mt-2.5 space-y-2">
      {[
        { icon: HiCheck, label: 'Услуги с ценой и длительностью', ok: true },
        { icon: HiCalendarDays, label: 'Окна на 2+ недели вперёд', ok: true },
        { icon: HiPhoto, label: 'Фото, адрес, способы оплаты', ok: true },
        { icon: HiBellAlert, label: 'Быстрые ответы на заявки', ok: false },
        { icon: HiLink, label: 'Ссылка в соцсетях и Stories', ok: false },
      ].map(({ icon: Icon, label, ok }, index) => (
        <li
          key={label}
          className="flex items-center gap-2.5 rounded-[12px] bg-white px-3 py-2"
          style={{ animationDelay: `${index * 120}ms` }}
        >
          <span
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-[10px] ${
              ok ? 'bg-[#ECFDF5] text-[#047857]' : 'bg-[#F5F5F5] text-[#6B7280]'
            }`}
          >
            <Icon className={`h-3.5 w-3.5 ${ok ? 'motion-safe:animate-legal-mini-check motion-reduce:animate-none' : ''}`} />
          </span>
          <span className="font-landing text-[12px] font-medium leading-snug text-[#374151] sm:text-[13px]">
            {label}
          </span>
        </li>
      ))}
    </ul>
  </LegalMiniCard>
);

export const APPOINTMENTS_REQUESTS_GUIDE_DEMOS: Record<string, FC> = {
  'request-pick': RequestsGuideDemoPick,
  'request-inbox': RequestsGuideDemoInbox,
  'request-decide': RequestsGuideDemoDecide,
  'request-deadline': RequestsGuideDemoDeadline,
  'request-tips': RequestsGuideDemoTips,
};
