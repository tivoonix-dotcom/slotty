/** Сигнал для перезагрузки счётчиков окон (Daily Hub, услуги, publish gate). */
export const MASTER_SLOTS_CHANGED_EVENT = 'slotty:master-slots-changed';

export function notifyMasterSlotsChanged(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(MASTER_SLOTS_CHANGED_EVENT));
}

export function subscribeMasterSlotsChanged(onChange: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener(MASTER_SLOTS_CHANGED_EVENT, onChange);
  return () => window.removeEventListener(MASTER_SLOTS_CHANGED_EVENT, onChange);
}
