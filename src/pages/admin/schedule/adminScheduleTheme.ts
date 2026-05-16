/** Высота нижней панели раздела «Расписание». */
export const SCHEDULE_TAB_BAR_HEIGHT = '5.75rem';

export const SCHEDULE_TAB_BAR_SCROLL_PAD = `calc(${SCHEDULE_TAB_BAR_HEIGHT} + 1.25rem + env(safe-area-inset-bottom, 0px))`;

export const SCHEDULE_PAGE_BG = 'bg-[#F7F7F8]';

const scheduleTabPhotosDir = '/photos/' + encodeURIComponent('Расписание') + '/';

/** Фото для шапок табов (`public/photos/Расписание`). */
export function scheduleTabPhotoSrc(fileName: string): string {
  return scheduleTabPhotosDir + encodeURIComponent(fileName);
}
