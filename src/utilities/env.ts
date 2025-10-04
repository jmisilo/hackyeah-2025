import { envVariables } from '@/environment-variables';

export const isProduction = () =>
  process.env.NODE_ENV === 'production' &&
  (envVariables.VERCEL_ENV === 'production' ||
    envVariables.NEXT_PUBLIC_VERCEL_ENV === 'production');
export const isPreview = () =>
  !isProduction() &&
  (envVariables.VERCEL_ENV === 'preview' || envVariables.NEXT_PUBLIC_VERCEL_ENV === 'preview');

export const isDevelopment = () => !isProduction() && !isPreview();
