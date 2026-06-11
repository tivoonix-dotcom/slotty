import {
  createElement,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
} from 'react';

export type LandingRevealVariant = 'up' | 'left' | 'right' | 'scale' | 'blur-up';

const VARIANT_CLASS: Record<LandingRevealVariant, string> = {
  up: '',
  left: 'landing-reveal--from-left',
  right: 'landing-reveal--from-right',
  scale: 'landing-reveal--scale',
  'blur-up': 'landing-reveal--blur-up',
};

const REVEAL_TAGS = [
  'div',
  'section',
  'article',
  'header',
  'li',
  'span',
  'h1',
  'h2',
  'h3',
  'p',
  'ol',
  'ul',
] as const;

type LandingRevealTag = (typeof REVEAL_TAGS)[number];

export type LandingRevealProps = {
  as?: LandingRevealTag;
  variant?: LandingRevealVariant;
  /** Задержка перед стартом анимации, мс */
  delay?: number;
  /** Длительность анимации, мс */
  duration?: number;
  /** Показать сразу при загрузке (hero), без ожидания скролла */
  immediate?: boolean;
  threshold?: number;
  rootMargin?: string;
  once?: boolean;
  children?: ReactNode;
} & HTMLAttributes<HTMLElement>;

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function LandingReveal({
  as = 'div',
  variant = 'up',
  delay = 0,
  duration,
  immediate = false,
  threshold = 0.12,
  rootMargin = '0px 0px -6% 0px',
  once = true,
  className = '',
  style,
  children,
  ...rest
}: LandingRevealProps) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(() => immediate && prefersReducedMotion());

  useEffect(() => {
    if (prefersReducedMotion()) {
      setVisible(true);
      return;
    }

    if (immediate) {
      const id = window.requestAnimationFrame(() => {
        setVisible(true);
      });
      return () => window.cancelAnimationFrame(id);
    }

    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          if (once) observer.disconnect();
        } else if (!once) {
          setVisible(false);
        }
      },
      { threshold, rootMargin },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [immediate, once, threshold, rootMargin]);

  const revealStyle: CSSProperties = {
    ...style,
    ...(delay > 0 ? { ['--landing-reveal-delay' as string]: `${delay}ms` } : {}),
    ...(duration ? { ['--landing-reveal-duration' as string]: `${duration}ms` } : {}),
  };

  const classes = [
    'landing-reveal',
    VARIANT_CLASS[variant],
    visible ? 'is-visible' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return createElement(
    as,
    {
      ref,
      className: classes,
      style: revealStyle,
      ...rest,
    },
    children,
  );
}
