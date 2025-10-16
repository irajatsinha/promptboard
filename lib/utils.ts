// =============================================================================
// 7. LIB/UTILS.TS - Core Utilities
// =============================================================================
// lib/utils.ts
import crypto from 'crypto';

export function wilsonScore(up: number, n: number, z = 1.96): number {
  if (n === 0) return 0;
  const phat = up / n;
  const denom = 1 + (z * z) / n;
  const num = phat + (z * z) / (2 * n) - z * Math.sqrt((phat * (1 - phat) + (z * z) / (4 * n)) / n);
  return num / denom;
}

export function hotScore(votes: number, createdAt: string): number {
  const ageHours = (Date.now() - new Date(createdAt).getTime()) / 3600000;
  const nEff = votes * Math.exp(-ageHours / 72);
  return wilsonScore(nEff, Math.max(1, nEff));
}

export function hashIP(ip: string): string {
  const salt = process.env.IP_SALT!;
  return crypto.createHash('sha256').update(salt + ip).digest('hex');
}

export function getClientIP(headers: Headers): string {
  return (
    headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    headers.get('x-real-ip') ||
    '127.0.0.1'
  );
}

const PROFANITY = ['badword1', 'badword2', 'spam']; // Add your list

export function containsProfanity(text: string): boolean {
  const lower = text.toLowerCase();
  return PROFANITY.some(word => lower.includes(word));
}

export function validatePromptInput(data: any): {
  valid: boolean;
  error?: string;
} {
  if (!data.title || data.title.length > 120) {
    return { valid: false, error: 'Title must be 1-120 characters.' };
  }
  if (!data.prompt_text || data.prompt_text.length > 5000) {
    return { valid: false, error: 'Prompt must be 1-5000 characters.' };
  }
  if (!data.name || data.name.length > 60) {
    return { valid: false, error: 'Name must be 1-60 characters.' };
  }
  if (data.tag && data.tag.length > 30) {
    return { valid: false, error: 'Tag must be max 30 characters.' };
  }
  if (data.honeypot && data.honeypot.length > 0) {
    return { valid: false, error: 'Invalid submission.' };
  }
  if (
    containsProfanity(data.title) ||
    containsProfanity(data.prompt_text) ||
    containsProfanity(data.name)
  ) {
    return { valid: false, error: 'Content contains inappropriate language.' };
  }
  return { valid: true };
}