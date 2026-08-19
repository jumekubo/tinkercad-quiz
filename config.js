/* Optional settings — safe to edit directly on GitHub, no coding needed.

   RESULTS_WEBHOOK_URL: paste your Google Apps Script Web App URL here
   (see sheet-logger-Code.gs for the script + setup steps) to turn on:
     - Auto-logging every completed attempt as a row in a Google Sheet
     - Auto-emailing you the result with NO editable draft for the student
       (the "Send Results to My Teacher" button becomes a true one-click
       send instead of opening a mail app draft)

   Leave it as an empty string ("") and the site still works — the
   certificate still shows, and the results button falls back to opening a
   pre-filled email draft in the student's own mail app (which they COULD
   edit before sending, since there's no backend involved yet).
*/
const RESULTS_WEBHOOK_URL = "";
