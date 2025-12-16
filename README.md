# Employer Profile Automation - Setup Guide

This project automates the creation of employer profiles by scraping website data, analyzing it with Gemini AI, and storing the results (Docs, Images, Logos) in a dedicated Google Drive folder.

## Prerequisites

- **Make.com Account** (Core/Teams plan recommended for higher timeouts).
- **Google Account** (Drive & Docs access).
- **Apify Account** (with `Website Content Crawler` actor availability).
- **Brandfetch Account** (Free or Paid API key).
- **Gemini AI API Key** (via Google AI Studio).

## Installation Steps

### 1. Import the Blueprint
1. Log in to Make.com.
2. Create a new Scenario.
3. Click on the "More" button (three dots) `...` in the bottom toolbar -> **Import Blueprint**.
4. Select the file `FINAL_IMPORT_ME.json` from this folder.
5. Save the scenario.

### 2. Verify Connections
After importing, check that all modules are connected correctly:
- **Module 11 (Webhook):** Click and copy the Webhook URL. You will need this for the Frontend.
- **Module 87 (Brandfetch):** Verify the `Authorization` header contains your Key (pre-filled).
- **Module 48 & 61 (Apify):** Verify the Connection is active. 
- **Module 25 & 26 (Google):** Verify your Google connection is selected.
- **Gemini Modules (7, 41):** Verify your Google Gemini connection is selected.

### 3. Add "Webhook Response" Module (Important!)
To enable the Frontend to show the "Success" message and the Folder Link:
1. Go to the end of the scenario's main flow (after the last module).
2. Add a **Webhook -> Webhook Response** module.
3. In the Body, paste this JSON:
   ```json
   {
     "status": "success",
     "folderUrl": "{{25.webViewLink}}"
   }
   ```
   *Note: Ensure `25.webViewLink` corresponds to the Google Drive folder creation module ID.*

### 4. Deploy Frontend
1. Open the file `status.html`.
2. Edit line 43:
   ```javascript
   const WEBHOOK_URL = "https://hook.eu2.make.com/YOUR_WEBHOOK_HASH_HERE";
   ```
   Replace `YOUR_WEBHOOK_HASH_HERE` with the URL you copied from **Module 11**.
3. Save the file.
4. Open `status.html` in your browser or deploy it to a static host (Netlify/Vercel).

## Usage
1. Open the Frontend.
2. Enter a target URL (e.g., `https://recruiting-now.de/`).
3. Click "Profil erstellen".
4. Wait for the process to finish (1-3 minutes).
5. Click the link to open the generated Google Drive folder.

## Troubleshooting
- **403 Errors:** Check your API Keys (Brandfetch, Apify).
- **Empty Docs:** Check Apify output in the Run History.
- **Timeout:** Ensure Apify actor is set to run Sync and Make.com timeout is sufficient.

