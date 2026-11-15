# Google Sheets setup (RSVP + Wishes)

Spreadsheet: https://docs.google.com/spreadsheets/d/1Kx7j1x-US5zwirFbb6fodh_YEXAReWjyXhsg6o55xCg/edit

1. Open the spreadsheet → **Extensions → Apps Script**.
2. Delete any existing code and paste the full contents of `code.ts` (project root). Save.
3. (Optional) Choose `setup` in the function dropdown and click **Run** to create the
   `RSVP` and `Wishes` tabs now. Otherwise they are created automatically on the first submission.
   Approve the permission prompt the first time.
4. **Deploy → New deployment** → type **Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
5. Copy the Web App URL (`https://script.google.com/macros/s/.../exec`) and either:
   - paste it into `DEFAULT_SCRIPT_URL` in `src/sheetsApi.ts`, **or**
   - set `VITE_GOOGLE_APPS_SCRIPT_URL` in `.env` (local) and in Vercel → Settings → Environment Variables.
6. Rebuild / redeploy the site.

Tabs created:
- **RSVP**: Timestamp · Full Name · Attendance · Number of Guests · Dietary Notes · Invited As
- **Wishes**: Timestamp · Name · Message · Invited As

Wishes are saved to the sheet only; they are not displayed on the invitation website.

If you change `code.ts` later: **Deploy → Manage deployments → Edit → Version: New version → Deploy**
(the URL stays the same).
