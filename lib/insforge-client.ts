import { createClient } from '@insforge/sdk';

export function getInsforgeClient() {
  const baseUrl = process.env.INSFORGE_BASE_URL ?? process.env.NEXT_PUBLIC_INSFORGE_BASE_URL;
  const anonKey = process.env.INSFORGE_ANON_KEY ?? process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY;

  if (!baseUrl || !anonKey) {
    throw new Error('INSFORGE_BASE_URL and INSFORGE_ANON_KEY must be set in environment variables. Use .env.local with INSFORGE_BASE_URL, INSFORGE_ANON_KEY or NEXT_PUBLIC_INSFORGE_BASE_URL, NEXT_PUBLIC_INSFORGE_ANON_KEY.');
  }

  return createClient({ baseUrl, anonKey });
}
