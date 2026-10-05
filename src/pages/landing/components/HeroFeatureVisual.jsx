import { useEffect, useState } from 'react';

const INTERVAL_MS = 5000;

const HERO_IMAGES = [
  {
    src: '/landing-page-images/society1.png',
    alt: 'Resident management features in Saffo Society',
  },
  {
    src: '/landing-page-images/society2.png',
    alt: 'Maintenance and complaints features in Saffo Society',
  },
  {
    src: '/landing-page-images/society3.png',
    alt: 'Billing and finance features in Saffo Society',
  },
  {
    src: '/landing-page-images/society4.png',
    alt: 'Society notices and announcements features',
  },
  {
    src: '/landing-page-images/society5.png',
    alt: 'Amenities booking features in Saffo Society',
  },
  {
    src: '/landing-page-images/society6.png',
    alt: 'Visitor and gate management features',
  },
  {
    src: '/landing-page-images/society7.png',
    alt: 'Reports and society records features',
  },
];

export default function HeroFeatureVisual() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    HERO_IMAGES.forEach(({ src }) => {
      const img = new Image();
      img.src = src;
    });
  }, []);

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) return undefined;

    const id = window.setInterval(() => {
      if (document.visibilityState === 'hidden') return;
      setActive((index) => (index + 1) % HERO_IMAGES.length);
    }, INTERVAL_MS);

    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="hero-visual" aria-live="polite">
      {HERO_IMAGES.map((image, index) => (
        <img
          key={image.src}
          src={image.src}
          alt={image.alt}
          className={index === active ? 'is-active' : undefined}
          loading="eager"
          decoding="async"
          fetchPriority={index === 0 ? 'high' : 'low'}
          draggable={false}
        />
      ))}
    </div>
  );
}
