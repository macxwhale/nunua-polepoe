// Paystack config — reads VITE_PAYSTACK_ENV to automatically pick test or prod keys.
// To switch environments, change VITE_PAYSTACK_ENV in .env from "test" to "prod".

const env = import.meta.env.VITE_PAYSTACK_ENV ?? 'test';
const isProd = env === 'prod';

export const paystackConfig = {
  env,
  isProd,
  publicKey: isProd
    ? import.meta.env.VITE_PAYSTACK_PROD_PUBLIC_KEY
    : import.meta.env.VITE_PAYSTACK_TEST_PUBLIC_KEY,
  planCodes: {
    monthly: isProd
      ? import.meta.env.VITE_PAYSTACK_PROD_MONTHLY_PLAN_CODE
      : import.meta.env.VITE_PAYSTACK_TEST_MONTHLY_PLAN_CODE,
    '6month': isProd
      ? import.meta.env.VITE_PAYSTACK_PROD_6MONTH_PLAN_CODE
      : import.meta.env.VITE_PAYSTACK_TEST_6MONTH_PLAN_CODE,
    '12month': isProd
      ? import.meta.env.VITE_PAYSTACK_PROD_12MONTH_PLAN_CODE
      : import.meta.env.VITE_PAYSTACK_TEST_12MONTH_PLAN_CODE,
  },
} as const;
