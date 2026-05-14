import { useEffect, useLayoutEffect, useState } from 'react';
import { LEGAL_DOCUMENTS, type LegalDocId } from '../../../constants/legalDocuments';
import {
  SUPPORT_EMAIL,
  SUPPORT_TELEGRAM,
  isPlaceholderContact,
  supportTelegramUrl,
} from '../../../constants/support';
import { ProfileSheetShell } from './ProfileSheetShell';

type View = 'menu' | 'support' | 'documents' | 'legal';

type Props = {
  open: boolean;
  onClose: () => void;
};

export function ClientSettingsSheet({ open, onClose }: Props) {
  const [view, setView] = useState<View>('menu');
  const [legalId, setLegalId] = useState<LegalDocId | null>(null);

  useEffect(() => {
    if (!open) {
      setView('menu');
      setLegalId(null);
    }
  }, [open]);

  useLayoutEffect(() => {
    if (!open || view !== 'legal' || !legalId) return;
    const exists = LEGAL_DOCUMENTS.some((d) => d.id === legalId);
    if (!exists) {
      setLegalId(null);
      setView('documents');
    }
  }, [open, view, legalId]);

  if (!open) return null;

  const tgUrl = supportTelegramUrl(SUPPORT_TELEGRAM);

  if (view === 'legal' && legalId) {
    const doc = LEGAL_DOCUMENTS.find((d) => d.id === legalId);
    if (doc) {
      return (
        <ProfileSheetShell
          onClose={() => {
            setLegalId(null);
            setView('documents');
          }}
          labelledBy="legal-doc-title"
        >
          <button
            type="button"
            onClick={() => {
              setLegalId(null);
              setView('documents');
            }}
            className="mb-2 text-[14px] font-semibold text-neutral-500 transition hover:text-neutral-800"
          >
            ← Назад
          </button>
          <h2 id="legal-doc-title" className="text-[22px] font-semibold tracking-[-0.05em] text-neutral-950">
            {doc.title}
          </h2>
          <p className="mt-2 text-[13px] font-medium text-neutral-400">{doc.updatedLabel}</p>
          <div className="mt-5 space-y-4 whitespace-pre-wrap text-[15px] leading-relaxed text-neutral-700">{doc.body}</div>
        </ProfileSheetShell>
      );
    }
  }

  if (view === 'documents') {
    return (
      <ProfileSheetShell onClose={() => setView('menu')} labelledBy="settings-docs-title">
        <button
          type="button"
          onClick={() => setView('menu')}
          className="mb-2 text-[14px] font-semibold text-neutral-500 transition hover:text-neutral-800"
        >
          ← Назад
        </button>
        <h2 id="settings-docs-title" className="text-[26px] font-semibold tracking-[-0.055em] text-neutral-950">
          Документы
        </h2>
        <p className="mt-2 text-[14px] leading-relaxed text-neutral-500">
          Тексты носят информационный характер. Заполните контакты оператора в константах перед публикацией.
        </p>
        <ul className="mt-5 flex flex-col gap-2">
          {LEGAL_DOCUMENTS.map((d) => (
            <li key={d.id}>
              <button
                type="button"
                onClick={() => {
                  setLegalId(d.id);
                  setView('legal');
                }}
                className="flex min-h-12 w-full items-center justify-between rounded-[22px] bg-[#F1EFEF] px-4 text-left text-[15px] font-semibold text-neutral-900 transition active:scale-[0.99]"
              >
                {d.title}
              </button>
            </li>
          ))}
        </ul>
      </ProfileSheetShell>
    );
  }

  if (view === 'support') {
    return (
      <ProfileSheetShell onClose={() => setView('menu')} labelledBy="settings-support-title">
        <button
          type="button"
          onClick={() => setView('menu')}
          className="mb-2 text-[14px] font-semibold text-neutral-500 transition hover:text-neutral-800"
        >
          ← Назад
        </button>
        <h2 id="settings-support-title" className="text-[26px] font-semibold tracking-[-0.055em] text-neutral-950">
          Поддержка
        </h2>
        <div className="mt-5 space-y-3 rounded-[24px] border border-neutral-100 bg-white px-4 py-4 shadow-[0_8px_24px_rgba(17,17,17,0.04)]">
          <p className="text-[13px] font-medium text-neutral-400">Telegram</p>
          <p className="text-[16px] font-semibold text-neutral-950">{SUPPORT_TELEGRAM}</p>
          <p className="mt-3 text-[13px] font-medium text-neutral-400">Email</p>
          <p className="text-[16px] font-semibold text-neutral-950">{SUPPORT_EMAIL}</p>
        </div>
        {tgUrl ? (
          <a
            href={tgUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 flex min-h-12 w-full items-center justify-center rounded-full bg-[#E29595] px-4 text-[15px] font-semibold text-white shadow-[0_12px_30px_rgba(226,149,149,0.26)] transition active:scale-[0.98]"
          >
            Написать в поддержку
          </a>
        ) : (
          <p className="mt-4 text-[14px] leading-relaxed text-neutral-500">
            Укажите реальный Telegram в файле констант поддержки, чтобы появилась кнопка связи.
          </p>
        )}
        {!isPlaceholderContact(SUPPORT_EMAIL) && SUPPORT_EMAIL.includes('@') ? (
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="mt-2 flex min-h-12 w-full items-center justify-center rounded-full bg-[#F1EFEF] px-4 text-[15px] font-semibold text-neutral-900 transition active:scale-[0.98]"
          >
            Написать на email
          </a>
        ) : null}
      </ProfileSheetShell>
    );
  }

  return (
    <ProfileSheetShell onClose={onClose} labelledBy="settings-title">
      <h2 id="settings-title" className="text-[26px] font-semibold tracking-[-0.055em] text-neutral-950">
        Настройки
      </h2>

      <div className="mt-6 flex flex-col gap-2">
        <button
          type="button"
          onClick={() => setView('support')}
          className="flex min-h-12 w-full items-center justify-between rounded-[22px] bg-[#F1EFEF] px-4 text-left text-[15px] font-semibold text-neutral-900 transition active:scale-[0.99]"
        >
          Поддержка
        </button>
        <button
          type="button"
          onClick={() => setView('documents')}
          className="flex min-h-12 w-full items-center justify-between rounded-[22px] bg-[#F1EFEF] px-4 text-left text-[15px] font-semibold text-neutral-900 transition active:scale-[0.99]"
        >
          Документы
        </button>
      </div>

      <button
        type="button"
        onClick={onClose}
        className="mt-6 flex min-h-12 w-full items-center justify-center rounded-full bg-white px-4 text-[15px] font-semibold text-neutral-500 ring-1 ring-neutral-200 transition active:scale-[0.98]"
      >
        Закрыть
      </button>
    </ProfileSheetShell>
  );
}
