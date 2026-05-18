import { HiAcademicCap, HiHandThumbUp, HiChatBubbleLeftRight } from 'react-icons/hi2';
import type { ExtendedMasterProfile } from './types';
import {
  computeExperienceYears,
  satisfiedClientsPercent,
} from './masterProfileUtils';

type Props = { master: ExtendedMasterProfile };

export function MasterTrustStats({ master }: Props) {
  const years = computeExperienceYears(master.careerItems);
  const satisfied = satisfiedClientsPercent(master.rating, master.reviewsCount);
  const portfolioCount = master.portfolio?.length ?? 0;

  const items: { icon: typeof HiAcademicCap; label: string; value: string }[] = [];

  if (years != null && years > 0) {
    items.push({
      icon: HiAcademicCap,
      label: 'Опыт работы',
      value: `${years} ${years === 1 ? 'год' : years < 5 ? 'года' : 'лет'}`,
    });
  }
  if (satisfied != null) {
    items.push({
      icon: HiHandThumbUp,
      label: 'Довольных клиентов',
      value: `${satisfied}%`,
    });
  }
  if (master.reviewsCount >= 3 && master.rating >= 4) {
    items.push({
      icon: HiChatBubbleLeftRight,
      label: 'Рейтинг',
      value: master.rating.toFixed(1),
    });
  }

  if (!items.length) {
    if (portfolioCount > 0) {
      items.push({
        icon: HiHandThumbUp,
        label: 'Портфолио',
        value: `${portfolioCount} работ`,
      });
    } else {
      return null;
    }
  }

  return (
    <section className="mt-8 grid grid-cols-3 gap-2">
      {items.slice(0, 3).map(({ icon: Icon, label, value }) => (
        <div
          key={label}
          className="rounded-[20px] bg-[#FAFAFA] px-2 py-4 text-center"
        >
          <Icon className="mx-auto h-6 w-6 text-[#F47C8C]" aria-hidden />
          <p className="mt-2 text-[11px] leading-tight text-[#9CA3AF]">{label}</p>
          <p className="mt-1 text-[14px] font-semibold text-[#111827]">{value}</p>
        </div>
      ))}
    </section>
  );
}
