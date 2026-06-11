import type { FC } from 'react';
import { HiArrowPath, HiCloudArrowUp, HiDocumentText, HiGlobeAlt } from 'react-icons/hi2';
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

/** Мини: трансграничная передача. */
export const CrossBorderMiniConsent: FC = () => (
  <LegalMiniCard>
    <LegalMiniRow>
      <LegalMiniIconBox pink>
        <HiGlobeAlt className="h-5 w-5 animate-legal-mini-arrow text-[#F47C8C] motion-reduce:animate-none" />
      </LegalMiniIconBox>
      <div className="min-w-0 flex-1">
        <LegalMiniTitle>Трансграничная передача ПД</LegalMiniTitle>
        <LegalMiniDesc>Обработка и хранение могут выполняться на серверах за пределами Республики Беларусь.</LegalMiniDesc>
        <LegalMiniMeta>Дополняет согласие на обработку и политику конфиденциальности.</LegalMiniMeta>
      </div>
      <LegalMiniAside>
        <LegalMiniTag accent>ПД</LegalMiniTag>
      </LegalMiniAside>
    </LegalMiniRow>
    <LegalMiniTags>
      <LegalMiniTag>Хостинг</LegalMiniTag>
      <LegalMiniTag>Email</LegalMiniTag>
      <LegalMiniTag>OAuth</LegalMiniTag>
    </LegalMiniTags>
  </LegalMiniCard>
);

/** Мини: состав данных. */
export const CrossBorderMiniData: FC = () => (
  <LegalMiniCard>
    <LegalMiniRow>
      <LegalMiniIconBox>
        <HiDocumentText className="h-5 w-5 text-[#6B7280]" />
      </LegalMiniIconBox>
      <div className="min-w-0 flex-1">
        <LegalMiniTitle>Какие данные передаются</LegalMiniTitle>
        <LegalMiniDesc>Только в объёме, который вы предоставляете при использовании сервиса.</LegalMiniDesc>
        <LegalMiniFlow steps={['Аккаунт', 'Профиль', 'Записи', 'Фото']} />
      </div>
    </LegalMiniRow>
    <LegalMiniTags>
      <LegalMiniTag>Telegram</LegalMiniTag>
      <LegalMiniTag>Google</LegalMiniTag>
      <LegalMiniTag>Email</LegalMiniTag>
    </LegalMiniTags>
  </LegalMiniCard>
);

/** Мини: облачные сервисы. */
export const CrossBorderMiniRecipients: FC = () => (
  <LegalMiniCard>
    <LegalMiniRow>
      <LegalMiniIconBox className="animate-legal-mini-shield motion-reduce:animate-none">
        <HiCloudArrowUp className="h-5 w-5 text-[#F47C8C]" />
      </LegalMiniIconBox>
      <div className="min-w-0 flex-1">
        <LegalMiniTitle>Получатели и цели</LegalMiniTitle>
        <LegalMiniDesc>Хостинг, база данных, файлы, уведомления и доставка писем.</LegalMiniDesc>
        <LegalMiniMeta>Перечень уточняется в политике обработки персональных данных.</LegalMiniMeta>
      </div>
      <LegalMiniAside>
        <LegalMiniTag accent>цели</LegalMiniTag>
      </LegalMiniAside>
    </LegalMiniRow>
    <LegalMiniTags>
      <LegalMiniTag>Хостинг</LegalMiniTag>
      <LegalMiniTag>БД</LegalMiniTag>
      <LegalMiniTag>Resend</LegalMiniTag>
    </LegalMiniTags>
  </LegalMiniCard>
);

/** Мини: отзыв согласия. */
export const CrossBorderMiniTerm: FC = () => (
  <LegalMiniCard>
    <LegalMiniRow>
      <LegalMiniIconBox>
        <HiArrowPath className="h-5 w-5 animate-legal-mini-arrow text-[#6B7280] motion-reduce:animate-none" />
      </LegalMiniIconBox>
      <div className="min-w-0 flex-1">
        <LegalMiniTitle>Срок и отзыв</LegalMiniTitle>
        <LegalMiniDesc>Согласие действует до достижения целей обработки или его отзыва.</LegalMiniDesc>
        <LegalMiniMeta>Отзыв — письмом на email поддержки; часть функций может стать недоступной.</LegalMiniMeta>
      </div>
      <LegalMiniAside>
        <LegalMiniTag accent>email</LegalMiniTag>
      </LegalMiniAside>
    </LegalMiniRow>
    <LegalMiniTags>
      <LegalMiniTag>Отзыв</LegalMiniTag>
      <LegalMiniTag>Поддержка</LegalMiniTag>
      <LegalMiniTag>Закон РБ</LegalMiniTag>
    </LegalMiniTags>
  </LegalMiniCard>
);
