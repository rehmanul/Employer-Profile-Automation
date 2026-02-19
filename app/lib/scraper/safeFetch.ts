import dns from 'node:dns/promises';
import net from 'node:net';

function isPrivateIp(ip: string): boolean {
  // IPv4 Private Ranges
  if (ip.startsWith('10.')) return true;
  if (ip.startsWith('192.168.')) return true;
  if (ip.startsWith('127.')) return true;
  if (ip.startsWith('169.254.')) return true;

  // 172.16.x.x to 172.31.x.x
  if (ip.startsWith('172.')) {
    const parts = ip.split('.');
    const secondOctet = parseInt(parts[1], 10);
    if (secondOctet >= 16 && secondOctet <= 31) return true;
  }

  // IPv6 Loopback and Unique Local
  if (ip === '::1') return true;
  if (ip.toLowerCase().startsWith('fc00:') || ip.toLowerCase().startsWith('fd00:')) return true;

  return false;
}

export async function safeFetch(url: string, init?: RequestInit): Promise<Response> {
  let currentUrl = url;
  let redirectCount = 0;
  const maxRedirects = 5;

  while (redirectCount <= maxRedirects) {
    const u = new URL(currentUrl);
    if (!['http:', 'https:'].includes(u.protocol)) {
      throw new Error(`Invalid protocol: ${u.protocol}`);
    }

    // Resolve DNS to check for private IP
    try {
      const { address } = await dns.lookup(u.hostname);

      if (net.isIP(address) === 0) {
          throw new Error(`Invalid IP address resolved: ${address}`);
      }

      if (isPrivateIp(address)) {
          throw new Error(`Blocked access to private IP: ${address}`);
      }
    } catch (error: any) {
      if (error.code === 'ENOTFOUND') throw new Error(`DNS lookup failed for ${u.hostname}`);
      throw error;
    }

    // Perform fetch with manual redirect handling
    const response = await fetch(currentUrl, { ...init, redirect: 'manual' });

    if (response.status >= 300 && response.status < 400 && response.headers.get('location')) {
       const location = response.headers.get('location');
       if (!location) break;

       try {
           currentUrl = new URL(location, currentUrl).toString();
       } catch {
           throw new Error(`Invalid redirect location: ${location}`);
       }

       redirectCount++;
       continue;
    }

    return response;
  }

  throw new Error(`Too many redirects (max: ${maxRedirects})`);
}
