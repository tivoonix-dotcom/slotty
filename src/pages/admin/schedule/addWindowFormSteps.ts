import { isUuid } from '../../../features/admin/lib/masterCabinetMapper';
import type { RepeatSettingsValue } from './repeatSettingsConfig';
import { isLocalDateIsoBeforeToday, timeToMinutes, countRepeatDates } from './scheduleUtils';
import type { WindowTemplate } from './scheduleTypes';

export const ADD_WINDOW_FORM_STEPS = ['Когда', 'Услуга', 'Проверка'] as const;

export type AddWindowFormStep = 0 | 1 | 2;

export function isAddWindowTemplateMode(ctx: {
  manualMode: boolean;
  selectedTemplate: WindowTemplate | null;
}): boolean {
  return Boolean(ctx.selectedTemplate && !ctx.manualMode);
}

export function getAddWindowStepSubtitle(step: AddWindowFormStep, ctx: AddWindowStepContext): string {
  const templateMode = isAddWindowTemplateMode(ctx);
  if (step === 0) {
    if (ctx.manualMode) {
      return 'День, начало и окончание — окно без шаблона';
    }
    return 'Шаблон и несколько времён в день — на каждое время своё окно';
  }
  if (step === 1) {
    return templateMode
      ? 'Услуга уже задана шаблоном'
      : 'Услуга — что увидит клиент при записи на это окно';
  }
  return 'Проверьте итог и при необходимости настройте повтор серии окон';
}

export const ADD_WINDOW_STEP_SUBTITLES: Record<AddWindowFormStep, string> = {
  0: 'День, начало и окончание — когда слот открыт для записи',
  1: 'Услуга — что увидит клиент при записи на это окно',
  2: 'Проверьте итог и при необходимости настройте повтор серии окон',
};

export type AddWindowStepContext = {
  dateIso: string;
  startTime: string;
  endTime: string;
  templateStartTimes: string[];
  serviceId: string;
  manualMode: boolean;
  selectedTemplate: WindowTemplate | null;
  repeatSettings: RepeatSettingsValue;
};

export function validateAddWindowStep(step: AddWindowFormStep, ctx: AddWindowStepContext): string | null {
  const { dateIso, startTime, endTime, serviceId, manualMode, selectedTemplate } = ctx;
  const templateMode = isAddWindowTemplateMode(ctx);

  if (step === 0) {
    if (!dateIso.trim()) return 'Выберите дату.';
    if (isLocalDateIsoBeforeToday(dateIso)) return 'Нельзя выбрать дату в прошлом.';
    if (!manualMode && !selectedTemplate) return 'Выберите шаблон или переключитесь на «Вручную».';
    if (templateMode) {
      if (ctx.templateStartTimes.length === 0) return 'Выберите хотя бы одно время начала.';
      return null;
    }
    if (!startTime.trim()) return 'Укажите время начала.';
    if (!endTime.trim()) return 'Укажите время окончания.';
    if (timeToMinutes(endTime) <= timeToMinutes(startTime)) {
      return 'Время окончания должно быть позже начала.';
    }
    return null;
  }

  if (step === 1) {
    if (templateMode) return null;
    if (!serviceId.trim() || !isUuid(serviceId)) {
      return 'Выберите услугу из каталога или «Любая услуга».';
    }
    return null;
  }

  if (step === 2) {
    if (ctx.repeatSettings.kind === 'pick_weekdays' && !ctx.repeatSettings.pickWeekdayMask.some(Boolean)) {
      return 'Выберите хотя бы один день недели для повтора.';
    }
    if (ctx.repeatSettings.kind !== 'none' && countRepeatDates(ctx.dateIso, ctx.repeatSettings) === 0) {
      return 'Не удалось построить серию дат — проверьте настройки повтора.';
    }
    return null;
  }

  return null;
}
