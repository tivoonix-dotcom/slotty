import { useEffect, useState, type FC } from 'react';
import { Link } from 'react-router-dom';
import {
  buildDemoNearbyMarqueeChips,
  buildMarqueeTrack,
  loadNearbyMarqueeChips,
  splitMarqueeRows,
  type NearbyMarqueeChip,
} from './homeLandingNearbyMarqueeData';
import {
  homeLandingNearbyChip,
  homeLandingNearbyMarqueeRow,
  homeLandingNearbyMarqueeShell,
} from './homeTheme';

function NearbyMarqueeRow({
  items,
  reverse = false,
}: {
  items: NearbyMarqueeChip[];
  reverse?: boolean;
}) {
  const track = buildMarqueeTrack(items);

  return (
    <div className={homeLandingNearbyMarqueeRow}>
      <div
        className={`flex w-max gap-2.5 py-0.5 sm:gap-3 motion-reduce:animate-none ${
          reverse ? 'animate-services-marquee-right' : 'animate-services-marquee-left'
        }`}
      >
        {track.map((chip, index) => (
          <Link
            key={`${chip.id}-${index}`}
            to={chip.to}
            className={homeLandingNearbyChip}
          >
            {chip.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

export const HomeLandingNearbyMarquee: FC = () => {
  const [chips, setChips] = useState<NearbyMarqueeChip[]>(() => buildDemoNearbyMarqueeChips());

  useEffect(() => {
    let cancelled = false;
    void loadNearbyMarqueeChips().then((next) => {
      if (!cancelled) setChips(next);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (chips.length === 0) return null;

  const [rowA, rowB] = splitMarqueeRows(chips);

  return (
    <div className={homeLandingNearbyMarqueeShell} aria-label="Мастера рядом с вами">
      <NearbyMarqueeRow items={rowA.length > 0 ? rowA : chips} />
      <NearbyMarqueeRow items={rowB.length > 0 ? rowB : chips} reverse />
    </div>
  );
};
