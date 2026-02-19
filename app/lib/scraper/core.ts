import * as cheerio from 'cheerio';
import pLimit from 'p-limit';
import { BENEFITS_LIST } from '../benefits';
import { safeFetch } from './safeFetch';
import { normalizeUrl } from '../entity/resolution';

// --- Constants ---
const MAX_IMAGES = 15;
const MAX_PAGES = 15;
const MAX_CANDIDATES = 240;
const MAX_LOGOS = 2;
const MAX_HERO = 3;
const FETCH_TIMEOUT_MS = 15000;
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36';
const IMAGE_EXT_RE = /\.(jpg|jpeg|png|webp|avif|gif)(?:$|[?#])/i;
const SVG_EXT_RE = /\.svg(?:$|[?#])/i;
const SMALL_IMAGE_THRESHOLD = 500;
const LARGE_IMAGE_THRESHOLD = 800;
const HERO_HEIGHT_THRESHOLD = 400;

const PAGE_KEYWORDS: Array<{ keyword: string; weight: number }> = [
  { keyword: 'about-us', weight: 8 },
  { keyword: 'about', weight: 8 },
  { keyword: 'company', weight: 7 },
  { keyword: 'team', weight: 6 },
  { keyword: 'career', weight: 8 },
  { keyword: 'careers', weight: 8 },
  { keyword: 'jobs', weight: 7 },
  { keyword: 'job', weight: 6 },
  { keyword: 'culture', weight: 6 },
  { keyword: 'success', weight: 7 },
  { keyword: 'story', weight: 6 },
  { keyword: 'stories', weight: 6 },
  { keyword: 'work', weight: 5 },
  { keyword: 'office', weight: 5 },
  { keyword: 'people', weight: 5 },
  { keyword: 'unternehmen', weight: 7 },
  { keyword: 'ueber-uns', weight: 8 },
  { keyword: 'ueber', weight: 7 },
  { keyword: 'karriere', weight: 8 }
];

const TAG_KEYWORDS: Array<{ keyword: string; tag: string; weight: number }> = [
  { keyword: 'logo', tag: 'logo', weight: 12 },
  { keyword: 'brand', tag: 'logo', weight: 6 },
  { keyword: 'hero', tag: 'hero', weight: 10 },
  { keyword: 'banner', tag: 'hero', weight: 9 },
  { keyword: 'cover', tag: 'hero', weight: 8 },
  { keyword: 'header', tag: 'hero', weight: 7 },
  { keyword: 'unternehmen', tag: 'about', weight: 7 },
  { keyword: 'ueber', tag: 'about', weight: 6 },
  { keyword: 'about', tag: 'about', weight: 7 },
  { keyword: 'company', tag: 'about', weight: 6 },
  { keyword: 'karriere', tag: 'career', weight: 8 },
  { keyword: 'story', tag: 'success', weight: 6 },
  { keyword: 'success', tag: 'success', weight: 8 },
  { keyword: 'career', tag: 'career', weight: 8 },
  { keyword: 'careers', tag: 'career', weight: 8 },
  { keyword: 'job', tag: 'career', weight: 7 },
  { keyword: 'jobs', tag: 'career', weight: 7 },
  { keyword: 'mitarbeiter', tag: 'team', weight: 6 },
  { keyword: 'team', tag: 'team', weight: 6 },
  { keyword: 'people', tag: 'team', weight: 5 },
  { keyword: 'office', tag: 'office', weight: 5 },
  { keyword: 'culture', tag: 'culture', weight: 6 },
  { keyword: 'org_gallery', tag: 'culture', weight: 7 },
  { keyword: 'gallery', tag: 'culture', weight: 5 },
  { keyword: 'slider', tag: 'culture', weight: 4 },
  { keyword: 'wide', tag: 'culture', weight: 3 },
  { keyword: 'photo', tag: 'culture', weight: 4 },
  { keyword: 'image', tag: 'culture', weight: 3 },
  { keyword: 'bilder', tag: 'culture', weight: 4 },
  { keyword: 'event', tag: 'culture', weight: 5 }
];

const NEGATIVE_KEYWORDS: Array<{ keyword: string; weight: number }> = [
  { keyword: 'icon', weight: -10 },
  { keyword: 'sprite', weight: -12 },
  { keyword: 'favicon', weight: -15 },
  { keyword: 'avatar', weight: -6 },
  { keyword: 'placeholder', weight: -8 },
  { keyword: 'spinner', weight: -10 },
  { keyword: 'loading', weight: -8 },
  { keyword: 'badge', weight: -4 },
  { keyword: 'empty', weight: -8 },
  { keyword: 'no-results', weight: -8 },
  { keyword: 'search', weight: -4 },
  { keyword: 'thumb', weight: -4 }
];

const REQUIRED_TAGS = ['logo', 'hero', 'about', 'career', 'success'];

const COMMON_PATHS = [
  '/about',
  '/about-us',
  '/company',
  '/team',
  '/people',
  '/culture',
  '/careers',
  '/career',
  '/jobs',
  '/job',
  '/success',
  '/success-stories',
  '/stories',
  '/work',
  '/office',
  '/unternehmen',
  '/ueber-uns',
  '/ueber',
  '/karriere'
];

// --- Types ---
export interface Candidate {
  key: string;
  url: string;
  score: number;
  tags: Set<string>;
}

export interface SocialLink {
  name: string;
  url: string;
}

export interface Color {
    hex: string;
    type: string;
    brightness: number;
}

export interface Font {
    name: string;
    type: string;
}

export interface ScrapeResult {
    images: string[];
    logos: string[];
    text: string;
    title: string;
    description: string;
    links: SocialLink[];
    benefits: string[];
    hrContact: string | null;
    colors: Color[];
    fonts: Font[];
    error?: string;
    meta?: {
        pagesScraped: number;
        duration: number;
    };
}

// --- Helper Functions ---

const fetchText = async (url: string): Promise<string | null> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await safeFetch(url, {
      headers: { 'user-agent': USER_AGENT },
      signal: controller.signal
    });
    if (!response.ok) return null;
    return await response.text();
  } catch (error) {
    // Only log if it's not an abort error
    if ((error as Error).name !== 'AbortError') {
        console.error(`Fetch error for ${url}:`, error);
    }
    return null;
  } finally {
    clearTimeout(timeout);
  }
};

const getUrlKey = (absoluteUrl: string) => {
  try {
    const parsed = new URL(absoluteUrl);
    return `${parsed.origin}${parsed.pathname}`;
  } catch {
    return absoluteUrl;
  }
};

const scoreFromText = (text: string, tags: Set<string>) => {
  const lower = text.toLowerCase();
  let score = 0;
  for (const entry of TAG_KEYWORDS) {
    if (lower.includes(entry.keyword)) {
      score += entry.weight;
      tags.add(entry.tag);
    }
  }
  for (const entry of NEGATIVE_KEYWORDS) {
    if (lower.includes(entry.keyword)) {
      score += entry.weight;
    }
  }
  return score;
};

const applySizeScore = (score: number, tags: Set<string>, width?: number, height?: number) => {
  const maxDim = Math.max(width || 0, height || 0);
  if (maxDim >= LARGE_IMAGE_THRESHOLD) score += 6;
  if (maxDim > 0 && maxDim < SMALL_IMAGE_THRESHOLD && !tags.has('logo')) score -= 100;
  if ((width || 0) >= LARGE_IMAGE_THRESHOLD && (height || 0) >= HERO_HEIGHT_THRESHOLD) {
    tags.add('hero');
    score += 4;
  }
  return score;
};

const applySizeFromUrl = (score: number, tags: Set<string>, url: string) => {
  const match = url.match(/(\d{3,4})x(\d{3,4})/);
  if (!match) return score;
  const width = Number(match[1]);
  const height = Number(match[2]);
  return applySizeScore(score, tags, width, height);
};

const addCandidate = (
  map: Map<string, Candidate>,
  candidateUrl: string,
  baseUrl: string,
  options: { source: 'meta' | 'img' | 'srcset' | 'json' | 'bg'; alt?: string; className?: string; width?: number; height?: number }
) => {
  if (!candidateUrl || candidateUrl.startsWith('data:')) return;
  let absoluteUrl: string;
  try {
    absoluteUrl = new URL(candidateUrl, baseUrl).toString();
  } catch {
    return;
  }
  if (!/^https?:\/\//i.test(absoluteUrl)) return;

  const tags = new Set<string>();
  let score = scoreFromText(`${absoluteUrl} ${options.alt || ''} ${options.className || ''}`, tags);
  score = applySizeScore(score, tags, options.width, options.height);
  score = applySizeFromUrl(score, tags, absoluteUrl);

  if (options.source === 'meta') {
    score += 10;
    tags.add('hero');
  }

  // Background images are often decor/hero
  if (options.source === 'bg') {
    score += 2;
    // Assume background images might be hero if they don't look like icons
    if (!absoluteUrl.includes('icon') && !absoluteUrl.includes('logo')) {
        // give it a chance to be a hero
    }
  }

  const isSvg = SVG_EXT_RE.test(absoluteUrl);
  const isImageExt = IMAGE_EXT_RE.test(absoluteUrl);
  const allowSvg = isSvg && tags.has('logo');
  if (isSvg && !allowSvg) return;
  if (!isImageExt && options.source !== 'meta' && !allowSvg) return;

  if (tags.has('logo')) score += 2;
  const key = getUrlKey(absoluteUrl);
  const existing = map.get(key);
  if (existing) {
    for (const tag of tags) existing.tags.add(tag);
    if (score > existing.score) {
      existing.score = score;
      existing.url = absoluteUrl;
    }
    return;
  }
  map.set(key, { key, url: absoluteUrl, score, tags });
};

const pickSrcsetUrl = (srcset: string) => {
  const entries = srcset.split(',').map(entry => entry.trim()).filter(Boolean);
  let bestUrl = '';
  let bestWidth = 0;
  for (const entry of entries) {
    const parts = entry.split(/\s+/);
    const url = parts[0];
    const descriptor = parts[1] || '';
    const widthMatch = descriptor.match(/(\d+)w/);
    const width = widthMatch ? Number(widthMatch[1]) : 0;
    if (width >= bestWidth) {
      bestWidth = width;
      bestUrl = url;
    }
  }
  return bestUrl || entries[0]?.split(/\s+/)[0] || '';
};

const extractImageCandidates = ($: cheerio.CheerioAPI, baseUrl: string, map: Map<string, Candidate>) => {
  // Meta tags
  $('meta').each((_, el) => {
    const property = ($(el).attr('property') || $(el).attr('name') || '').toLowerCase();
    if (['og:image', 'og:image:secure_url', 'twitter:image', 'twitter:image:src'].includes(property)) {
      const content = $(el).attr('content');
      if (content) addCandidate(map, content, baseUrl, { source: 'meta' });
    }
  });

  // Img tags
  $('img').each((_, el) => {
    const src = $(el).attr('data-src') || $(el).attr('data-lazy-src') || $(el).attr('src');
    const srcset = $(el).attr('data-srcset') || $(el).attr('srcset');
    const alt = $(el).attr('alt') || '';
    const className = $(el).attr('class') || '';
    const width = Number($(el).attr('width')) || undefined;
    const height = Number($(el).attr('height')) || undefined;

    if (src) addCandidate(map, src, baseUrl, { source: 'img', alt, className, width, height });
    if (srcset) {
      const bestSrcset = pickSrcsetUrl(srcset);
      if (bestSrcset) {
        addCandidate(map, bestSrcset, baseUrl, { source: 'srcset', alt, className, width, height });
      }
    }
  });

  // Background images in inline styles
  $('[style*="background-image"]').each((_, el) => {
    const style = $(el).attr('style');
    const match = style?.match(/background-image:\s*url\(['"]?([^'"]+)['"]?\)/i);
    if (match && match[1]) {
      addCandidate(map, match[1], baseUrl, { source: 'bg' });
    }
  });
};

const extractJsonImages = (html: string, baseUrl: string, map: Map<string, Candidate>) => {
  const scripts: string[] = [];
  const nextDataMatch = html.match(/<script[^>]+id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i);
  if (nextDataMatch?.[1]) {
    scripts.push(nextDataMatch[1]);
  }

  const ldJsonMatches = html.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
  if (ldJsonMatches) {
    ldJsonMatches.forEach(match => {
      const contentMatch = match.match(/<script[^>]+>([\s\S]*?)<\/script>/i);
      if (contentMatch?.[1]) scripts.push(contentMatch[1]);
    });
  }

  if (scripts.length === 0) return;

  const walk = (value: unknown, path: string) => {
    if (map.size >= MAX_CANDIDATES) return;
    if (value === null || value === undefined) return;
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) return;
      if (!trimmed.startsWith('http') && !trimmed.startsWith('/')) return;
      addCandidate(map, trimmed, baseUrl, { source: 'json', alt: path });
      return;
    }
    if (Array.isArray(value)) {
      value.forEach((item, index) => walk(item, `${path}[${index}]`));
      return;
    }
    if (typeof value === 'object') {
      Object.entries(value as Record<string, unknown>).forEach(([key, val]) => {
        walk(val, `${path}.${key}`);
      });
    }
  };

  scripts.forEach((script, index) => {
    try {
      const parsed = JSON.parse(script);
      walk(parsed, index === 0 ? 'next_data' : `ld_json_${index}`);
    } catch {
      return;
    }
  });
};

const extractSitemapUrls = (xml: string, origin: string) => {
  const urls: string[] = [];
  const locRegex = /<loc>([^<]+)<\/loc>/gi;
  let match: RegExpExecArray | null;
  while ((match = locRegex.exec(xml))) {
    const loc = match[1].trim();
    if (!loc.startsWith(origin)) continue;
    if (loc.endsWith('.xml')) continue;
    urls.push(loc);
  }
  return urls;
};

const scorePageUrl = (url: string) => {
  let score = 0;
  try {
    const path = new URL(url).pathname.toLowerCase();
    for (const entry of PAGE_KEYWORDS) {
      if (path.includes(entry.keyword)) score += entry.weight;
    }
    if (path === '/' || path.length <= 1) score += 5;
  } catch {
    score = 0;
  }
  return score;
};

const getPageUrls = async (startUrl: string, additionalUrl?: string | null) => {
  const origin = new URL(startUrl).origin;
  const pages = new Set<string>();
  pages.add(startUrl);

  if (additionalUrl) {
    try {
        const normAdditional = normalizeUrl(additionalUrl);
        if (normAdditional) pages.add(normAdditional);
    } catch {}
  }

  for (const path of COMMON_PATHS) {
    try {
      pages.add(new URL(path, origin).toString());
    } catch {
      continue;
    }
  }

  const sitemapUrl = new URL('/sitemap.xml', origin).toString();
  const sitemapXml = await fetchText(sitemapUrl);
  if (sitemapXml) {
    for (const loc of extractSitemapUrls(sitemapXml, origin)) {
      pages.add(loc);
    }
  }

  const scored = Array.from(pages).map(url => ({ url, score: scorePageUrl(url) }));
  scored.sort((a, b) => b.score - a.score || a.url.length - b.url.length);

  const selected = scored.slice(0, MAX_PAGES).map(entry => entry.url);
  if (!selected.includes(startUrl)) selected.unshift(startUrl);
  if (additionalUrl) {
      const norm = normalizeUrl(additionalUrl);
      if (norm && !selected.includes(norm)) selected.splice(1, 0, norm);
  }

  return Array.from(new Set(selected));
};

const selectImages = (candidates: Candidate[]) => {
  const sorted = [...candidates].sort((a, b) => b.score - a.score);
  const selectedImages: Candidate[] = [];
  const selectedLogos: string[] = [];
  const selectedKeys = new Set<string>();

  // 1. Pick Logos
  for (const cand of sorted) {
    if (cand.tags.has('logo')) {
      if (selectedLogos.length < MAX_LOGOS && !selectedKeys.has(cand.key)) {
        selectedLogos.push(cand.url);
        selectedKeys.add(cand.key);
      }
    }
  }

  // 2. Pick Images (Heroes and others)
  const tagOrder = ['hero', 'about', 'career', 'success', 'team', 'office', 'culture'];

  const addImage = (cand: Candidate) => {
    if (selectedImages.length < MAX_IMAGES && !selectedKeys.has(cand.key)) {
      selectedImages.push(cand);
      selectedKeys.add(cand.key);
    }
  };

  // Heroes first (non-logos)
  const heroes = sorted.filter(c => c.tags.has('hero') && !c.tags.has('logo'));
  for (const hero of heroes) {
    addImage(hero);
    if (selectedImages.length >= 3) break; // Limit initial heroes
  }

  // Then by tags
  for (const tag of tagOrder) {
    if (selectedImages.length >= MAX_IMAGES) break;
    const candidatesForTag = sorted.filter(c => c.tags.has(tag) && !c.tags.has('logo'));
    // Pick best one for this tag
    for (const cand of candidatesForTag) {
      addImage(cand);
      break;
    }
  }

  // Fill the rest with best remaining non-logos
  for (const cand of sorted) {
    if (selectedImages.length >= MAX_IMAGES) break;
    if (!cand.tags.has('logo')) {
      addImage(cand);
    }
  }

  return {
    images: selectedImages.map(c => c.url),
    logos: selectedLogos
  };
};

const extractCleanText = (html: string) => {
    const $ = cheerio.load(html);
    $('script, style, svg, head, noscript, iframe').remove();
    return $('body').text().replace(/\s+/g, ' ').trim();
};

const extractSocialLinks = ($: cheerio.CheerioAPI, links: Map<string, SocialLink>) => {
    $('a[href]').each((_, el) => {
        const url = $(el).attr('href');
        if (!url) return;

        let name = 'Social';
        const lower = url.toLowerCase();
        if (lower.includes('facebook')) name = 'Facebook';
        else if (lower.includes('linkedin')) name = 'LinkedIn';
        else if (lower.includes('instagram')) name = 'Instagram';
        else if (lower.includes('twitter') || lower.includes('x.com')) name = 'Twitter';
        else if (lower.includes('xing')) name = 'Xing';
        else if (lower.includes('kununu')) name = 'Kununu';
        else if (lower.includes('youtube')) name = 'YouTube';
        else if (lower.includes('tiktok')) name = 'TikTok';
        else return; // Skip non-social links

        // Use normalized URL as key to dedupe
        try {
            const norm = new URL(url).origin + new URL(url).pathname;
            if (!links.has(norm)) {
                links.set(norm, { name, url });
            }
        } catch {
            // ignore
        }
    });
};

const extractBenefits = (text: string) => {
  const lowerText = text.toLowerCase();
  const found = new Set<string>();
  for (const benefit of BENEFITS_LIST) {
    if (lowerText.includes(benefit.toLowerCase())) {
      found.add(benefit);
    }
  }
  return Array.from(found);
};

const extractHrContact = (text: string) => {
  const keywords = ['ansprechpartner', 'kontakt', 'contact', 'recruiter', 'talent acquisition', 'hr manager', 'human resources'];
  const lower = text.toLowerCase();

  for (const keyword of keywords) {
    const idx = lower.indexOf(keyword);
    if (idx !== -1) {
      // Extract a snippet around the keyword
      const snippet = text.substring(Math.max(0, idx - 50), Math.min(text.length, idx + 200)).replace(/\s+/g, ' ').trim();
      // Check if it looks like a name or email
      if (snippet.includes('@') || snippet.match(/[A-Z][a-z]+ [A-Z][a-z]+/)) {
         return snippet;
      }
    }
  }
  return null;
};

const cleanTitle = (title: string, maxLen = 60) => {
  if (!title) return '';
  const separators = [' | ', ' - ', ' : ', ' • ', ' – '];
  let bestPart = title;

  for (const sep of separators) {
    if (title.includes(sep)) {
      const parts = title.split(sep);
      const first = parts[0].trim();
      const last = parts[parts.length - 1].trim();

      if (['home', 'welcome', 'startseite', 'index'].includes(first.toLowerCase())) {
        bestPart = last;
      } else {
        bestPart = first;
      }
      break;
    }
  }

  if (bestPart.length > maxLen) {
    return bestPart.substring(0, maxLen).trim() + '...';
  }
  return bestPart.trim();
};

const extractMetaDescription = ($: cheerio.CheerioAPI) => {
    let desc = $('meta[property="og:description"]').attr('content') ||
               $('meta[name="description"]').attr('content') ||
               $('meta[name="twitter:description"]').attr('content') || '';

    return desc.trim();
};

const getBrightness = (hex: string) => {
  const r = parseInt(hex.substring(1, 3), 16);
  const g = parseInt(hex.substring(3, 5), 16);
  const b = parseInt(hex.substring(5, 7), 16);
  return Math.round(((r * 299) + (g * 587) + (b * 114)) / 1000);
};

const extractColors = (html: string, colors: Map<string, number>) => {
  const hexRegex = /#([0-9A-Fa-f]{6})\b/g;
  const matches = html.match(hexRegex);

  if (matches) {
    matches.forEach(hex => {
      const normalized = hex.toUpperCase();
      // Filter out black, white, and very common grays roughly
      if (['#FFFFFF', '#000000', '#F0F0F0', '#E5E5E5'].includes(normalized)) return;
      colors.set(normalized, (colors.get(normalized) || 0) + 1);
    });
  }
};

const extractFonts = (html: string, fonts: Set<string>) => {
    const fontRegex = /font-family:\s*([^;"]+)/gi;
    let match;
    while ((match = fontRegex.exec(html)) !== null) {
        const family = match[1].split(',')[0].trim().replace(/['"]/g, '');
        if (family && !['inherit', 'initial', 'sans-serif', 'serif', 'monospace'].includes(family.toLowerCase())) {
            fonts.add(family);
        }
    }
};

// --- Main Parallel Scraper ---

export async function scrapeParallel(normalizedUrl: string, additionalUrl?: string | null): Promise<ScrapeResult> {
  const startTime = Date.now();
  const pageUrls = await getPageUrls(normalizedUrl, additionalUrl);

  const candidates = new Map<string, Candidate>();
  const socialLinks = new Map<string, SocialLink>();
  const colorCounts = new Map<string, number>();
  const foundFonts = new Set<string>();

  let bestText = "";
  let bestTitle = "";
  let bestDescription = "";
  let bestTextScore = -1;
  const allBenefits = new Set<string>();
  let bestHrContact: string | null = null;
  let pagesScraped = 0;

  // Use p-limit to control concurrency
  const limit = pLimit(5);

  const scrapePage = async (pageUrl: string, isPrimary: boolean) => {
      const html = await fetchText(pageUrl);
      if (!html) return;
      pagesScraped++;

      const $ = cheerio.load(html);

      // --- Enhanced Title Extraction ---
      const ogSiteName = $('meta[property="og:site_name"]').attr('content');
      const appName = $('meta[name="application-name"]').attr('content');
      const ogTitle = $('meta[property="og:title"]').attr('content');
      const docTitle = $('title').text().trim();
      const metaDesc = extractMetaDescription($);

      // Mutate shared state
      // Prioritize Primary URL for Title/Description
      if (isPrimary) {
        if (ogSiteName) bestTitle = cleanTitle(ogSiteName);
        else if (appName) bestTitle = cleanTitle(appName);
        else {
            const rawTitle = ogTitle || docTitle;
            bestTitle = cleanTitle(rawTitle);
        }

        if (metaDesc) bestDescription = metaDesc;
      } else {
        // Only update if currently empty or if we found a strong signal (og:site_name) and currently have weak one
        if (!bestTitle && (ogSiteName || appName)) {
            bestTitle = cleanTitle(ogSiteName || appName || '');
        }
        if (!bestTitle) {
            const rawTitle = ogTitle || docTitle;
            bestTitle = cleanTitle(rawTitle);
        }

        if (!bestDescription && metaDesc) {
            bestDescription = metaDesc;
        }
      }

      extractImageCandidates($, pageUrl, candidates);
      extractJsonImages(html, pageUrl, candidates);
      extractSocialLinks($, socialLinks);

      const cleanText = extractCleanText(html);
      const benefits = extractBenefits(cleanText);
      benefits.forEach(b => allBenefits.add(b));

      if (!bestHrContact) {
        const contact = extractHrContact(cleanText);
        if (contact) bestHrContact = contact;
      }

      extractColors(html, colorCounts);
      extractFonts(html, foundFonts);

      const pageScore = scorePageUrl(pageUrl);

      // Text selection: prioritize additionalUrl if content is long enough
      if (additionalUrl && pageUrl.includes(new URL(additionalUrl).pathname)) {
          if (cleanText.length > 500) {
              bestText = cleanText;
              bestTextScore = 9999;
          }
      } else if (pageScore > bestTextScore) {
          bestText = cleanText;
          bestTextScore = pageScore;
      }
  };

  // 1. Scrape Primary URL first (to set baseline title/desc)
  await scrapePage(normalizedUrl, true);

  // 2. Scrape others in parallel
  const otherUrls = pageUrls.filter(u => u !== normalizedUrl);
  await Promise.all(otherUrls.map(url => limit(() => scrapePage(url, false))));

  if (bestText.length > 50000) bestText = bestText.substring(0, 50000);

  const sortedColors = Array.from(colorCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([hex]) => ({
          hex,
          type: 'accent',
          brightness: getBrightness(hex)
      }));

  const sortedFonts = Array.from(foundFonts).slice(0, 3).map(name => ({
      name,
      type: 'primary'
  }));

  const selected = selectImages(Array.from(candidates.values()));

  return {
      images: selected.images,
      logos: selected.logos,
      text: bestText,
      title: bestTitle,
      description: bestDescription,
      links: Array.from(socialLinks.values()),
      benefits: Array.from(allBenefits),
      hrContact: bestHrContact,
      colors: sortedColors,
      fonts: sortedFonts,
      meta: {
          pagesScraped,
          duration: Date.now() - startTime
      }
  };
}
