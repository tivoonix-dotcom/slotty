import { Link, useNavigate } from 'react-router-dom';
import { HUB_PATH, SERVICES_PATH } from '../app/paths';

const NOT_FOUND_ILLUSTRATION_SRC = '/photos/404/1.webp';

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-white px-4 py-10 text-center">
      <h1 className="sr-only">Страница не найдена</h1>
      <img
        src={NOT_FOUND_ILLUSTRATION_SRC}
        alt="404 — страница не найдена"
        width={640}
        height={640}
        decoding="async"
        className="h-auto w-full max-w-[min(100%,640px)] object-contain"
      />
      <p className="mt-4 max-w-md text-[15px] leading-relaxed text-neutral-600">
        Такой страницы нет или ссылка устарела. Перейдите в каталог мастеров или на главную SLOTTY.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Link
          to={SERVICES_PATH}
          className="rounded-full bg-[#F47C8C] px-5 py-2.5 text-[15px] font-semibold text-white"
        >
          К каталогу
        </Link>
        <Link
          to={HUB_PATH}
          className="rounded-full border border-neutral-200 px-5 py-2.5 text-[15px] font-semibold text-neutral-800"
        >
          На главную
        </Link>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="text-[15px] font-semibold text-[#F47C8C] underline-offset-2 hover:underline"
        >
          Назад
        </button>
      </div>
    </main>
  );
}
