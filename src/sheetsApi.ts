import { getGuestDisplayName } from './weddingConfig';

/**
 * Google Apps Script Web App URL (from Deploy → Manage deployments).
 * Can be overridden with VITE_GOOGLE_APPS_SCRIPT_URL in .env / Vercel env vars.
 */
const DEFAULT_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbyMzcivO5Q7rHneRfHk_b0VHMj-G0A1LwgvWenjt95DdwFE6N8Q0STp_ao-HuPwUEIAsw/exec';

export const SCRIPT_URL: string =
  (import.meta.env.VITE_GOOGLE_APPS_SCRIPT_URL as string | undefined) || DEFAULT_SCRIPT_URL;

export const isSheetsConfigured = () => SCRIPT_URL.startsWith('https://script.google.com/');

async function post(fields: Record<string, string>) {
  if (!isSheetsConfigured()) throw new Error('Google Sheets URL is not configured.');
  // URL-encoded body is a "simple" request, so it works with Apps Script under no-cors.
  await fetch(SCRIPT_URL, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
    body: new URLSearchParams({ ...fields, invitedAs: getGuestDisplayName() }).toString(),
  });
}

export function submitRSVP(data: { name: string; attendance: 'Yes' | 'No'; guests: string; dietary: string }) {
  return post({ sheet: 'RSVP', ...data });
}

export function submitWish(data: { name: string; message: string }) {
  return post({ sheet: 'Wishes', ...data });
}
