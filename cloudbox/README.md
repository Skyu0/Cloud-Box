# Cloud Box

Plain HTML/CSS/JS PWA. No build step.

## Run locally
`npx serve .` then open the shown URL (a PWA needs http://localhost or https).

## Deploy on Render (free)
New > Web Service > connect the GitHub repo. Build command: `npm install`. Start command: `npm start`. Instance type: Free. Add env vars: `GEMINI_API_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`. Free services sleep after 15 minutes idle, so the first scan after a break can take about a minute.

## Or on Vercel (free)
1. **Host:** push this folder to GitHub, import it into Vercel. The `api/analyze.js` function deploys automatically.
2. **AI scan:** in Vercel > Settings > Environment Variables add `GEMINI_API_KEY` (from Google AI Studio). Optional: `GEMINI_MODEL` (check Google's current model names).
3. **Accounts:** create a Supabase project, enable Email auth, then put the Project URL and anon key in `config.js`. Also add `SUPABASE_URL` and `SUPABASE_ANON_KEY` to Vercel env vars so only logged-in users can use the AI.
4. **Install:** open the live https link on a phone, then Chrome > Install app, or Safari > Share > Add to Home Screen.

Without Supabase keys the app runs in local mode (accounts and library stay on that device).
