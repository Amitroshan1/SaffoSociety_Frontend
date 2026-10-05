# Frontend-Side

New frontend workspace (module-based). Landing page is live.

## Run

```bash
cd Frontend-Side
npm install
npm run dev
```

Open `http://localhost:5174` — full **Saffo Society** landing page.

Auth (login/register) is not wired yet; CTAs show a **Coming soon** toast.

## Landing structure

```
src/pages/landing/
  LandingPage.jsx
  landingData.js
  components/
    LandingNav.jsx
    ParticleField.jsx
    FloatingOrb.jsx
    ComingSoonToast.jsx
```

Styles: `src/styles/landing.css` + Tailwind.
