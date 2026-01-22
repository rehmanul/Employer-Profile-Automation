import { NextRequest, NextResponse } from 'next/server';

const MAX_IMAGES = 10;
const MAX_PAGES = 15; // Reduced from 80 to avoid timeouts if we process text
const MAX_CANDIDATES = 240;
const MAX_LOGOS = 2;
const MAX_HERO = 3;
const FETCH_TIMEOUT_MS = 10000;
const USER_AGENT = 'Mozilla/5.0 (compatible; EmployerProfileAutomation/1.0)';
const IMAGE_EXT_RE = /\.(jpg|jpeg|png|webp|avif|gif)(?:$|[?#])/i;
const SVG_EXT_RE = /\.svg(?:$|[?#])/i;
const SMALL_IMAGE_THRESHOLD = 120;
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
const OPTIONAL_TAGS = ['team', 'office', 'culture'];

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

const getAttribute = (tag: string, name: string) => {
  const regex = new RegExp(`${name}\\s*=\\s*["']([^"']+)["']`, 'i');
  const match = tag.match(regex);
  return match ? match[1] : '';
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
  if (maxDim > 0 && maxDim <= SMALL_IMAGE_THRESHOLD) score -= 6;
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
  const metaTagRegex = /<meta[^>]+>/gi;
  const imgTagRegex = /<img[^>]*>/gi;
  const styleBgRegex = /background-image:\s*url\(['"]?([^'"]+)['"]?\)/gi;

  let match: RegExpExecArray | null;
  while ((match = metaTagRegex.exec(html))) {
    const tag = match[0];
    const property = (getAttribute(tag, 'property') || getAttribute(tag, 'name')).toLowerCase();
    if (!['og:image', 'og:image:secure_url', 'twitter:image', 'twitter:image:src'].includes(property)) continue;
    const content = getAttribute(tag, 'content');
    if (!content) continue;
    addCandidate(map, content, baseUrl, { source: 'meta' });
  }

  while ((match = imgTagRegex.exec(html))) {
    const tag = match[0];
    const src = getAttribute(tag, 'data-src') || getAttribute(tag, 'data-lazy-src') || getAttribute(tag, 'src');
    const srcset = getAttribute(tag, 'data-srcset') || getAttribute(tag, 'srcset');
    const alt = getAttribute(tag, 'alt');
    const className = getAttribute(tag, 'class');
    const width = Number(getAttribute(tag, 'width')) || undefined;
    const height = Number(getAttribute(tag, 'height')) || undefined;

    if (src) addCandidate(map, src, baseUrl, { source: 'img', alt, className, width, height });
    if (srcset) {
      const bestSrcset = pickSrcsetUrl(srcset);
      if (bestSrcset) {
        addCandidate(map, bestSrcset, baseUrl, { source: 'srcset', alt, className, width, height });
      }
    }
  }

  // Extract background images from inline styles
  while ((match = styleBgRegex.exec(html))) {
    const src = match[1];
    if (src) {
        addCandidate(map, src, baseUrl, { source: 'bg' });
    }
  }

  // Also naive search for style tags (optional, might be heavy)
  // ... skipping style tags for now to keep it simple, inline styles on divs are more common for hero sections
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

const getPageUrls = async (startUrl: string) => {
  const origin = new URL(startUrl).origin;
  const pages = new Set<string>();
  pages.add(startUrl);

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

// --- New Features: Text & Socials ---

const extractCleanText = (html: string) => {
  let text = html;
  // Remove scripts and styles
  text = text.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gim, " ");
  text = text.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gim, " ");
  text = text.replace(/<svg\b[^>]*>[\s\S]*?<\/svg>/gim, " ");
  text = text.replace(/<head\b[^>]*>[\s\S]*?<\/head>/gim, " ");
  // Replace block tags with newlines
  text = text.replace(/<\/(div|p|h[1-6]|li|br|ul|ol|table|tr|td|section|article|header|footer)>/gi, "\n");
  // Remove all other tags
  text = text.replace(/<[^>]+>/g, " ");
  // Decode entities (basic ones)
  text = text.replace(/&nbsp;/g, " ")
             .replace(/&amp;/g, "&")
             .replace(/&lt;/g, "<")
             .replace(/&gt;/g, ">")
             .replace(/&quot;/g, "\"");
  // Collapse whitespace
  text = text.replace(/\s+/g, " ").trim();
  return text;
};

const extractSocialLinks = (html: string, links: Map<string, SocialLink>) => {
    const linkRegex = /href=["'](https?:\/\/(?:www\.)?(?:facebook|linkedin|instagram|twitter|x|xing|kununu|youtube|tiktok)\.[a-z.]+[^"']*)["']/gi;
    let match: RegExpExecArray | null;
    while ((match = linkRegex.exec(html))) {
        const url = match[1];
        let name = 'Social';
        if (url.includes('facebook')) name = 'Facebook';
        else if (url.includes('linkedin')) name = 'LinkedIn';
        else if (url.includes('instagram')) name = 'Instagram';
        else if (url.includes('twitter') || url.includes('x.com')) name = 'Twitter';
        else if (url.includes('xing')) name = 'Xing';
        else if (url.includes('kununu')) name = 'Kununu';
        else if (url.includes('youtube')) name = 'YouTube';
        else if (url.includes('tiktok')) name = 'TikTok';

        // Use normalized URL as key to dedupe
        try {
            const norm = new URL(url).origin + new URL(url).pathname; // Ignore query params for deduping
            if (!links.has(norm)) {
                links.set(norm, { name, url });
            }
        } catch {
            // ignore
        }
    }
};

export async function POST(req: NextRequest) {
  let payload: { url?: string } | null = null;
  try {
    payload = await req.json();
  } catch {
    payload = null;
  }

  const normalizedUrl = payload?.url ? normalizeUrl(payload.url) : null;
  if (!normalizedUrl) {
    return NextResponse.json({ images: [], text: "", links: [] }, { status: 400 });
  }

  const pageUrls = await getPageUrls(normalizedUrl);
  const candidates = new Map<string, Candidate>();
  const socialLinks = new Map<string, SocialLink>();
  let bestText = "";
  let bestTextScore = -1;

  for (const pageUrl of pageUrls) {
    const html = await fetchText(pageUrl);
    if (!html) continue;

    // Images
    extractImageCandidates(html, pageUrl, candidates);
    extractJsonImages(html, pageUrl, candidates);

    // Socials
    extractSocialLinks(html, socialLinks);

    // Text (prioritize "Career" pages)
    const pageScore = scorePageUrl(pageUrl);
    // If this page is a career page, it likely has good benefits info.
    // Or if it's the home page.
    // We update bestText if this page seems more relevant than previous ones.
    if (pageScore > bestTextScore) {
        bestText = extractCleanText(html);
        bestTextScore = pageScore;
    }

    const values = Array.from(candidates.values());
    const hasRequired = REQUIRED_TAGS.every(tag => values.some(item => item.tags.has(tag)));
    // Stop early if we have enough images AND we have visited at least the main career/about pages
    // (We sorted pageUrls by relevance, so the first few are likely the best)
    if (candidates.size >= MAX_CANDIDATES && hasRequired && socialLinks.size > 0) break;
  }

  // Limit text size to avoid payload issues
  if (bestText.length > 50000) bestText = bestText.substring(0, 50000);

  const selected = selectImages(Array.from(candidates.values()));
  return NextResponse.json({
      images: selected.images,
      logos: selected.logos,
      text: bestText,
      links: Array.from(socialLinks.values())
  });
}
