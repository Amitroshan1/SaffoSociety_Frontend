import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Check } from 'lucide-react';
import { usePublicEntry } from '@/auth/usePublicEntry';
import {
  ACCESS_POINTS,
  BENEFITS,
  FEATURES,
  PANELS,
  PROBLEMS,
  ROLES,
  STEPS,
  TEAM,
} from '@/pages/landing/landingData';
import LandingNav from '@/pages/landing/components/LandingNav';
import ComingSoonToast from '@/pages/landing/components/ComingSoonToast';
import HeroFeatureVisual from '@/pages/landing/components/HeroFeatureVisual';
import '@/styles/landing.css';

const iconProps = { size: 20, strokeWidth: 1.75, 'aria-hidden': true };

export default function LandingPage() {
  const enterApplication = usePublicEntry();
  const [toastOpen, setToastOpen] = useState(false);
  const toastTimer = useRef(null);

  const featuresRef = useRef(null);
  const panelsRef = useRef(null);
  const aboutRef = useRef(null);

  const showUnavailable = () => {
    setToastOpen(true);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToastOpen(false), 2800);
  };

  useEffect(() => () => {
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
  }, []);

  const goLogin = () => enterApplication();

  const scrollToRef = (ref) => {
    const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ? 'auto'
      : 'smooth';
    ref.current?.scrollIntoView({ behavior, block: 'start' });
  };

  return (
    <div className="auth-bg landing-page" id="top">
      <LandingNav featuresRef={featuresRef} panelsRef={panelsRef} aboutRef={aboutRef} />

      <main>
        <section className="landing-hero" aria-labelledby="hero-title">
          <div className="hero-inner">
            <div className="hero-copy">
              <p className="hero-kicker">Residential society management</p>
              <h1 id="hero-title" className="hero-title">
                <span className="hero-line">Manage Your</span>
                <span className="hero-line hero-line-accent">Society Smarter</span>
              </h1>
              <p className="hero-lead">
                Everything your residential community needs to manage residents, security, maintenance and finances — in one place.
              </p>
              <div className="hero-actions">
                <button type="button" className="btn btn-primary" onClick={goLogin}>
                  Get Started
                  <ArrowRight size={18} strokeWidth={1.75} aria-hidden="true" />
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => scrollToRef(panelsRef)}>
                  Explore Panels
                </button>
              </div>
            </div>
            <HeroFeatureVisual />
          </div>
        </section>

        <section className="lp-section" aria-labelledby="problem-title">
          <div className="lp-wrap problem-layout">
            <div>
              <h2 id="problem-title" className="section-title">
                Everything your society needs.
                <span className="section-title-sub">Without the paperwork.</span>
              </h2>
              <p className="section-lead">
                Day-to-day society work is often split across registers, chats, and spreadsheets. Saffo Society is designed to hold that work in one place.
              </p>
            </div>
            <ul className="problem-list">
              {PROBLEMS.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </section>

        <section ref={featuresRef} className="lp-section" id="features" aria-labelledby="features-title">
          <div className="lp-wrap">
            <div className="section-head">
              <h2 id="features-title" className="section-title">Built for everyday society management.</h2>
              <p className="section-lead">The work a residential community handles every day.</p>
            </div>
            <div className="feature-grid">
              {FEATURES.map((feature) => (
                <article key={feature.label} className="feature-item">
                  <div className="icon-tile">
                    <feature.icon {...iconProps} />
                  </div>
                  <h3>{feature.label}</h3>
                  <p>{feature.desc}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section ref={panelsRef} className="lp-section" id="panels" aria-labelledby="panels-title">
          <div className="lp-wrap">
            <div className="section-head">
              <h2 id="panels-title" className="section-title">
                One platform.
                <span className="section-title-sub">Four dedicated experiences.</span>
              </h2>
              <p className="section-lead">
                Administrators, residents, guards, and finance teams each have a focused place to work.
              </p>
            </div>
            <div className="panel-grid">
              {PANELS.map((panel) => (
                <article
                  key={panel.id}
                  className="lp-panel"
                  style={{ '--accent': panel.accent, '--tile': panel.tile }}
                >
                  <div className="lp-panel-top">
                    <div className="icon-tile icon-tile-accent">
                      <panel.icon {...iconProps} />
                    </div>
                    <p className="lp-panel-kicker">{panel.kicker}</p>
                  </div>
                  <h3>{panel.title}</h3>
                  <p>{panel.desc}</p>
                  <button type="button" className="text-link" onClick={enterApplication}>
                    Open panel
                    <ArrowRight size={16} strokeWidth={1.75} aria-hidden="true" />
                  </button>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="lp-section" aria-labelledby="steps-title">
          <div className="lp-wrap">
            <div className="section-head">
              <h2 id="steps-title" className="section-title">How Saffo Society works</h2>
            </div>
            <ol className="steps">
              {STEPS.map((step) => (
                <li key={step.n}>
                  <span className="step-num">{step.n}</span>
                  <h3>{step.title}</h3>
                  <p>{step.desc}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="lp-section" aria-labelledby="roles-title">
          <div className="lp-wrap">
            <div className="section-head">
              <h2 id="roles-title" className="section-title">Everyone gets the tools they need.</h2>
              <p className="section-lead">
                Each role gets a focused experience. The records are designed to stay connected, so gate, accounts, and management work from the same society.
              </p>
            </div>
            <div className="role-grid">
              {ROLES.map((role) => (
                <article key={role.title} className="role-item">
                  <role.icon {...iconProps} />
                  <h3>{role.title}</h3>
                  <p>{role.desc}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="lp-section lp-section-rule" aria-labelledby="access-title">
          <div className="lp-wrap">
            <div className="section-head">
              <h2 id="access-title" className="section-title">Access designed around roles.</h2>
              <p className="section-lead">
                The platform separates access by role, so people reach the areas meant for their work.
              </p>
            </div>
            <div className="access-grid">
              {ACCESS_POINTS.map((point) => (
                <article key={point.title}>
                  <h3>{point.title}</h3>
                  <p>{point.desc}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="lp-section" aria-labelledby="benefits-title">
          <div className="lp-wrap">
            <div className="section-head">
              <h2 id="benefits-title" className="section-title">Less paperwork. More visibility.</h2>
            </div>
            <ul className="benefit-list">
              {BENEFITS.map((benefit) => (
                <li key={benefit.title}>
                  <Check size={16} strokeWidth={2} aria-hidden="true" />
                  <div>
                    <h3>{benefit.title}</h3>
                    <p>{benefit.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="lp-section" aria-labelledby="grow-title">
          <div className="lp-wrap lp-prose">
            <h2 id="grow-title" className="section-title">Built to grow with your society.</h2>
            <p className="section-lead">
              Saffo Society is being built as one platform for the roles a residential community already uses. Administration, residents, security, and finance are designed as connected workflows, so the product can deepen without splitting into separate tools.
            </p>
          </div>
        </section>

        <section className="lp-cta" aria-labelledby="cta-title">
          <div className="lp-wrap">
            <img src="/logo.png" alt="" width="52" height="52" className="cta-logo" />
            <h2 id="cta-title" className="section-title">
              Your society,
              <span className="section-title-sub">finally in one place.</span>
            </h2>
            <p className="section-lead">
              Bring residents, security, administration and finance together on one connected platform.
            </p>
            <div className="hero-actions">
              <button type="button" className="btn btn-primary" onClick={goLogin}>
                Get Started
                <ArrowRight size={18} strokeWidth={1.75} aria-hidden="true" />
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => scrollToRef(panelsRef)}
              >
                Explore Panels
              </button>
            </div>
          </div>
        </section>
      </main>

      <footer ref={aboutRef} className="lp-footer" id="about">
        <div className="lp-wrap footer-grid">
          <div className="footer-brand">
            <div className="footer-brand-row">
              <img src="/logo.png" alt="" width="36" height="36" className="nav-logo" />
              <div>
                <p className="nav-brand">Saffo Society</p>
                <p className="nav-sub">A Better Living Together</p>
              </div>
            </div>
            <p>
              A society management platform for residents, security, administration, and finance.
            </p>
          </div>

          <div>
            <h2 className="footer-label">Product</h2>
            <ul>
              <li>
                <button type="button" className="footer-link" onClick={() => scrollToRef(featuresRef)}>
                  Features
                </button>
              </li>
              <li>
                <button type="button" className="footer-link" onClick={() => scrollToRef(panelsRef)}>
                  Panels
                </button>
              </li>
              <li>
                <button type="button" className="footer-link" onClick={() => scrollToRef(aboutRef)}>
                  About
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h2 className="footer-label">Company</h2>
            <ul>
              {['Privacy Policy', 'Terms of Service', 'Support'].map((label) => (
                <li key={label}>
                  <button type="button" className="footer-link" onClick={showUnavailable}>
                    {label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="footer-label">Team</h2>
            <ul className="team-list">
              {TEAM.map((member) => (
                <li key={member.name}>
                  <span className="team-mark">{member.initials}</span>
                  <span>
                    <span className="team-name">{member.name}</span>
                    <span className="team-role">{member.role}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="lp-wrap footer-base">
          <p>Saffo Society © 2026. Built by SaffoTech.</p>
        </div>
      </footer>

      <ComingSoonToast open={toastOpen} onClose={() => setToastOpen(false)} />
    </div>
  );
}
