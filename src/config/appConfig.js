import { ENV } from './env';

export const appConfig = {
  name: ENV.APP_NAME,
  apiUrl: ENV.API_URL,
  modules: ['super-admin', 'admin', 'guard', 'resident', 'finance'],
};
