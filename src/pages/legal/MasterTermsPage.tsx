import type { FC } from 'react';
import { LEGAL_EFFECTIVE_FROM } from '../../shared/legal/legalConfig';
import { SITE_OPERATOR_LEGAL, SITE_SUPPORT_EMAIL } from './legalSiteInfo';
import { LegalPageShell } from './LegalPageShell';

export const MasterTermsPage: FC = () => {
  return (
    <LegalPageShell title="Условия для мастеров SLOTTY">
      <p className="text-[13px] font-medium text-neutral-500">
        Версия 1 · действует с {LEGAL_EFFECTIVE_FROM}. TODO: финальная юридическая проверка и реквизиты
        оператора.
      </p>

      <section>
        <h2 className="text-[17px] font-semibold text-neutral-950">1. Статус мастера</h2>
        <p>
          Мастер размещает в SLOTTY сведения об услугах, расписании и контактах и самостоятельно оказывает
          услуги клиентам. {SITE_OPERATOR_LEGAL} предоставляет платформу онлайн-записи и инструменты
          кабинета.
        </p>
      </section>

      <section>
        <h2 className="text-[17px] font-semibold text-neutral-950">2. Данные и контент</h2>
        <p>
          Мастер отвечает за достоверность сведений, фото портфолио, сертификатов и цен. Загружая материалы,
          мастер подтверждает право их публикации.
        </p>
      </section>

      <section>
        <h2 className="text-[17px] font-semibold text-neutral-950">3. Записи и уведомления</h2>
        <p>
          Мастер обязан своевременно подтверждать или отменять записи, поддерживать актуальное расписание.
          Уведомления клиентам могут отправляться через Telegram и in-app.
        </p>
      </section>

      <section>
        <h2 className="text-[17px] font-semibold text-neutral-950">4. Тарифы</h2>
        <p>
          Условия тарифных планов (Free / Pro) публикуются в сервисе. TODO: ссылка на оферту для мастеров при
          подключении платных функций.
        </p>
      </section>

      <section>
        <h2 className="text-[17px] font-semibold text-neutral-950">5. Контакты</h2>
        <p>
          По вопросам работы кабинета: {SITE_SUPPORT_EMAIL}. TODO: указать юридический адрес и реквизиты
          оператора.
        </p>
      </section>
    </LegalPageShell>
  );
};
