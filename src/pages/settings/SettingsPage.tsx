import { Link } from 'react-router-dom';
import { HUB_PATH } from '../../app/paths';

export function SettingsPage() {
  return (
    <div className="mx-auto max-w-md space-y-4 px-4 py-8">
      <h1 className="text-2xl font-semibold">Настройки</h1>
      <p className="text-neutral-500">Раздел скоро появится.</p>
      <Link to={HUB_PATH} className="inline-block rounded-xl bg-brand-primary px-5 py-3 text-white shadow-sm">
        На главную
      </Link>
    </div>
  );
}
