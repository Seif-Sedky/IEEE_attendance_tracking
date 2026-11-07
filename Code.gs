// IEEE GUC Sessions backend. Paste into Extensions > Apps Script of your Google Sheet.
// 1) Run setup() once.  2) Fill the "sessions" tab.  3) Deploy > New deployment > Web app
//    (Execute as: Me, Who has access: Anyone). Copy the /exec URL into index.html.

const TZ = 'Africa/Cairo';

function setup() {
  const ss = SpreadsheetApp.getActive();
  [['sessions', ['id', 'committee', 'date', 'title', 'theme']],
   ['attendance', ['timestamp', 'sessionId', 'studentId', 'fun']]].forEach(([name, head]) => {
    const sh = ss.getSheetByName(name) || ss.insertSheet(name);
    if (sh.getLastRow() === 0) sh.appendRow(head);
  });
  // Keep dates as plain text so they never turn into Date objects
  ss.getSheetByName('sessions').getRange('C:C').setNumberFormat('@');
}

const norm = s => String(s || '').toLowerCase().replace(/\s+/g, ' ').trim();
const dstr = v => v instanceof Date ? Utilities.formatDate(v, TZ, 'yyyy-MM-dd') : String(v).trim();
const rows = name => {
  const v = SpreadsheetApp.getActive().getSheetByName(name).getDataRange().getValues();
  v.shift();
  return v.filter(r => r[0] !== '' || r[1] !== '');
};
const out = o => ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);

function doGet() {
  const cache = CacheService.getScriptCache();
  const hit = cache.get('data');
  if (hit) return ContentService.createTextOutput(hit).setMimeType(ContentService.MimeType.JSON);
  // The "theme" column is never sent to the browser.
  const sessions = rows('sessions').map(r => ({ id: String(r[0]), committee: String(r[1]).trim(), date: dstr(r[2]), title: String(r[3]) }));
  const attendance = rows('attendance').map(r => ({ sid: String(r[1]), id: String(r[2]), fun: String(r[3]) }));
  const json = JSON.stringify({ sessions, attendance });
  cache.put('data', json, 30);
  return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
    const b = JSON.parse(e.postData.contents);
    const id = norm(b.id).replace(/\s/g, '');
    const fun = String(b.fun || '').trim().slice(0, 300);
    if (!id || !b.theme || !fun) return out({ ok: false, msg: 'Fill in all three fields.' });

    const today = Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd');
    const s = rows('sessions').find(r => dstr(r[2]) === today && norm(r[4]) === norm(b.theme));
    if (!s) return out({ ok: false, msg: "That theme doesn't match a session running today. Check the spelling." });

    const sid = String(s[0]);
    const dup = rows('attendance').some(r => String(r[1]) === sid && norm(r[2]).replace(/\s/g, '') === id);
    if (dup) return out({ ok: true, dup: true, title: String(s[3]), msg: "You're already checked in for this session." });

    SpreadsheetApp.getActive().getSheetByName('attendance').appendRow([new Date(), sid, id, fun]);
    CacheService.getScriptCache().remove('data');
    return out({ ok: true, title: String(s[3]), committee: String(s[1]) });
  } catch (err) {
    return out({ ok: false, retry: true, msg: 'Server busy, try again.' });
  } finally {
    lock.releaseLock();
  }
}
