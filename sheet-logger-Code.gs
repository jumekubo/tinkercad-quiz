/* Tinkercad Skills Check — Results logger + auto-emailer
   -------------------------------------------------------
   Paste this whole file into a Google Apps Script project (see setup steps
   below), deploy it as a Web App, and paste the resulting URL into
   config.js's RESULTS_WEBHOOK_URL.

   Once set up, every completed attempt will:
     1. Append a row to the Google Sheet this script is attached to, and
     2. Automatically email you the result — sent by this script, from your
        own Google account, with no editable draft the student can alter.
        (This is what actually closes the "student edits the email before
        sending" gap — a browser page can never send email on its own; it
        has to go through a backend like this one.)

   SETUP (about 5 minutes, one time):
   1. Go to sheets.google.com and create a new blank spreadsheet.
      Name it something like "Tinkercad Quiz Results".
   2. In row 1, add these headers across columns A–F:
      Timestamp | Student Name | Score | Result | Date | Verification Code
   3. In the Sheet, go to Extensions > Apps Script.
   4. Delete any starter code in the editor, then paste in this entire file.
   5. Update the TEACHER_EMAIL constant below if needed — it defaults to
      jumekubo@wnsk8.com.
   6. Click the disk/Save icon, and give the project a name if asked
      (e.g. "Quiz Logger").
   7. Click Deploy > New deployment.
      - Click the gear icon next to "Select type" and choose "Web app".
      - Description: anything, e.g. "Quiz logger"
      - Execute as: Me
      - Who has access: Anyone
      - Click Deploy.
   8. The first time, Google will ask you to authorize the script —
      click through the "Advanced" / "Go to Quiz Logger (unsafe)" prompts.
      This warning is expected for your own script; it's not actually unsafe.
      It needs permission to send email and edit this Sheet — that's normal.
   9. Copy the "Web app URL" it gives you (ends in /exec).
   10. Open config.js in the tinkercad-quiz GitHub repo, click the pencil
       (edit) icon, and paste that URL between the quotes for
       RESULTS_WEBHOOK_URL. Commit the change.
   That's it — from then on, every completed attempt appends a row here AND
   emails you automatically, with no draft for the student to edit.
*/

var TEACHER_EMAIL = "jumekubo@wnsk8.com";

function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = JSON.parse(e.postData.contents);

  var scoreText = (data.score !== undefined ? data.score + "/" + data.total : "");
  var resultText = data.pass ? "PASS" : "NOT YET";

  sheet.appendRow([
    new Date(),
    data.name || "",
    scoreText,
    resultText,
    data.date || "",
    data.code || ""
  ]);

  var subject = "Tinkercad Skills Check Result — " + (data.name || "Unknown");
  var body =
    "Name: " + (data.name || "") + "\n" +
    "Score: " + scoreText + "\n" +
    "Result: " + resultText + "\n" +
    "Date: " + (data.date || "") + "\n" +
    "Verification code: " + (data.code || "") + "\n\n" +
    "This email was sent automatically when the student finished the quiz " +
    "— it was not composed or edited by the student.";
  MailApp.sendEmail(TEACHER_EMAIL, subject, body);

  return ContentService
    .createTextOutput(JSON.stringify({ status: "ok" }))
    .setMimeType(ContentService.MimeType.JSON);
}
