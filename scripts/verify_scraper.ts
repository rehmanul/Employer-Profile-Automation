import { scrapeParallel } from '../app/lib/scraper/core';

async function main() {
  console.log('Testing scraper with http://github.com (redirect test)...');
  try {
    const result = await scrapeParallel('http://github.com');
    console.log('Scrape Result:', JSON.stringify(result, null, 2));

    if (result.title.toLowerCase().includes('github')) {
        console.log('✅ Title match');
    } else {
        console.log('❌ Title mismatch');
    }

    if (result.meta?.pagesScraped) {
        console.log(`✅ Scraped ${result.meta.pagesScraped} pages`);
    }

  } catch (error) {
    console.error('Failed:', error);
  }
}

main();
