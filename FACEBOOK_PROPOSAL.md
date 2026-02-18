# Proposal: Facebook Image Scraping Integration

## Objective
Implement an optional mechanism to crawl Facebook for additional images when the primary website crawl yields insufficient results (e.g., fewer than 5 high-quality images).

## Feasibility Analysis

### 1. Official Facebook Graph API
*   **Pros**: Official, structured data.
*   **Cons**: Extremely restrictive. Requires "Business Verification" and specific permissions (`Page Public Content Access`) which are typically only granted for analytics apps, not scraping. Tokens are short-lived or require user login.
*   **Verdict**: **Not viable** for scraping arbitrary employer profiles without their explicit authorization.

### 2. Direct Scraping (Puppeteer/Playwright)
*   **Pros**: No API costs.
*   **Cons**: Facebook employs aggressive anti-bot measures (IP bans, login walls, CAPTCHAs, dynamic class names). Requires:
    *   High-quality residential proxies.
    *   Stealth browser plugins.
    *   Constant maintenance as Facebook updates its UI.
*   **Verdict**: **High risk / High maintenance**. Not recommended for a stable production feature.

### 3. Third-Party Scraping APIs (Recommended)
*   **Pros**: Handles proxies, blocking, and UI changes.
*   **Cons**: usage costs (e.g., $5-10/month or per request).
*   **Providers**:
    *   **Apify**: Facebook Photos Scraper actor. Reliable, JSON output.
    *   **Bright Data / ScrapingBee**: General browser APIs, but might still struggle with FB specifically without specialized scripts.
    *   **SerpApi**: Can scrape Google Images with `site:facebook.com` queries.

## Proposed Solution: Google Image Search Enhancement (Low Effort)
Before integrating a dedicated Facebook scraper, we can leverage the existing Google Custom Search integration by refining the query.
*   **Current Fallback**: Queries `site:domain.com team OR office...`
*   **Proposed**: If images < 5, add a second query for `site:facebook.com/company-page-name` or just `company name facebook photos`.
*   **Effort**: 1 hour.
*   **Cost**: Covered by existing Google Custom Search quota.

## Proposed Solution: Apify Integration (High Quality)
If the Google Fallback is insufficient, we can integrate Apify.

### Workflow
1.  **Frontend (`app/page.tsx`)**:
    *   Detect if `images.length < 5`.
    *   Extract Facebook URL from social links found during the main crawl.
    *   If Facebook URL exists, call a new API endpoint (e.g., `/api/scrape-facebook`).
2.  **Backend (`/api/scrape-facebook`)**:
    *   Input: Facebook Page URL.
    *   Action: Call Apify Actor (`apify/facebook-photos-scraper`).
    *   Output: List of image URLs.
3.  **Make.com**:
    *   Pass these additional images to the webhook.

### Effort Estimate
*   **Setup Apify Account & Actor**: 1 hour.
*   **Backend Endpoint Implementation**: 2 hours.
*   **Frontend Integration**: 2 hours.
*   **Testing & Tuning**: 2 hours.
*   **Total**: **~7 hours**.

## Recommendation
Start by adjusting the **Google Image Search fallback** query to specifically look for social media assets if the main site fails. Only implement the Apify solution if image quality remains a critical blocker, as it introduces new billing complexity and dependency.
