import type { FC } from 'react';
import {
  HiCheck,
  HiClipboardDocumentList,
  HiCloudArrowUp,
  HiShieldCheck,
  HiUserGroup,
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

/** Мини: согласие на обработку ПД. */
export const ConsentMiniIntro: FC = () => (
  <LegalMiniCard>
    <LegalMiniRow>
      <LegalMiniIconBox pink className="animate-legal-mini-shield motion-reduce:animate-none">
        <HiShieldCheck className="h-5 w-5 text-[#F47C8C]" />
      </LegalMiniIconBox>
      <div className="min-w-0 flex-1">
        <LegalMiniTitle>Согласие на обработку ПД</LegalMiniTitle>
        <LegalMiniDesc>Условия обработки персональных данных в сервисе SLOTTY.</LegalMiniDesc>
        <LegalMiniMeta>Закон Республики Беларусь от 07.05.2021 № 99-З.</LegalMiniMeta>
      </div>
      <LegalMiniAside>
        <LegalMiniTag>РБ</LegalMiniTag>
      </LegalMiniAside>
    </LegalMiniRow>
    <LegalMiniTags>
      <LegalMiniTag accent>Политика</LegalMiniTag>
      <LegalMiniTag accent>Согласие</LegalMiniTag>
      <LegalMiniTag>Права субъекта</LegalMiniTag>
    </LegalMiniTags>
  </LegalMiniCard>
);

/** Мини: субъект и оператор. */
export const ConsentMiniParties: FC = () => (
  <LegalMiniCard>
    <LegalMiniRow>
      <LegalMiniIconBox>
        <HiUserGroup className="h-5 w-5 text-[#6B7280]" />
      </LegalMiniIconBox>
      <div className="min-w-0 flex-1">
        <LegalMiniTitle>Субъект и оператор</LegalMiniTitle>
        <LegalMiniDesc>Пользователь сервиса — субъект ПД; владелец SLOTTY — оператор.</LegalMiniDesc>
        <LegalMiniMeta>Клиент, мастер или иной зарегистрированный пользователь.</LegalMiniMeta>
      </div>
      <LegalMiniAside>
        <LegalMiniTag accent>ПД</LegalMiniTag>
      </LegalMiniAside>
    </LegalMiniRow>
    <LegalMiniTags>
      <LegalMiniTag>Клиент</LegalMiniTag>
      <LegalMiniTag>Мастер</LegalMiniTag>
      <LegalMiniTag>Оператор</LegalMiniTag>
    </LegalMiniTags>
  </LegalMiniCard>
);

/** Мини: состав данных. */
export const ConsentMiniScope: FC = () => (
  <LegalMiniCard>
    <LegalMiniRow>
      <LegalMiniIconBox pink>
        <HiClipboardDocumentList className="h-5 w-5 text-[#F47C8C]" />
      </LegalMiniIconBox>
      <div className="min-w-0 flex-1">
        <LegalMiniTitle>Состав персональных данных</LegalMiniTitle>
        <LegalMiniDesc>Профиль, записи, кабинет мастера, фото и технические сведения.</LegalMiniDesc>
        <LegalMiniFlow steps={['Профиль', 'Записи', 'Кабинет', 'Поддержка']} />
      </div>
      <LegalMiniAside>
        <LegalMiniTag accent>объём</LegalMiniTag>
      </LegalMiniAside>
    </LegalMiniRow>
    <LegalMiniTags>
      <LegalMiniTag>Контакты</LegalMiniTag>
      <LegalMiniTag>Фото</LegalMiniTag>
      <LegalMiniTag>Cookie</LegalMiniTag>
    </LegalMiniTags>
  </LegalMiniCard>
);

/** Мини: цели обработки. */
export const ConsentMiniPurposes: FC = () => (
  <LegalMiniCard>
    <LegalMiniRow>
      <LegalMiniIconBox>
        <LegalMiniPulseDots />
      </LegalMiniIconBox>
      <div className="min-w-0 flex-1">
        <LegalMiniTitle>Цели и действия с данными</LegalMiniTitle>
        <LegalMiniDesc>Запись, уведомления, поддержка, безопасность и улучшение сервиса.</LegalMiniDesc>
        <LegalMiniMeta>Сбор, хранение, использование, передача, удаление и другие действия.</LegalMiniMeta>
      </div>
    </LegalMiniRow>
    <LegalMiniTags>
      <LegalMiniTag>Запись</LegalMiniTag>
      <LegalMiniTag>Уведомления</LegalMiniTag>
      <LegalMiniTag>Поддержка</LegalMiniTag>
      <LegalMiniTag>Безопасность</LegalMiniTag>
    </LegalMiniTags>
  </LegalMiniCard>
);

/** Мини: передача третьим лицам. */
export const ConsentMiniTransfer: FC = () => (
  <LegalMiniCard>
    <LegalMiniRow>
      <LegalMiniIconBox>
        <HiCloudArrowUp className="h-5 w-5 animate-legal-mini-arrow text-[#6B7280] motion-reduce:animate-none" />
      </LegalMiniIconBox>
      <div className="min-w-0 flex-1">
        <LegalMiniTitle>Передача третьим лицам</LegalMiniTitle>
        <LegalMiniDesc>Хостинг, БД, email и авторизация — только в необходимом объёме.</LegalMiniDesc>
        <LegalMiniMeta>При трансграничной передаче — отдельное согласие на cross-border.</LegalMiniMeta>
      </div>
      <LegalMiniAside>
        <LegalMiniTag>3 лица</LegalMiniTag>
      </LegalMiniAside>
    </LegalMiniRow>
    <LegalMiniTags>
      <LegalMiniTag>Хостинг</LegalMiniTag>
      <LegalMiniTag>Resend</LegalMiniTag>
      <LegalMiniTag>Telegram</LegalMiniTag>
    </LegalMiniTags>
  </LegalMiniCard>
);

/** Мини: отзыв согласия. */
export const ConsentMiniTerm: FC = () => (
  <LegalMiniCard>
    <LegalMiniRow>
      <LegalMiniIconBox className="bg-[#ECFDF5]">
        <HiCheck className="h-5 w-5 text-[#047857]" />
      </LegalMiniIconBox>
      <div className="min-w-0 flex-1">
        <LegalMiniTitle>Срок действия и отзыв</LegalMiniTitle>
        <LegalMiniDesc>До достижения целей, удаления аккаунта или отзыва согласия.</LegalMiniDesc>
        <LegalMiniMeta>Отзыв по email; законность ранее выполненной обработки сохраняется.</LegalMiniMeta>
      </div>
      <LegalMiniAside>
        <LegalMiniTag accent>email</LegalMiniTag>
      </LegalMiniAside>
    </LegalMiniRow>
    <LegalMiniTags>
      <LegalMiniTag>Отзыв</LegalMiniTag>
      <LegalMiniTag success>Права субъекта</LegalMiniTag>
    </LegalMiniTags>
  </LegalMiniCard>
);

/** Мини: как даётся согласие. */
export const ConsentMiniAccept: FC = () => (
  <LegalMiniCard>
    <LegalMiniRow>
      <LegalMiniIconBox pink>
        <HiCheck className="h-5 w-5 animate-legal-mini-check text-[#F47C8C] motion-reduce:animate-none" />
      </LegalMiniIconBox>
      <div className="min-w-0 flex-1">
        <LegalMiniTitle>Как даётся согласие</LegalMiniTitle>
        <LegalMiniDesc>Кнопка «Продолжить», чекбокс при регистрации, запись или обращение в поддержку.</LegalMiniDesc>
        <LegalMiniMeta>Подтверждаете ознакомление с политикой и порядком отзыва.</LegalMiniMeta>
      </div>
      <LegalMiniAside>
        <LegalMiniTag accent>чекбокс</LegalMiniTag>
      </LegalMiniAside>
    </LegalMiniRow>
    <LegalMiniTags>
      <LegalMiniTag>Регистрация</LegalMiniTag>
      <LegalMiniTag>Запись</LegalMiniTag>
      <LegalMiniTag>Профиль</LegalMiniTag>
    </LegalMiniTags>
  </LegalMiniCard>
);
