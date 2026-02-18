import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import { BENEFITS_LIST } from '../../lib/benefits';

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

type Candidate = {
  key: string;
  url: string;
  score: number;
  tags: Set<string>;
};

type SocialLink = {
  name: string;
  url: string;
};

const normalizeUrl = (rawUrl: string) => {
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;
  try {
    const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    return new URL(withScheme).toString().replace(/\/$/, '');
  } catch {
    return null;
  }
};

const fetchText = async (url: string) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      headers: { 'user-agent': USER_AGENT },
      signal: controller.signal
    });
    if (!response.ok) return null;
    return await response.text();
  } catch {
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

const extractImageCandidates = (html: string, baseUrl: string, map: Map<string, Candidate>) => {
  const $ = cheerio.load(html);

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
      if (norm && !selected.includes(norm)) selected.splice(1, 0, norm); // Insert additional URL right after start URL
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

const extractSocialLinks = (html: string, links: Map<string, SocialLink>) => {
    const $ = cheerio.load(html);
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

export async function POST(req: NextRequest) {
  let payload: { url?: string; additionalUrl?: string } | null = null;
  try {
    payload = await req.json();
  } catch {
    payload = null;
  }

  const normalizedUrl = payload?.url ? normalizeUrl(payload.url) : null;
  const additionalUrl = payload?.additionalUrl ? normalizeUrl(payload.additionalUrl) : null;

  if (!normalizedUrl) {
    return NextResponse.json({ images: [], text: "", links: [], benefits: [], hrContact: null }, { status: 400 });
  }

  try {
    const pageUrls = await getPageUrls(normalizedUrl, additionalUrl);
    const candidates = new Map<string, Candidate>();
    const socialLinks = new Map<string, SocialLink>();
    let bestText = "";
    let bestTextScore = -1;
    const allBenefits = new Set<string>();
    let bestHrContact: string | null = null;

    for (const pageUrl of pageUrls) {
      const html = await fetchText(pageUrl);
      if (!html) continue;

      // Images
      extractImageCandidates(html, pageUrl, candidates);
      extractJsonImages(html, pageUrl, candidates);

      // Socials
      extractSocialLinks(html, socialLinks);

      // Text Extraction
      const cleanText = extractCleanText(html);

      // Benefits & HR
      const benefits = extractBenefits(cleanText);
      benefits.forEach(b => allBenefits.add(b));

      if (!bestHrContact) {
        const contact = extractHrContact(cleanText);
        if (contact) bestHrContact = contact;
      }

      // Best Text scoring (prioritize "Career" pages)
      const pageScore = scorePageUrl(pageUrl);
      if (pageScore > bestTextScore) {
          bestText = cleanText;
          bestTextScore = pageScore;
      }

      // If we are scraping the additional URL, we should definitely consider its text as well
      // Maybe append it if it's not the best?
      // Actually, if additional URL is provided, it's likely very relevant.
      // If the additional URL is processed, let's treat it as high value.
      if (additionalUrl && pageUrl.includes(new URL(additionalUrl).pathname)) {
          // If the additional URL text is long enough, it might be better than homepage
          if (cleanText.length > 500) {
             // If we already have a best text, maybe append this one?
             // Or just let the score decide (additional URL usually has good keywords)
          }
      }

      const values = Array.from(candidates.values());
      const hasRequired = REQUIRED_TAGS.every(tag => values.some(item => item.tags.has(tag)));
      if (candidates.size >= MAX_CANDIDATES && hasRequired && socialLinks.size > 0 && allBenefits.size > 0) break;
    }

    // Limit text size to avoid payload issues
    if (bestText.length > 50000) bestText = bestText.substring(0, 50000);

    const selected = selectImages(Array.from(candidates.values()));
    return NextResponse.json({
        images: selected.images,
        logos: selected.logos,
        text: bestText,
        links: Array.from(socialLinks.values()),
        benefits: Array.from(allBenefits),
        hrContact: bestHrContact
    });
  } catch (error) {
    console.error('Scraping error:', error);
    return NextResponse.json({
        images: [],
        logos: [],
        text: "",
        links: [],
        benefits: [],
        hrContact: null,
        error: "Failed to scrape site"
    }, { status: 500 });
  }
}
