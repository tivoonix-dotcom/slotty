/** В админ-шите — отдельная модалка поверх, иначе попапер у поля. */
export type PickerLayer = 'auto' | 'popover' | 'sheet';

export function resolvePickerLayer(
  anchor: HTMLElement | null,
  layer: PickerLayer = 'auto',
): 'popover' | 'sheet' {
  if (layer === 'sheet') return 'sheet';
  if (layer === 'popover') return 'popover';
  if (anchor?.closest('[data-admin-sheet]')) return 'sheet';
  return 'popover';
}
