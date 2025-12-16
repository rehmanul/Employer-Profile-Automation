# Employer Profile Automation

Professional Make.com automation for generating employer profiles using Brandfetch API.

## Quick Start

### 1. Import Blueprint
1. Go to [Make.com](https://www.make.com) → Scenarios → Import Blueprint
2. Import `CLEAN_BLUEPRINT.json`
3. Click on Module 11 (Webhook) and copy the webhook URL

### 2. Configure Connections
- **Module 25**: Connect your Google Drive account
- **Module 26**: Connect your Google Docs account  
- **Module 87**: Brandfetch API key is pre-configured

### 3. Run the Frontend
```bash
npm install
npm run dev
```
Open `http://localhost:3000` in your browser.

### 4. Test
1. Enter a company URL (e.g., `https://stripe.com`)
2. Click "Generate Profile"
3. View results: logos, colors, fonts, social links
4. Open the created Google Doc in Drive

## Files

| File | Description |
|------|-------------|
| `CLEAN_BLUEPRINT.json` | Make.com scenario (7 modules) |
| `app/page.tsx` | Next.js frontend |
| `index.html` | Standalone HTML frontend |

## Flow

```
Webhook → Normalize URL → Extract Domain → Create Drive Folder 
    → Brandfetch API → Create Google Doc → Return Response
```

## API Response

The webhook returns:
```json
{
  "success": true,
  "domain": "stripe.com",
  "name": "Stripe",
  "description": "...",
  "folderUrl": "https://drive.google.com/...",
  "docUrl": "https://docs.google.com/...",
  "logos": [...],
  "colors": [...],
  "fonts": [...],
  "links": [...]
}
```

## Support

For issues, check:
1. Webhook URL is correct in frontend
2. Google Drive/Docs connections are authorized
3. Brandfetch API key is valid
