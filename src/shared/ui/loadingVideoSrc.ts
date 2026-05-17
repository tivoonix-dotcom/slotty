/** `public/video/loading.mp4` — анимация загрузки (ASCII-путь для стабильной отдачи). */
export const LOADING_VIDEO_SRC = '/video/loading.mp4';

/** Запасной путь, если в деплое остался только кириллический файл. */
export const LOADING_VIDEO_SRC_FALLBACK = `/video/${encodeURIComponent('загрузка.mp4')}`;
