# Supabase setup

1. The workspace is linked to the new `ai-job-agent` project (`bmlgpkfnnhekuounloum`).
2. The profile table and RLS policies have been applied to the hosted database.
3. Local ignored env files are configured for both apps. Templates are in `.env.example` files.
4. Run `npm --prefix apps/web run dev` and create an account at `/register`.
5. Save the profile at `/profile`.
6. Rebuild the extension with `npm --prefix apps/extension run build`, reload it in Chrome, and sign in from the popup with the same account.

Supabase's default email provider has a signup email rate limit. If signup shows `email rate limit exceeded`, wait for the limit window to reset, use an existing account, or configure custom SMTP under Supabase Dashboard -> Authentication -> SMTP Settings.

The web app stores the complete `CandidateProfile` JSON in `public.profiles.profile`, protected by row-level security. The extension reads only the row belonging to its authenticated Supabase user and caches that profile in `chrome.storage.local` for form filling.
