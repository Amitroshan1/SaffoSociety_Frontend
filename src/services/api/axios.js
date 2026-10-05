import axios from 'axios';
import { ENV } from '@/config/env';
import { attachInterceptors } from './interceptors';

const api = axios.create({
  baseURL: ENV.API_URL,
  withCredentials: true,
});

attachInterceptors(api);

export default api;
