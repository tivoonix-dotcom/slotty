/**
 * Renames public/photos folders & files to English slugs and converts PNG/JPG → WebP.
 * Run: node scripts/migrate-photos-english-webp.mjs
 */
import { mkdir, readdir, rename, rmdir, stat, unlink } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const PHOTOS_DIR = path.resolve('public/photos');
const RASTER_EXT = new Set(['.png', '.jpg', '.jpeg']);

/** Full relative folder paths (posix) → new folder path. Deepest first. */
const FOLDER_PATH_RENAMES = [
  ['header/каталог', 'header/catalog'],
  ['лендинг/каталог', 'landing/catalog'],
  ['лендинг/услуги', 'landing/services-showcase'],
  ['лендинг/херо', 'landing/hero'],
  ['банк', 'banks-legacy'],
  ['барбершоп', 'barbershop'],
  ['безопасная оплата', 'secure-payment'],
  ['Быстрая настройка', 'quick-setup-legacy'],
  ['визит азверешне', 'visit-complete'],
  ['возрат', 'refund'],
  ['вымастер', 'for-masters-carousel'],
  ['ДЛЯ МАСТЕРОВ', 'for-masters'],
  ['документы', 'documents'],
  ['достижения', 'achievements-gallery'],
  ['заявки', 'booking-requests'],
  ['значки', 'badges'],
  ['история', 'history'],
  ['КАК РАБОАТЕТ', 'how-it-works'],
  ['каталог_услуги', 'catalog-services'],
  ['категории', 'categories'],
  ['кнопик', 'nav-buttons'],
  ['контракт', 'contract'],
  ['конфиденицальность', 'privacy'],
  ['лендинг', 'landing'],
  ['места', 'podium'],
  ['награды', 'awards'],
  ['не найдены заявки', 'no-requests-found'],
  ['отзыв', 'review'],
  ['план', 'plan'],
  ['Почему удобнее через Slotty', 'why-slotty'],
  ['про', 'pro'],
  ['Расписание', 'schedule-tabs'],
  ['сводка', 'summary'],
  ['срочнопомощь', 'urgent-help'],
  ['статус', 'status'],
  ['УДАЛИТЬ', 'delete-account'],
  ['услуги', 'services-tabs'],
  ['херо', 'hero-slides'],
  ['ШАГИ', 'steps'],
];

const FILE_RENAMES = new Map([
  ['ничего не нашли.webp', 'nothing-found.webp'],
  ['quick-setup-legacy/задний фон.webp', 'quick-setup/hero-bg.webp'],
  ['documents/back.jpg', 'documents/back.webp'],
  ['landing/slotty.png', 'landing/slotty.webp'],
  ['landing/бипей.png', 'landing/bepaid.webp'],
  ['landing/второефотомастреа.png', 'landing/master-second.webp'],
  ['landing/голубой.png', 'landing/blue.webp'],
  ['landing/заднийфон.png', 'landing/background.webp'],
  ['landing/зеленый.png', 'landing/green.webp'],
  ['landing/какбудтовыгяодеть.png', 'landing/look-good.webp'],
  ['landing/красный.png', 'landing/red.webp'],
  ['landing/линия.png', 'landing/line.webp'],
  ['landing/мастер.png', 'landing/master.webp'],
  ['landing/низ.png', 'landing/bottom.webp'],
  ['landing/ничего нет.png', 'landing/empty.webp'],
  ['landing/первоефотомасетра.png', 'landing/master-first.webp'],
  ['landing/тивоникс.png', 'landing/tivonix.webp'],
  ['landing/catalog/барберы.webp', 'landing/catalog/barbers.webp'],
  ['landing/catalog/брови.webp', 'landing/catalog/brows.webp'],
  ['landing/catalog/маникюр.webp', 'landing/catalog/manicure.webp'],
  ['landing/catalog/массаж.webp', 'landing/catalog/massage.webp'],
  ['landing/catalog/тату.webp', 'landing/catalog/tattoo.webp'],
  ['landing/catalog/фитнес.webp', 'landing/catalog/fitness.webp'],
  ['landing/services-showcase/брови.png', 'landing/services-showcase/brows.webp'],
  ['landing/services-showcase/зал.png', 'landing/services-showcase/gym.webp'],
  ['landing/services-showcase/маниюкр.png', 'landing/services-showcase/manicure.webp'],
  ['landing/services-showcase/массаж.png', 'landing/services-showcase/massage.webp'],
  ['landing/services-showcase/парихмахерская.png', 'landing/services-showcase/barbershop.webp'],
  ['landing/services-showcase/тату.png', 'landing/services-showcase/tattoo.webp'],
  ['history/1.png', 'history/1.webp'],
  ['history/2.png', 'history/2.webp'],
  ['history/3.png', 'history/3.webp'],
  ['history/зеленый.png', 'history/green.webp'],
  ['history/красно-синий.png', 'history/red-blue.webp'],
  ['history/красный.png', 'history/red.webp'],
  ['history/окон нет.png', 'history/no-slots.webp'],
  ['history/фильтры.png', 'history/filters.webp'],
  ['awards/4+-Photoroom.png', 'awards/top-rating.webp'],
  ['awards/втопемесяцв-Photoroom.png', 'awards/top-month.webp'],
  ['awards/втопенедели-Photoroom.png', 'awards/top-week.webp'],
  ['awards/звезда-Photoroom.png', 'awards/star-rating.webp'],
  ['awards/многоотзывов-Photoroom.png', 'awards/many-reviews.webp'],
  ['awards/недавно-Photoroom.png', 'awards/recently-joined.webp'],
  ['awards/нетдостижения-Photoroom.png', 'awards/no-achievements.webp'],
  ['badges/восклицательный.png', 'badges/warning.webp'],
  ['badges/галочка.png', 'badges/check.webp'],
  ['badges/отмена.png', 'badges/cancel.webp'],
  ['categories/1.png', 'categories/1.webp'],
  ['categories/2.png', 'categories/2.webp'],
  ['categories/3.png', 'categories/3.webp'],
  ['categories/4.png', 'categories/4.webp'],
  ['plan/барбер.webp', 'plan/barber.webp'],
  ['plan/брови.webp', 'plan/brows.webp'],
  ['plan/маниюко.webp', 'plan/manicure.webp'],
  ['plan/массаж.webp', 'plan/massage.webp'],
  ['plan/тату.webp', 'plan/tattoo.webp'],
  ['plan/фитнес.webp', 'plan/fitness.webp'],
  ['why-slotty/запись без хаоса.png', 'why-slotty/booking-flow.webp'],
  ['why-slotty/История записей.png', 'why-slotty/booking-history.webp'],
  ['why-slotty/напоминания.png', 'why-slotty/reminders.webp'],
  ['why-slotty/отзывы.png', 'why-slotty/reviews.webp'],
  ['why-slotty/свободыне окнаэ.png', 'why-slotty/free-slots.webp'],
  ['pro/1.png', 'pro/badge.webp'],
  ['no-requests-found/1-Photoroom.webp', 'no-requests-found/empty.webp'],
  ['summary/доход.webp', 'summary/revenue.webp'],
  ['summary/клиенты.webp', 'summary/clients.webp'],
  ['summary/обзор.webp', 'summary/overview.webp'],
  ['summary/репутация.webp', 'summary/reputation.webp'],
  ['for-masters/ЗАЯВКИМАСЕТРА.webp', 'for-masters/requests.webp'],
  ['for-masters/КАБИНЕТМАСТЕРА.webp', 'for-masters/cabinet.webp'],
  ['for-masters/КАЛЕНДРАЬ МАСТЕРА.webp', 'for-masters/calendar.webp'],
  ['for-masters/СВОДКА МАСТЕРА.webp', 'for-masters/summary.webp'],
  ['for-masters/УСЛУГИ МАСТЕРА.webp', 'for-masters/services.webp'],
  ['nav-buttons/мастера.webp', 'nav-buttons/masters.webp'],
  ['nav-buttons/услуги.webp', 'nav-buttons/services.webp'],
]);

function applyFolderRenames(relPosix) {
  let out = relPosix;
  for (const [from, to] of FOLDER_PATH_RENAMES) {
    if (out === from || out.startsWith(`${from}/`)) {
      out = to + out.slice(from.length);
    }
  }
  return out;
}

function targetRelativePath(relPosix) {
  const folderMapped = applyFolderRenames(relPosix);
  const mapped = FILE_RENAMES.get(folderMapped);
  if (mapped) return mapped;

  const ext = path.extname(folderMapped).toLowerCase();
  if (RASTER_EXT.has(ext)) {
    return folderMapped.slice(0, -ext.length) + '.webp';
  }
  return folderMapped;
}

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(full)));
    else if (entry.isFile() && entry.name !== '.gitkeep') files.push(full);
  }
  return files;
}

async function moveFile(sourcePath, targetPath) {
  await mkdir(path.dirname(targetPath), { recursive: true });
  const sourceExt = path.extname(sourcePath).toLowerCase();

  if (RASTER_EXT.has(sourceExt)) {
    await sharp(sourcePath).webp({ quality: 82, effort: 4 }).toFile(targetPath);
    await unlink(sourcePath);
    return 'convert';
  }

  if (sourcePath !== targetPath) {
    await rename(sourcePath, targetPath);
    return 'move';
  }
  return 'skip';
}

const allFiles = await walk(PHOTOS_DIR);
const moves = allFiles.map((abs) => {
  const rel = path.relative(PHOTOS_DIR, abs).split(path.sep).join('/');
  return { from: abs, fromRel: rel, targetRel: targetRelativePath(rel) };
});

moves.sort((a, b) => b.fromRel.length - a.fromRel.length);

let converted = 0;
let moved = 0;

for (const { from, fromRel, targetRel } of moves) {
  const targetAbs = path.join(PHOTOS_DIR, ...targetRel.split('/'));
  if (from === targetAbs) continue;

  const before = (await stat(from)).size;
  const action = await moveFile(from, targetAbs);

  if (action === 'convert') {
    const after = (await stat(targetAbs)).size;
    const saved = before > 0 ? Math.round((1 - after / before) * 100) : 0;
    console.log(`ok: ${fromRel} -> ${targetRel} (${saved}% smaller)`);
    converted += 1;
    moved += 1;
  } else if (action === 'move') {
    console.log(`move: ${fromRel} -> ${targetRel}`);
    moved += 1;
  }
}

async function pruneEmpty(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const full = path.join(dir, entry.name);
    await pruneEmpty(full);
    const left = await readdir(full);
    if (left.length === 0) {
      await rmdir(full);
      console.log(`removed empty: ${path.relative(PHOTOS_DIR, full)}`);
    }
  }
}

await pruneEmpty(PHOTOS_DIR);
console.log(`Done: ${moves.length} scanned, ${moved} moved/converted, ${converted} raster→webp`);
