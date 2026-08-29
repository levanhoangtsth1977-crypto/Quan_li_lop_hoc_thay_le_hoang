const { createHash } = require('node:crypto');

const UPSTREAM = 'https://script.google.com/macros/s/AKfycbxTPwf-jhrR8JOoKY5ZLuzlsDgcv3nWILtDPTrNWY5DCEPpm2rkpXTn-sPAdFaUyy0z_uw/exec';
const PREFIX = 'LH_STUDENT_PROFILE_V3|2026-2027|5A3|';
const clean = value => String(value ?? '').trim().replace(/\s+/g, ' ');
const tokenForStudent = id => createHash('sha256').update(PREFIX + clean(id), 'utf8').digest('hex');
const pick = (obj, keys) => { const out = {}; for (const key of keys) if (obj?.[key] !== undefined && obj?.[key] !== null && obj?.[key] !== '') out[key] = obj[key]; return out; };
const byStudent = (list, sid, keys) => (Array.isArray(list) ? list : []).filter(x => clean(x?.studentId) === sid).map(x => pick(x, keys));

function parsePayload(text) {
  const value = String(text ?? '').trim().replace(/^\uFEFF/, '');
  try { return JSON.parse(value); } catch (_) {}
  const start = value.indexOf('(');
  const end = value.lastIndexOf(')');
  if (start >= 0 && end > start) {
    try { return JSON.parse(value.slice(start + 1, end)); } catch (_) {}
  }
  return null;
}

async function fetchUpstream() {
  const headers = {
    Accept: 'application/json,text/plain,*/*',
    'User-Agent': 'Mozilla/5.0 (compatible; StudentProfileProxy/1.0)'
  };

  // Preferred: Code.gs returns pure JSON when callback is omitted.
  const direct = await fetch(`${UPSTREAM}?action=get_all&_=${Date.now()}`, {
    redirect: 'follow', cache: 'no-store', headers
  });
  const directText = await direct.text();
  if (direct.ok) {
    const directData = parsePayload(directText);
    if (directData?.ok) return directData;
  }

  // Fallback: tolerate legacy JSONP response.
  const jsonp = await fetch(`${UPSTREAM}?action=get_all&callback=__LH_PROXY_CALLBACK&_=${Date.now()}`, {
    redirect: 'follow', cache: 'no-store', headers
  });
  const jsonpText = await jsonp.text();
  if (!jsonp.ok) throw new Error(`Google Apps Script HTTP ${jsonp.status}`);
  const jsonpData = parsePayload(jsonpText);
  if (!jsonpData?.ok) throw new Error(jsonpData?.error || 'Nguồn Google không trả dữ liệu hợp lệ.');
  return jsonpData;
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  const token = clean(req.query?.t || '');
  if (!token) return res.status(400).json({ ok: false, error: 'Thiếu mã truy cập cá nhân.' });

  try {
    const data = await fetchUpstream();
    const students = Array.isArray(data.HOC_SINH) ? data.HOC_SINH : [];
    const rawStudent = students.find(s => clean(s?.id) && tokenForStudent(s.id) === token);
    if (!rawStudent) return res.status(404).json({ ok: false, error: 'Mã truy cập không hợp lệ hoặc liên kết đã thay đổi.' });
    if (rawStudent.shareEnabled === false) return res.status(403).json({ ok: false, error: 'Liên kết hồ sơ hiện đang được khóa.' });

    const sid = clean(rawStudent.id);
    return res.status(200).json({
      ok: true,
      student: pick(rawStudent, ['id','name','gender','birthDate']),
      DIEM_DANH: byStudent(data.DIEM_DANH, sid, ['date','status','note']),
      VI_PHAM: byStudent(data.VI_PHAM, sid, ['date','type','level','action','note','status']),
      KHEN_THUONG: byStudent(data.KHEN_THUONG, sid, ['date','type','formType','note']),
      HOC_TAP: byStudent(data.HOC_TAP, sid, ['date','subject','result','level','note']),
      TIEN_BO: byStudent(data.TIEN_BO, sid, ['date','category','level','score','result','note']),
      NHAN_XET: (Array.isArray(data.NHAN_XET) ? data.NHAN_XET : [])
        .filter(x => clean(x?.studentId) === sid && x?.visibleToStudent !== false)
        .map(x => pick(x, ['date','subject','content','level','note']))
    });
  } catch (error) {
    console.error('[student-data]', error?.message || error);
    return res.status(502).json({
      ok: false,
      error: 'Không truy cập được nguồn dữ liệu Google.'
    });
  }
};