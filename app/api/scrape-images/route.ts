import { NextRequest, NextResponse } from 'next/server';
import { EntityInputSchema, normalizeUrl } from '../../lib/entity/resolution';
import { scrapeParallel } from '../../lib/scraper/core';

export async function POST(req: NextRequest) {
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // Validate input
  const parseResult = EntityInputSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json({
      error: 'Invalid input',
      details: parseResult.error.format()
    }, { status: 400 });
  }

  const { url, additionalUrl } = parseResult.data;

  // Normalize URL
  const normalizedUrl = normalizeUrl(url);
  if (!normalizedUrl) {
    return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
  }

  const normalizedAdditional = additionalUrl ? normalizeUrl(additionalUrl) : null;

  try {
    // Run parallel scraper
    const result = await scrapeParallel(normalizedUrl, normalizedAdditional);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Scraping error:', error);
    return NextResponse.json({
      images: [],
      logos: [],
      text: "",
      title: "",
      description: "",
      links: [],
      benefits: [],
      hrContact: null,
      colors: [],
      fonts: [],
      error: error.message || "Failed to scrape site"
    }, { status: 500 });
  }
}
