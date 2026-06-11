import type { FC } from 'react';
import { HiCheck, HiDocumentText, HiEnvelope, HiUserGroup } from 'react-icons/hi2';
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

/** Мини: платформа для клиентов и мастеров. */
export const OfferMiniSubject: FC = () => (
  <LegalMiniCard>
    <LegalMiniRow>
      <LegalMiniIconBox pink>
        <HiUserGroup className="h-5 w-5 text-[#F47C8C]" />
      </LegalMiniIconBox>
      <div className="min-w-0 flex-1">
        <LegalMiniTitle>Публичная оферта SLOTTY</LegalMiniTitle>
        <LegalMiniDesc>Платформа онлайн-записи для клиентов и мастеров beauty-сферы.</LegalMiniDesc>
        <LegalMiniFlow steps={['Клиент', 'Мастер', 'Кабинет']} />
      </div>
      <LegalMiniAside>
        <LegalMiniTag accent>оферта</LegalMiniTag>
      </LegalMiniAside>
    </LegalMiniRow>
    <LegalMiniTags>
      <LegalMiniTag>Запись</LegalMiniTag>
      <LegalMiniTag>Тариф Pro</LegalMiniTag>
      <LegalMiniTag>РБ</LegalMiniTag>
    </LegalMiniTags>
  </LegalMiniCard>
);

/** Мини: принятие условий. */
export const OfferMiniAccept: FC = () => (
  <LegalMiniCard>
    <LegalMiniRow>
      <LegalMiniIconBox pink>
        <HiCheck className="h-5 w-5 animate-legal-mini-check text-[#F47C8C] motion-reduce:animate-none" />
      </LegalMiniIconBox>
      <div className="min-w-0 flex-1">
        <LegalMiniTitle>Акцепт оферты</LegalMiniTitle>
        <LegalMiniDesc>Регистрация, запись или оплата Pro означает принятие условий.</LegalMiniDesc>
        <LegalMiniMeta>Также принимаются соглашение и документы о персональных данных.</LegalMiniMeta>
      </div>
    </LegalMiniRow>
    <LegalMiniTags>
      <LegalMiniTag>Регистрация</LegalMiniTag>
      <LegalMiniTag>Запись</LegalMiniTag>
      <LegalMiniTag accent>Оплата Pro</LegalMiniTag>
    </LegalMiniTags>
  </LegalMiniCard>
);

/** Мини: ответственность сторон. */
export const OfferMiniLiability: FC = () => (
  <LegalMiniCard>
    <LegalMiniRow>
      <LegalMiniIconBox className="animate-legal-mini-shield motion-reduce:animate-none">
        <HiDocumentText className="h-5 w-5 text-[#6B7280]" />
      </LegalMiniIconBox>
      <div className="min-w-0 flex-1">
        <LegalMiniTitle>Роль платформы</LegalMiniTitle>
        <LegalMiniDesc>SLOTTY — информационно-технологический посредник при организации записи.</LegalMiniDesc>
        <LegalMiniMeta>Beauty-услуги оказывает мастер напрямую клиенту.</LegalMiniMeta>
      </div>
      <LegalMiniAside>
        <LegalMiniTag>РБ</LegalMiniTag>
      </LegalMiniAside>
    </LegalMiniRow>
    <LegalMiniTags>
      <LegalMiniTag>Оператор</LegalMiniTag>
      <LegalMiniTag>Мастер</LegalMiniTag>
      <LegalMiniTag>Клиент</LegalMiniTag>
    </LegalMiniTags>
  </LegalMiniCard>
);

/** Мини: контакты оператора. */
export const OfferMiniContact: FC = () => (
  <LegalMiniCard>
    <LegalMiniRow>
      <LegalMiniIconBox pink>
        <HiEnvelope className="h-5 w-5 animate-legal-mini-arrow text-[#F47C8C] motion-reduce:animate-none" />
      </LegalMiniIconBox>
      <div className="min-w-0 flex-1">
        <LegalMiniTitle>Контакты и изменения</LegalMiniTitle>
        <LegalMiniDesc>Вопросы по оферте, оплате и работе сервиса — через email поддержки.</LegalMiniDesc>
        <LegalMiniMeta>Актуальная редакция публикуется на этой странице.</LegalMiniMeta>
      </div>
      <LegalMiniAside>
        <LegalMiniTag accent>email</LegalMiniTag>
      </LegalMiniAside>
    </LegalMiniRow>
    <LegalMiniTags>
      <LegalMiniTag>Поддержка</LegalMiniTag>
      <LegalMiniTag>Оферта</LegalMiniTag>
      <LegalMiniTag>Оплата</LegalMiniTag>
    </LegalMiniTags>
  </LegalMiniCard>
);
