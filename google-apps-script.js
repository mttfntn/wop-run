// ── Incolla questo codice in Google Apps Script ──────────
// Estensioni → Apps Script → incolla → Deploy → Manage deployments → Edit → New version
// Tipo: Web app → Execute as: Me → Who has access: Anyone

function doGet(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Leaderboard');
  const data = sheet.getDataRange().getValues();
  const rows = data.slice(1); // skip header

  // Sort by score descending, return top 20
  const leaderboard = rows
    .map(r => ({ username: r[0], score: Number(r[2]) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 20);

  return ContentService
    .createTextOutput(JSON.stringify({ leaderboard }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const { username, email, score } = body;

    if (!username || !email || score === undefined) {
      return ContentService
        .createTextOutput(JSON.stringify({ error: 'Missing fields' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Leaderboard');
    const data = sheet.getDataRange().getValues();
    const newScore = Number(score);

    // Check if email already exists
    let existingRow = -1;
    let existingScore = -1;
    for (let i = 1; i < data.length; i++) {
      if (data[i][1] === email) {
        existingRow = i + 1; // sheet rows are 1-indexed
        existingScore = Number(data[i][2]);
        break;
      }
    }

    if (existingRow > 0) {
      // Email exists: only update if new score is higher
      if (newScore > existingScore) {
        sheet.getRange(existingRow, 1).setValue(username);
        sheet.getRange(existingRow, 3).setValue(newScore);
        sheet.getRange(existingRow, 4).setValue(new Date().toISOString());
        return ContentService
          .createTextOutput(JSON.stringify({ success: true, updated: true }))
          .setMimeType(ContentService.MimeType.JSON);
      } else {
        return ContentService
          .createTextOutput(JSON.stringify({ success: false, reason: 'Existing score is higher or equal' }))
          .setMimeType(ContentService.MimeType.JSON);
      }
    } else {
      // New email: add new row
      sheet.appendRow([username, email, newScore, new Date().toISOString()]);
      return ContentService
        .createTextOutput(JSON.stringify({ success: true, updated: false }))
        .setMimeType(ContentService.MimeType.JSON);
    }
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
