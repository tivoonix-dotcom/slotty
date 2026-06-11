import type { FC } from 'react';
import { HiCalendarDays, HiShieldCheck, HiSparkles, HiUserCircle } from 'react-icons/hi2';
import {
  LegalMiniAside,
  LegalMiniCard,
  LegalMiniDesc,
  LegalMiniFlow,
  LegalMiniIconBox,
  LegalMiniMeta,
  LegalMiniRow,
  LegalMiniTag,
  LegalMiniTags,
  LegalMiniTitle,
} from './legalMiniDemoUi';

/** Мини: платформа записи. */
export const TermsMiniService: FC = () => (
  <LegalMiniCard>
    <LegalMiniRow>
      <LegalMiniIconBox pink>
        <HiCalendarDays className="h-5 w-5 text-[#F47C8C]" />
      </LegalMiniIconBox>
      <div className="min-w-0 flex-1">
        <LegalMiniTitle>Онлайн-запись в SLOTTY</LegalMiniTitle>
        <LegalMiniDesc>Клиент выбирает мастера, услугу и свободный слот в каталоге.</LegalMiniDesc>
        <LegalMiniFlow steps={['Каталог', 'Профиль', 'Слот', 'Подтверждение']} />
      </div>
      <LegalMiniAside>
        <LegalMiniTag accent>SLOTTY</LegalMiniTag>
      </LegalMiniAside>
    </LegalMiniRow>
    <LegalMiniTags>
      <LegalMiniTag>Клиент</LegalMiniTag>
      <LegalMiniTag>Мастер</LegalMiniTag>
      <LegalMiniTag success>Бесплатно</LegalMiniTag>
    </LegalMiniTags>
  </LegalMiniCard>
);

/** Мини: аккаунт пользователя. */
export const TermsMiniAccount: FC = () => (
  <LegalMiniCard>
    <LegalMiniRow>
      <LegalMiniIconBox>
        <HiUserCircle className="h-5 w-5 text-[#6B7280]" />
      </LegalMiniIconBox>
      <div className="min-w-0 flex-1">
        <LegalMiniTitle>Регистрация и аккаунт</LegalMiniTitle>
        <LegalMiniDesc>Вход через Telegram, Google или email. Данные профиля — в разумном объёме.</LegalMiniDesc>
        <LegalMiniMeta>Вы отвечаете за сохранность доступа к учётной записи.</LegalMiniMeta>
      </div>
    </LegalMiniRow>
    <LegalMiniTags>
      <LegalMiniTag>Telegram</LegalMiniTag>
      <LegalMiniTag>Google</LegalMiniTag>
      <LegalMiniTag>Email</LegalMiniTag>
    </LegalMiniTags>
  </LegalMiniCard>
);

/** Мини: кабинет мастера. */
export const TermsMiniMaster: FC = () => (
  <LegalMiniCard>
    <LegalMiniRow>
      <LegalMiniIconBox pink>
        <HiSparkles className="h-5 w-5 text-[#F47C8C]" />
      </LegalMiniIconBox>
      <div className="min-w-0 flex-1">
        <LegalMiniTitle>Кабинет мастера</LegalMiniTitle>
        <LegalMiniDesc>Услуги, цены, расписание, записи и уведомления — в одном месте.</LegalMiniDesc>
        <LegalMiniFlow steps={['Free', 'Pro', 'Оплата']} />
      </div>
      <LegalMiniAside>
        <LegalMiniTag accent>Pro</LegalMiniTag>
      </LegalMiniAside>
    </LegalMiniRow>
    <LegalMiniTags>
      <LegalMiniTag>Услуги</LegalMiniTag>
      <LegalMiniTag>Расписание</LegalMiniTag>
      <LegalMiniTag>Записи</LegalMiniTag>
    </LegalMiniTags>
  </LegalMiniCard>
);

/** Мини: защита данных. */
export const TermsMiniPrivacy: FC = () => (
  <LegalMiniCard>
    <LegalMiniRow>
      <LegalMiniIconBox pink className="animate-legal-mini-shield motion-reduce:animate-none">
        <HiShieldCheck className="h-5 w-5 text-[#F47C8C]" />
      </LegalMiniIconBox>
      <div className="min-w-0 flex-1">
        <LegalMiniTitle>Персональные данные</LegalMiniTitle>
        <LegalMiniDesc>Обработка по законодательству РБ и документам SLOTTY на сайте.</LegalMiniDesc>
        <LegalMiniMeta>Политика конфиденциальности · согласие на обработку ПД</LegalMiniMeta>
      </div>
    </LegalMiniRow>
    <LegalMiniTags>
      <LegalMiniTag>Закон № 99-З</LegalMiniTag>
      <LegalMiniTag accent>Политика</LegalMiniTag>
      <LegalMiniTag accent>Согласие</LegalMiniTag>
    </LegalMiniTags>
  </LegalMiniCard>
);
