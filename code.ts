// @ts-nocheck
/**
 * Shanika & Tharusha — Wedding RSVP + Wishes backend (Google Apps Script)
 *
 * Paste this whole file into Extensions → Apps Script of the spreadsheet,
 * then Deploy → New deployment → Web app (Execute as: Me, Who has access: Anyone).
 *
 * The "RSVP" and "Wishes" tabs (with formatted headers) are created automatically
 * on the first submission. You can also run `setup` once from the editor to create them now.
 */

const SPREADSHEET_ID = '1Kx7j1x-US5zwirFbb6fodh_YEXAReWjyXhsg6o55xCg';

const SHEETS = {
  RSVP: {
    name: 'RSVP',
    headers: ['Timestamp', 'Full Name', 'Attendance', 'Number of Guests', 'Dietary Notes', 'Invited As'],
    widths: [170, 220, 130, 140, 300, 200],
    color: '#7a1f2b', // royal maroon
  },
  WISHES: {
    name: 'Wishes',
    headers: ['Timestamp', 'Name', 'Message', 'Invited As'],
    widths: [170, 200, 480, 200],
    color: '#0f5c4a', // emerald
  },
};

const MAX_LEN = { name: 120, message: 1000, notes: 500 };

// ---------- Web app entry points ----------

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const p = parsePayload_(e);
    const type = String(p.sheet || p.type || '').trim().toUpperCase();
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

    if (type === 'RSVP') {
      const name = clean_(p.name, MAX_LEN.name);
      if (!name) return json_({ ok: false, error: 'Name is required.' });
      const attending = String(p.attendance || '').toLowerCase().indexOf('no') === 0 ? 'Not Attending' : 'Attending';
      const sheet = ensureSheet_(ss, SHEETS.RSVP);
      sheet.appendRow([
        new Date(),
        name,
        attending,
        attending === 'Attending' ? Number(p.guests) || 1 : 0,
        clean_(p.dietary || p.dietaryNotes, MAX_LEN.notes),
        clean_(p.invitedAs, MAX_LEN.name),
      ]);
      return json_({ ok: true });
    }

    if (type === 'WISH' || type === 'WISHES') {
      const name = clean_(p.name, MAX_LEN.name);
      const message = clean_(p.message, MAX_LEN.message);
      if (!name || !message) return json_({ ok: false, error: 'Name and message are required.' });
      const sheet = ensureSheet_(ss, SHEETS.WISHES);
      sheet.appendRow([new Date(), name, message, clean_(p.invitedAs, MAX_LEN.name)]);
      return json_({ ok: true });
    }

    return json_({ ok: false, error: 'Unknown sheet. Use "RSVP" or "Wishes".' });
  } catch (err) {
    return json_({ ok: false, error: String(err && err.message ? err.message : err) });
  } finally {
    try { lock.releaseLock(); } catch (_) {}
  }
}

/**
 * GET ?action=wishes  → latest wishes (newest first) for the guestbook on the website.
 * GET (no action)      → health check.
 */
function doGet(e) {
  try {
    const action = String((e && e.parameter && e.parameter.action) || '').toLowerCase();
    if (action !== 'wishes') {
      return json_({ ok: true, message: 'Shanika & Tharusha wedding endpoint is running.' });
    }

    const limit = Math.min(Number(e.parameter.limit) || 100, 300);
    const sheet = ensureSheet_(SpreadsheetApp.openById(SPREADSHEET_ID), SHEETS.WISHES);
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return json_({ ok: true, wishes: [] });

    const count = Math.min(limit, lastRow - 1);
    const rows = sheet.getRange(lastRow - count + 1, 1, count, 3).getValues();
    const wishes = rows
      .filter(function (r) { return r[1] && r[2]; })
      .map(function (r) {
        return {
          timestamp: r[0] instanceof Date ? r[0].toISOString() : String(r[0]),
          name: unescape_(String(r[1])),
          message: unescape_(String(r[2])),
        };
      })
      .reverse();

    return json_({ ok: true, wishes: wishes });
  } catch (err) {
    return json_({ ok: false, error: String(err && err.message ? err.message : err) });
  }
}

/** Run once from the Apps Script editor to create both tabs right away (optional). */
function setup() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  ensureSheet_(ss, SHEETS.RSVP);
  ensureSheet_(ss, SHEETS.WISHES);
}

// ---------- Helpers ----------

/** Returns the sheet, creating it and writing/styling the header row when missing. */
function ensureSheet_(ss, def) {
  let sheet = ss.getSheetByName(def.name);
  if (!sheet) sheet = ss.insertSheet(def.name);

  const width = def.headers.length;
  const current = sheet.getLastRow() > 0
    ? sheet.getRange(1, 1, 1, width).getValues()[0].map(String)
    : [];
  const hasHeaders = def.headers.every(function (h, i) { return current[i] === h; });

  if (!hasHeaders) {
    if (sheet.getLastRow() > 0 && current.some(function (v) { return v !== ''; })) {
      sheet.insertRowBefore(1); // keep any existing data below the new header row
    }
    const header = sheet.getRange(1, 1, 1, width);
    header.setValues([def.headers])
      .setFontWeight('bold')
      .setFontColor('#ffffff')
      .setBackground(def.color)
      .setHorizontalAlignment('center')
      .setVerticalAlignment('middle');
    sheet.setRowHeight(1, 32);
    sheet.setFrozenRows(1);
    def.widths.forEach(function (w, i) { sheet.setColumnWidth(i + 1, w); });
    sheet.getRange(2, 1, sheet.getMaxRows() - 1, 1).setNumberFormat('yyyy-mm-dd hh:mm');
    sheet.getRange(2, 1, sheet.getMaxRows() - 1, width).setWrap(true).setVerticalAlignment('top');
  }
  return sheet;
}

function parsePayload_(e) {
  const params = (e && e.parameter) || {};
  if (Object.keys(params).length > 0) return params;

  const body = e && e.postData && e.postData.contents ? e.postData.contents : '';
  if (!body) return {};
  try {
    return JSON.parse(body);
  } catch (_) {
    const out = {};
    body.split('&').forEach(function (pair) {
      if (!pair) return;
      const i = pair.indexOf('=');
      const k = decodeURIComponent((i >= 0 ? pair.slice(0, i) : pair).replace(/\+/g, ' '));
      out[k] = decodeURIComponent((i >= 0 ? pair.slice(i + 1) : '').replace(/\+/g, ' '));
    });
    return out;
  }
}

/** Trims, limits length and neutralises spreadsheet formula injection (=, +, -, @). */
function clean_(value, maxLen) {
  let s = String(value == null ? '' : value).trim().slice(0, maxLen);
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  return s;
}

function unescape_(s) {
  return s.charAt(0) === "'" ? s.slice(1) : s;
}

function json_(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}
