/**
 * Updates TS/TSX source references after photo migration.
 * Run: node scripts/update-photo-references.mjs
 */
import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve('src');
const SERVER = path.resolve('server/src');
const EXTRA = [path.resolve('index.html'), path.resolve('e2e')];

const REPLACEMENTS = [
  // encodeURIComponent folder patterns → plain paths
  [`/photos/\${encodeURIComponent('лендинг')}/\${encodeURIComponent('каталог')}`, '/photos/landing/catalog'],
  [`/photos/\${encodeURIComponent('лендинг')}/\${encodeURIComponent('услуги')}`, '/photos/landing/services-showcase'],
  [`/photos/\${encodeURIComponent('лендинг')}/\${encodeURIComponent(file)}`, '/photos/landing/${file}'],
  [`/photos/\${encodeURIComponent('лендинг')}/`, '/photos/landing/'],
  [`encodeURIComponent('лендинг')`, "'landing'"],
  [`/photos/\${encodeURIComponent('история')}/`, '/photos/history/'],
  [`encodeURIComponent('история')`, "'history'"],
  [`/photos/\${encodeURIComponent('награды')}`, '/photos/awards'],
  [`encodeURIComponent('награды')`, "'awards'"],
  [`/photos/\${encodeURIComponent('каталог_услуги')}`, '/photos/catalog-services'],
  [`encodeURIComponent('каталог_услуги')`, "'catalog-services'"],
  [`/photos/\${encodeURIComponent('категории')}/`, '/photos/categories/'],
  [`encodeURIComponent('категории')`, "'categories'"],
  [`/photos/\${encodeURIComponent('план')}`, '/photos/plan'],
  [`'/photos/план'`, "'/photos/plan'"],
  [`/photos/\${encodeURIComponent('значки')}/\${encodeURIComponent('`, '/photos/badges/'],
  [`/photos/\${encodeURIComponent('значки')}/`, '/photos/badges/'],
  [`encodeURIComponent('значки')`, "'badges'"],
  [`/photos/\${encodeURIComponent('сводка')}/`, '/photos/summary/'],
  [`encodeURIComponent('сводка')`, "'summary'"],
  [`encodeURIComponent('Расписание')`, "'schedule-tabs'"],
  [`encodeURIComponent('услуги')`, "'services-tabs'"],
  [`encodeURIComponent('Быстрая настройка')`, "'quick-setup'"],
  [`encodeURIComponent('визит азверешне')`, "'visit-complete'"],
  [`encodeURIComponent('УДАЛИТЬ')`, "'delete-account'"],
  [`encodeURIComponent('не найдены заявки')`, "'no-requests-found'"],
  [`encodeURIComponent('отзыв')`, "'review'"],
  [`encodeURIComponent('возрат')`, "'refund'"],
  [`encodeURIComponent('конфиденицальность')`, "'privacy'"],
  [`encodeURIComponent('контракт')`, "'contract'"],
  [`encodeURIComponent('документы')`, "'documents'"],
  [`encodeURIComponent('места')`, "'podium'"],
  [`encodeURIComponent('ничего не нашли.webp')`, "'nothing-found.webp'"],
  // file names
  [`encodeURIComponent('красный.png')`, "'red.webp'"],
  [`encodeURIComponent('зеленый.png')`, "'green.webp'"],
  [`encodeURIComponent('красно-синий.png')`, "'red-blue.webp'"],
  [`encodeURIComponent('окон нет.png')`, "'no-slots.webp'"],
  [`encodeURIComponent('заднийфон.png')`, "'background.webp'"],
  [`encodeURIComponent('задний фон.webp')`, "'hero-bg.webp'"],
  [`encodeURIComponent('галочка.png')`, "'check.webp'"],
  [`encodeURIComponent('отмена.png')`, "'cancel.webp'"],
  [`encodeURIComponent('восклицательный.png')`, "'warning.webp'"],
  [`encodeURIComponent('маникюр')`, "'manicure'"],
  [`encodeURIComponent('барберы')`, "'barbers'"],
  [`encodeURIComponent('брови')`, "'brows'"],
  [`encodeURIComponent('массаж')`, "'massage'"],
  [`encodeURIComponent('фитнес')`, "'fitness'"],
  [`encodeURIComponent('тату')`, "'tattoo'"],
  [`encodeURIComponent('маниюко')`, "'manicure'"],
  [`encodeURIComponent('барбер')`, "'barber'"],
  // direct paths
  [`'/photos/УДАЛИТЬ/1.webp'`, "'/photos/delete-account/1.webp'"],
  [`'/photos/срочнопомощь/1.webp'`, "'/photos/urgent-help/1.webp'"],
  [`'/photos/статус/1.webp'`, "'/photos/status/1.webp'"],
  [`'/photos/барбершоп/fon.webp'`, "'/photos/barbershop/fon.webp'"],
  [`'/photos/про/1.png'`, "'/photos/pro/badge.webp'"],
  [`'/photos/ничего не нашли.webp'`, "'/photos/nothing-found.webp'"],
  [`1-Photoroom.webp`, 'empty.webp'],
  [`'втопенедели-Photoroom.png'`, "'top-week.webp'"],
  [`'втопемесяцв-Photoroom.png'`, "'top-month.webp'"],
  [`'звезда-Photoroom.png'`, "'star-rating.webp'"],
  [`'многоотзывов-Photoroom.png'`, "'many-reviews.webp'"],
  [`'недавно-Photoroom.png'`, "'recently-joined.webp'"],
  [`'нетдостижения-Photoroom.png'`, "'no-achievements.webp'"],
  // constants
  [`const HOW_IT_WORKS_DIR = 'КАК РАБОАТЕТ';`, `const HOW_IT_WORKS_DIR = 'how-it-works';`],
  [`const WHY_SLOTTY_DIR = 'Почему удобнее через Slotty';`, `const WHY_SLOTTY_DIR = 'why-slotty';`],
  // landing asset files
  [`landingPhoto('линия.png')`, `'/photos/landing/line.webp'`],
  [`landingPhoto('бипей.png')`, `'/photos/landing/bepaid.webp'`],
  [`landingPhoto('тивоникс.png')`, `'/photos/landing/tivonix.webp'`],
  [`landingPhoto('мастер.png')`, `'/photos/landing/master.webp'`],
  [`landingPhoto('зеленый.png')`, `'/photos/landing/green.webp'`],
  [`landingPhoto('голубой.png')`, `'/photos/landing/blue.webp'`],
  [`landingPhoto('красный.png')`, `'/photos/landing/red.webp'`],
  [`landingPhoto('низ.png')`, `'/photos/landing/bottom.webp'`],
  [`landingPhoto('slotty.png')`, `'/photos/landing/slotty.webp'`],
  [`landingPhoto('первоефотомасетра.png')`, `'/photos/landing/master-first.webp'`],
  [`landingPhoto('заднийфон.png')`, `'/photos/landing/background.webp'`],
  [`landingServicePhoto('маниюкр.png')`, `'/photos/landing/services-showcase/manicure.webp'`],
  [`landingServicePhoto('парихмахерская.png')`, `'/photos/landing/services-showcase/barbershop.webp'`],
  [`landingServicePhoto('брови.png')`, `'/photos/landing/services-showcase/brows.webp'`],
  [`landingServicePhoto('массаж.png')`, `'/photos/landing/services-showcase/massage.webp'`],
  [`landingServicePhoto('зал.png')`, `'/photos/landing/services-showcase/gym.webp'`],
  [`landingServicePhoto('тату.png')`, `'/photos/landing/services-showcase/tattoo.webp'`],
  [`imageFile: 'свободыне окнаэ.png'`, `imageFile: 'free-slots.webp'`],
  [`imageFile: 'запись без хаоса.png'`, `imageFile: 'booking-flow.webp'`],
  [`imageFile: 'История записей.png'`, `imageFile: 'booking-history.webp'`],
  [`imageFile: 'напоминания.png'`, `imageFile: 'reminders.webp'`],
  [`imageFile: 'отзывы.png'`, `imageFile: 'reviews.webp'`],
  // history png → webp in appointments
  [`history/1.png`, 'history/1.webp'],
  [`history/2.png`, 'history/2.webp'],
  [`history/3.png`, 'history/3.webp'],
  // plan paths
  [`\${PLAN}/маниюко.webp`, `'/photos/plan/manicure.webp'`],
  [`\${PLAN}/барбер.webp`, `'/photos/plan/barber.webp'`],
  [`\${PLAN}/брови.webp`, `'/photos/plan/brows.webp'`],
  [`\${PLAN}/массаж.webp`, `'/photos/plan/massage.webp'`],
  [`\${PLAN}/фитнес.webp`, `'/photos/plan/fitness.webp'`],
  [`\${PLAN}/тату.webp`, `'/photos/plan/tattoo.webp'`],
  // comments
  [`public/photos/лендинг`, 'public/photos/landing'],
  [`public/photos/история`, 'public/photos/history'],
  [`public/photos/каталог_услуги`, 'public/photos/catalog-services'],
  [`public/photos/награды`, 'public/photos/awards'],
  [`public/photos/услуги`, 'public/photos/services-tabs'],
  [`public/photos/Расписание`, 'public/photos/schedule-tabs'],
  [`public/photos/Быстрая настройка`, 'public/photos/quick-setup'],
  [`public/photos/значки`, 'public/photos/badges'],
  [`public/photos/УДАЛИТЬ`, 'public/photos/delete-account'],
  [`public/photos/визит азверешне`, 'public/photos/visit-complete'],
  [`public/photos/не найдены заявки`, 'public/photos/no-requests-found'],
  [`public/photos/срочнопомощь`, 'public/photos/urgent-help'],
  [`public/photos/статус`, 'public/photos/status'],
  [`public/photos/план`, 'public/photos/plan'],
  [`public/photos/категории`, 'public/photos/categories'],
  [`public/photos/сводка`, 'public/photos/summary'],
  [`public/photos/ничего не нашли.webp`, 'public/photos/nothing-found.webp'],
  [`public/photos/документы`, 'public/photos/documents'],
  [`documents/back.jpg`, 'documents/back.webp'],
  [`includes(encodeURIComponent('каталог_услуги'))`, "includes('catalog-services')"],
];

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) files.push(...(await walk(p)));
    else if (/\.(ts|tsx|html)$/.test(e.name)) files.push(p);
  }
  return files;
}

const files = [...(await walk(ROOT)), ...(await walk(SERVER))];
for (const extra of EXTRA) {
  try {
    const entries = await readdir(extra, { withFileTypes: true });
    for (const e of entries) {
      if (e.isFile() && /\.(ts|tsx|html)$/.test(e.name)) files.push(path.join(extra, e.name));
    }
  } catch {
    try {
      files.push(extra);
    } catch {
      /* ignore */
    }
  }
}

let changed = 0;
for (const file of files) {
  let content = await readFile(file, 'utf8');
  const before = content;
  for (const [from, to] of REPLACEMENTS) {
    content = content.split(from).join(to);
  }
  if (content !== before) {
    await writeFile(file, content, 'utf8');
    changed += 1;
    console.log('updated:', path.relative(process.cwd(), file));
  }
}

console.log(`Done: ${changed} file(s) updated`);
