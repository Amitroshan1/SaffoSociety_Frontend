export const ENV = {
  /** Guard/backend API origin (no trailing slash). Default matches backend PDF. */
  API_URL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  /** Media origin for /uploads/... paths — same host as API, never /api prefix. */
  MEDIA_URL: import.meta.env.VITE_MEDIA_URL || import.meta.env.VITE_API_URL || 'http://localhost:8000',
  APP_NAME: import.meta.env.VITE_APP_NAME || 'Society Management',
};
