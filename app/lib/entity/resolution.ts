import { z } from 'zod';

export type PlatformType = 'company_domain' | 'linkedin' | 'job_board' | 'social' | 'unknown';

export const EntityInputSchema = z.object({
  url: z.string().min(1),
  additionalUrl: z.string().optional(),
  type: z.enum(['company_domain', 'linkedin', 'job_board', 'social', 'unknown']).optional(),
});

export type EntityInput = z.infer<typeof EntityInputSchema>;

export function normalizeUrl(rawUrl: string): string | null {
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;
  try {
    // Add protocol if missing
    const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    const url = new URL(withScheme);
    // Remove trailing slash
    return url.toString().replace(/\/$/, '');
  } catch {
    return null;
  }
}

export function detectPlatform(url: string): PlatformType {
  const lower = url.toLowerCase();
  try {
    const hostname = new URL(url).hostname;
    if (hostname.includes('linkedin.com')) return 'linkedin';
    if (hostname.includes('indeed.') || hostname.includes('glassdoor.') || hostname.includes('monster.')) return 'job_board';
    if (hostname.includes('twitter.com') || hostname.includes('x.com') || hostname.includes('facebook.com') || hostname.includes('instagram.com')) return 'social';
    return 'company_domain'; // Default assumption
  } catch {
    return 'unknown';
  }
}

/**
 * Tries to extract the company domain/name from a third-party URL.
 * This is a heuristic and might need to fetch the page in a real production environment.
 */
export function extractCompanyFromUrl(url: string): string | null {
  const platform = detectPlatform(url);
  if (platform === 'company_domain') return url;

  try {
    const u = new URL(url);
    const path = u.pathname;

    // LinkedIn Company Page: /company/stripe
    if (platform === 'linkedin' && path.includes('/company/')) {
        const parts = path.split('/').filter(Boolean);
        const idx = parts.indexOf('company');
        if (idx !== -1 && parts[idx + 1]) {
            // Return a search query or a best guess domain
            // In a real app, we would search Google for "LinkedIn <company> website"
            return parts[idx + 1];
        }
    }

    return null;
  } catch {
    return null;
  }
}
