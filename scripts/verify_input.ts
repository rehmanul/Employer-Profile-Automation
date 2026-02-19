import { POST } from '../app/api/scrape-images/route';
import { NextRequest } from 'next/server';

async function test() {
  console.log('Testing input validation...');
  try {
    const req = new NextRequest('http://localhost/api/scrape-images', {
      method: 'POST',
      body: JSON.stringify({ url: 'stripe.com' })
    });

    // Mock scraping to fail quickly if it tries to scrape real stripe.com
    // But we just want to see if it passes validation (status != 400 for input error)
    // Actually, scraping stripe.com might succeed or fail with 500, but not 400 "Invalid input".

    const res = await POST(req);
    const data = await res.json();

    if (res.status === 400 && data.error === 'Invalid input') {
        console.log('❌ stripe.com rejected by Zod validation');
    } else if (res.status === 400 && data.error === 'Invalid URL format') {
        console.log('❌ stripe.com rejected by normalizeUrl');
    } else {
        console.log(`✅ stripe.com accepted (Status: ${res.status})`);
    }

  } catch (error) {
    console.error('Test error:', error);
  }
}

test();
