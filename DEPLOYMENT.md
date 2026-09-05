# Deployment

## Web app

The `main` branch is connected to Vercel. Pushes to `main` automatically deploy the Next.js app from `apps/web`.

Live URL: https://auto-job-filler.vercel.app

## Extension

Every push to `main` builds the Chrome extension in GitHub Actions. Download the `auto-job-filler-extension` artifact from the workflow run, unzip it, and load that folder from `chrome://extensions` with Developer mode enabled.

The extension cannot be hosted as a normal Vercel page. Publishing it to the Chrome Web Store is a separate manual publisher/review process.
