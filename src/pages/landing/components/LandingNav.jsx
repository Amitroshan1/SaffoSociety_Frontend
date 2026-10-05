import { useEffect, useId, useRef, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { usePublicEntry } from '@/auth/usePublicEntry';

export default function LandingNav({ featuresRef, panelsRef, aboutRef }) {
  const enterApplication = usePublicEntry();
  const menuId = useId();
  const firstLinkRef = useRef(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    let observer;
    let cancelled = false;
    let tries = 0;

    const setup = () => {
      if (cancelled) return;
      const sections = [
        { id: 'features', el: featuresRef?.current },
        { id: 'panels', el: panelsRef?.current },
        { id: 'about', el: aboutRef?.current },
      ].filter((s) => s.el);

      if (!sections.length) {
        if (tries < 40) {
          tries += 1;
          window.requestAnimationFrame(setup);
        }
        return;
      }

      observer = new IntersectionObserver(
        (entries) => {
          const visible = entries
            .filter((entry) => entry.isIntersecting)
            .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
          if (visible[0]) {
            const match = sections.find((s) => s.el === visible[0].target);
            if (match) setActiveSection(match.id);
          }
        },
        {
          root: null,
          rootMargin: '-28% 0px -55% 0px',
          threshold: [0.08, 0.2, 0.4],
        },
      );

      sections.forEach(({ el }) => observer.observe(el));
    };

    setup();

    return () => {
      cancelled = true;
      observer?.disconnect();
    };
  }, [featuresRef, panelsRef, aboutRef]);

  useEffect(() => {
    if (!mobileNavOpen) return undefined;
    const onKey = (event) => {
      if (event.key === 'Escape') setMobileNavOpen(false);
    };
    window.addEventListener('keydown', onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    firstLinkRef.current?.focus();
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileNavOpen]);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 768) setMobileNavOpen(false);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const scrollTo = (ref) => {
    setMobileNavOpen(false);
    const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ? 'auto'
      : 'smooth';
    window.requestAnimationFrame(() => {
      ref.current?.scrollIntoView({ behavior, block: 'start' });
    });
  };

  const goLogin = () => {
    setMobileNavOpen(false);
    enterApplication();
  };

  const links = [
    { id: 'features', label: 'Features', ref: featuresRef },
    { id: 'panels', label: 'Panels', ref: panelsRef },
    { id: 'about', label: 'About', ref: aboutRef },
  ];

  return (
    <header className={`landing-nav ${scrolled ? 'is-scrolled' : ''}`}>
      <div className="landing-nav-inner">
        <a className="nav-brand-link" href="#top" onClick={() => setMobileNavOpen(false)}>
          <img src="/logo.png" alt="" width="44" height="44" className="nav-logo" />
          <span className="nav-brand-text">
            <span className="nav-brand">Saffo Society</span>
            <span className="nav-sub">A Better Living Together</span>
          </span>
        </a>

        <nav className="nav-desktop" aria-label="Page">
          {links.map(({ id, label, ref }) => (
            <button
              key={id}
              type="button"
              className={`nav-link${activeSection === id ? ' is-active' : ''}`}
              aria-current={activeSection === id ? 'true' : undefined}
              onClick={() => scrollTo(ref)}
            >
              {label}
            </button>
          ))}
        </nav>

        <div className="nav-actions">
          <button type="button" className="nav-signin" onClick={goLogin}>
            Sign In
          </button>
          <button type="button" className="nav-cta" onClick={goLogin}>
            Get Started
            <ArrowRight size={15} strokeWidth={2} aria-hidden="true" className="nav-cta-arrow" />
          </button>
          <button
            type="button"
            className="nav-menu-btn"
            aria-label={mobileNavOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileNavOpen}
            aria-controls={menuId}
            onClick={() => setMobileNavOpen((open) => !open)}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
              {mobileNavOpen ? (
                <>
                  <line x1="6" y1="6" x2="18" y2="18" />
                  <line x1="6" y1="18" x2="18" y2="6" />
                </>
              ) : (
                <>
                  <line x1="4" y1="7" x2="20" y2="7" />
                  <line x1="4" y1="12" x2="20" y2="12" />
                  <line x1="4" y1="17" x2="20" y2="17" />
                </>
              )}
            </svg>
          </button>
        </div>
      </div>

      {mobileNavOpen ? (
        <>
          <button type="button" className="nav-backdrop" aria-label="Close menu" onClick={() => setMobileNavOpen(false)} />
          <nav id={menuId} className="mobile-menu" aria-label="Mobile">
            {links.map(({ id, label, ref }, index) => (
              <button
                key={id}
                ref={index === 0 ? firstLinkRef : undefined}
                type="button"
                className={`mobile-link${activeSection === id ? ' is-active' : ''}`}
                onClick={() => scrollTo(ref)}
              >
                {label}
              </button>
            ))}
            <div className="mobile-actions">
              <button type="button" className="nav-signin mobile-signin" onClick={goLogin}>
                Sign In
              </button>
              <button type="button" className="nav-cta mobile-cta" onClick={goLogin}>
                Get Started
                <ArrowRight size={15} strokeWidth={2} aria-hidden="true" className="nav-cta-arrow" />
              </button>
            </div>
          </nav>
        </>
      ) : null}
    </header>
  );
}
