export const SERVICE_FORM_STEPS = ['Услуга', 'Каталог', 'Проверка'] as const;

export type ServiceFormStep = 0 | 1 | 2;

export type ServiceFormStepContext = {
  title: string;
  price: string;
  durationMin: string;
  coverImageUrl: string;
  coverUploading: boolean;
};

function parsePrice(value: string): number {
  return Number.parseFloat(value.replace(',', '.').trim());
}

export function validateServiceFormStep(step: ServiceFormStep, ctx: ServiceFormStepContext): string | null {
  if (step === 0) {
    if (!ctx.title.trim()) return 'Укажите название услуги.';
    const priceNumber = parsePrice(ctx.price);
    if (!Number.isFinite(priceNumber) || priceNumber < 0) return 'Укажите цену. Можно 0.';
    const durationNumber = Number.parseInt(ctx.durationMin, 10);
    if (!Number.isFinite(durationNumber) || durationNumber <= 0) return 'Укажите длительность в минутах.';
  }
  if (step === 1) {
    if (ctx.coverUploading) return 'Дождитесь окончания загрузки фото.';
    const cover = ctx.coverImageUrl.trim();
    if (!cover) return 'Загрузите фото услуги — оно обязательно для каталога.';
    if (cover.startsWith('blob:')) return 'Дождитесь окончания загрузки фото.';
  }
  return null;
}

export function validateServiceFormAll(ctx: ServiceFormStepContext): string | null {
  for (let step = 0 as ServiceFormStep; step <= 1; step = (step + 1) as ServiceFormStep) {
    const err = validateServiceFormStep(step, ctx);
    if (err) return err;
  }
  return null;
}
