import { safeFetch } from '../app/lib/scraper/safeFetch';

async function test() {
  console.log('Testing safeFetch blocking...');
  try {
    await safeFetch('http://127.0.0.1');
    console.log('❌ Failed to block 127.0.0.1');
  } catch (e) {
    console.log('✅ Blocked 127.0.0.1:', (e as Error).message);
  }

  try {
    await safeFetch('http://localhost');
    console.log('❌ Failed to block localhost');
  } catch (e) {
    console.log('✅ Blocked localhost:', (e as Error).message);
  }
}

test();
