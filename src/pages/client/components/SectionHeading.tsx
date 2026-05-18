import { Link } from 'react-router-dom';

type Props = {
  title: string;
  subtitle?: string;
  href?: string;
  linkLabel?: string;
  onLinkClick?: () => void;
};

export function SectionHeading({ title, subtitle, href, linkLabel = 'Все', onLinkClick }: Props) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3">
      <div className="min-w-0">
        <h2 className="text-[20px] font-semibold tracking-tight text-[#111827]">{title}</h2>
        {subtitle ? (
          <p className="mt-0.5 text-[13px] leading-snug text-[#9CA3AF]">{subtitle}</p>
        ) : null}
      </div>
      {href ? (
        <Link to={href} className="shrink-0 pb-0.5 text-[14px] font-semibold text-[#F47C8C]">
          {linkLabel}
        </Link>
      ) : onLinkClick ? (
        <button
          type="button"
          onClick={onLinkClick}
          className="shrink-0 pb-0.5 text-[14px] font-semibold text-[#F47C8C]"
        >
          {linkLabel}
        </button>
      ) : null}
    </div>
  );
}
