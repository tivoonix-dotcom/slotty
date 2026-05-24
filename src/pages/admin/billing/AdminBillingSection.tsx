import { homeShell } from './adminBillingLandingTheme';
import { AdminBillingTab } from './AdminBillingTab';

export function AdminBillingSection() {
  return (
    <div className={`${homeShell} pb-10 pt-1 lg:pt-2`}>
      <div className="mx-auto max-w-[40rem] text-center">
        <h1 className="text-[clamp(1.65rem,5vw,2.35rem)] font-bold leading-[1.08] tracking-[-0.04em] text-[#111827]">
          Мой тариф
        </h1>

      </div>
      <AdminBillingTab />
    </div>
  );
}
