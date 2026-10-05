import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import AuthBoot from '@/auth/AuthBoot';
import { homeForRole } from '@/auth/roles';
import { useAuth } from '@/hooks/useAuth';
import { societyByName, LOGIN_SOCIETIES } from '@/tenant/loginSocieties';
import '@/styles/login.css';

const SOCIETIES = LOGIN_SOCIETIES.map((society) => society.name);

function isEmail(value) {
  return /\S+@\S+\.\S+/.test(value.trim());
}

function FieldError({ id, children }) {
  if (!children) return null;
  return (
    <p className="login-error" id={id} role="alert">
      <svg viewBox="0 0 16 16" aria-hidden="true">
        <circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <path d="M8 4.75v3.75M8 11h.01" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
      {children}
    </p>
  );
}

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated, isLoading, user } = useAuth();
  const [query, setQuery] = useState('');
  const [society, setSociety] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState({ society: false, email: false, password: false });
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState('');
  const societyRef = useRef(null);

  useEffect(() => {
    function onDoc(event) {
      if (!societyRef.current?.contains(event.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const suggestions = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return SOCIETIES.slice(0, 6);
    return SOCIETIES.filter((name) => name.toLowerCase().includes(needle)).slice(0, 6);
  }, [query]);

  const ready = Boolean(society) && isEmail(email) && password.length > 0;

  const errors = {
    society: touched.society && !society ? 'Select your society to continue.' : '',
    email: touched.email && !isEmail(email) ? 'Enter a valid email address.' : '',
    password: touched.password && !password ? 'Password is required.' : '',
  };

  function touchIfFilled(field, value) {
    if (!value.trim()) return;
    setTouched((prev) => (prev[field] ? prev : { ...prev, [field]: true }));
  }

  function onSocietyChange(value) {
    if (isEmail(value) && !SOCIETIES.some((name) => name.toLowerCase() === value.trim().toLowerCase())) {
      if (!email) setEmail(value.trim());
      setQuery('');
      setSociety('');
      return;
    }
    setQuery(value);
    const exact = SOCIETIES.find((name) => name.toLowerCase() === value.trim().toLowerCase());
    setSociety(exact || '');
    setOpen(true);
    setActive(-1);
  }

  function pickSociety(name) {
    setQuery(name);
    setSociety(name);
    setOpen(false);
    setActive(-1);
  }

  function onSocietyKeyDown(event) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setOpen(true);
      if (suggestions.length) setActive((index) => (index + 1) % suggestions.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setOpen(true);
      if (suggestions.length) setActive((index) => (index <= 0 ? suggestions.length - 1 : index - 1));
    } else if (event.key === 'Enter' && open && active >= 0 && suggestions[active]) {
      event.preventDefault();
      pickSociety(suggestions[active]);
    } else if (event.key === 'Escape' && open) {
      event.preventDefault();
      setOpen(false);
      setActive(-1);
    }
  }

  async function onSubmit(event) {
    event.preventDefault();
    if (busy) return;
    if (!ready) {
      setTouched({ society: true, email: true, password: true });
      return;
    }
    setBusy(true);
    setFormError('');
    try {
      const selected = societyByName(society);
      if (!selected) {
        setFormError('Invalid society, email, or password.');
        return;
      }
      const session = await login({
        societyId: selected.id,
        email: email.trim(),
        password,
      });
      navigate(homeForRole(session.user.role), { replace: true });
    } catch (err) {
      setFormError(err.message || 'Invalid society, email, or password.');
    } finally {
      setBusy(false);
    }
  }

  const listOpen = open && (suggestions.length > 0 || query.trim().length > 0);

  if (isLoading) return <AuthBoot />;
  if (isAuthenticated && user) return <Navigate to={homeForRole(user.role)} replace />;

  return (
    <main className="login-screen">
      <div className="login-visual" aria-hidden="true" />
      <section className="login-side" aria-labelledby="login-title">
        <Link className="login-back" to="/">
          Back
        </Link>
        <form className="login-form" onSubmit={onSubmit} noValidate>
          <div className="login-head">
            <p className="login-kicker">Saffo Society</p>
            <h1 id="login-title">Login</h1>
            <p className="login-lead">Search your society, then sign in with your email.</p>
          </div>

          <div className={`login-field${errors.society ? ' has-error' : ''}`} ref={societyRef}>
            <label htmlFor="login-society">Search society</label>
            <div className="login-control">
              <svg className="login-control-icon" viewBox="0 0 20 20" aria-hidden="true">
                <circle cx="9" cy="9" r="5.75" fill="none" stroke="currentColor" strokeWidth="1.6" />
                <path d="M13.5 13.5L17 17" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
              <input
                id="login-society"
                type="search"
                name="society-search"
                role="combobox"
                value={query}
                placeholder="Search or select your society"
                autoComplete="off"
                data-lpignore="true"
                data-1p-ignore="true"
                aria-autocomplete="list"
                aria-expanded={listOpen}
                aria-controls="login-society-list"
                aria-activedescendant={listOpen && active >= 0 ? `login-society-${active}` : undefined}
                aria-invalid={Boolean(errors.society)}
                aria-describedby={errors.society ? 'login-society-error' : undefined}
                onChange={(event) => onSocietyChange(event.target.value)}
                onFocus={() => setOpen(true)}
                onBlur={() => touchIfFilled('society', query)}
                onKeyDown={onSocietyKeyDown}
              />
              {society ? (
                <svg className="login-control-check" viewBox="0 0 20 20" aria-label="Society selected" role="img">
                  <path d="M5 10.5l3.25 3.25L15 7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : null}
              {listOpen ? (
                <ul className="login-suggest" id="login-society-list" role="listbox" aria-label="Societies">
                  {suggestions.length ? (
                    suggestions.map((name, index) => (
                      <li
                        key={name}
                        id={`login-society-${index}`}
                        role="option"
                        aria-selected={name === society}
                        className={`${index === active ? 'is-active' : ''}${name === society ? ' is-selected' : ''}`.trim() || undefined}
                        onMouseDown={(event) => {
                          event.preventDefault();
                          pickSociety(name);
                        }}
                        onMouseEnter={() => setActive(index)}
                      >
                        <span>{name}</span>
                        {name === society ? (
                          <svg viewBox="0 0 20 20" aria-hidden="true">
                            <path d="M5 10.5l3.25 3.25L15 7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        ) : null}
                      </li>
                    ))
                  ) : (
                    <li className="login-suggest-empty" role="option" aria-disabled="true" aria-selected="false">
                      No society found
                    </li>
                  )}
                </ul>
              ) : null}
            </div>
            <FieldError id="login-society-error">{errors.society}</FieldError>
          </div>

          <div className={`login-field${errors.email ? ' has-error' : ''}`}>
            <label htmlFor="login-email">Email</label>
            <input
              id="login-email"
              type="email"
              value={email}
              name="email"
              placeholder="name@email.com"
              autoComplete="username"
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? 'login-email-error' : undefined}
              onChange={(event) => setEmail(event.target.value)}
              onBlur={() => touchIfFilled('email', email)}
            />
            <FieldError id="login-email-error">{errors.email}</FieldError>
          </div>

          <div className={`login-field${errors.password ? ' has-error' : ''}`}>
            <label htmlFor="login-password">Password</label>
            <div className="login-control login-control--password">
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                name="password"
                placeholder="Password"
                autoComplete="current-password"
                aria-invalid={Boolean(errors.password)}
                aria-describedby={errors.password ? 'login-password-error' : undefined}
                onChange={(event) => setPassword(event.target.value)}
                onBlur={() => touchIfFilled('password', password)}
              />
              <button
                type="button"
                className="login-eye"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
                aria-controls="login-password"
              >
                {showPassword ? (
                  <svg viewBox="0 0 20 20" aria-hidden="true">
                    <path d="M3 3l14 14M8.6 8.6a2 2 0 0 0 2.8 2.8M6.2 6.3C4.4 7.4 3.1 9 2.5 10c1.3 2.3 4 5 7.5 5 1.4 0 2.7-.4 3.8-1.1M9 5.1c.3 0 .7-.1 1-.1 3.5 0 6.2 2.7 7.5 5-.4.8-1.1 1.7-1.9 2.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 20 20" aria-hidden="true">
                    <path d="M2.5 10c1.3-2.3 4-5 7.5-5s6.2 2.7 7.5 5c-1.3 2.3-4 5-7.5 5s-6.2-2.7-7.5-5z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                    <circle cx="10" cy="10" r="2.25" fill="none" stroke="currentColor" strokeWidth="1.5" />
                  </svg>
                )}
              </button>
            </div>
            <FieldError id="login-password-error">{errors.password}</FieldError>
          </div>

          <FieldError id="login-form-error">{formError}</FieldError>

          <button type="submit" className="login-submit" disabled={busy} aria-disabled={!ready || busy} aria-busy={busy}>
            {busy ? (
              <>
                <span className="login-spinner" aria-hidden="true" />
                Signing in...
              </>
            ) : (
              'Login'
            )}
          </button>
        </form>
      </section>
    </main>
  );
}
