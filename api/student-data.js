const { createHash } = require('node:crypto');

const UPSTREAM = 'https://script.google.com/macros/s/AKfycbxTPwf-jhrR8JOoKY5ZLuzlsDgcv3nWILtDPTrYNWZCEPpm2rkpXTn-sPAdFaUyy0z_uw/exec';
const PREFIX = 'LH_STUDENT_PROFILE_V3|2026-2027|5A3|';
const clean = value => String(value ?? '').trim().replace(/\s+/g, ' ');
const tokenForStudent = id => createHash('sha256').update(PREFIX + clean(id), 'utf8').digest('hex');
const pick = (obj, keys) => { const out = {}; for (const key of keys) if (obj?.[key] !== undefined && obj?.[key] !== null && obj?.[key] !== '') out[key] = obj[key]; return out; };
const byStudent = (list, sid, name, keys) => (Array.isArray(list) ? list : []).filter(x => clean(x?.studentId) === sid || clean(x?.studentName) === name).map(x => pick(x, keys));

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
  const response = await fetch(`${UPSTREAM}?action=get_all&_=${Date.now()}`, {
    redirect: 'follow',
    cache: 'no-store',
    headers: { Accept: 'application/json,text/plain,*/*', 'User-Agent': 'Mozilla/5.0 (compatible; StudentProfileProxy/2.0)' }
  });
  const text = await response.text();
  const data = parsePayload(text);
  if (!response.ok || !data?.ok) throw new Error(`Google Apps Script HTTP ${response.status}`);
  return data;
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ ok: false, error: 'Method Not Allowed' });

  const token = clean(req.query?.t || '');
  if (!token) return res.status(400).json({ ok: false, error: 'Thiếu mã truy cập cá nhân.' });

  try {
    const data = await fetchUpstream();
    const students = Array.isArray(data.HOC_SINH) ? data.HOC_SINH : [];
    const student = students.find(s => clean(s?.id) && tokenForStudent(s.id) === token);
    if (!student) return res.status(404).json({ ok: false, error: 'Mã truy cập không hợp lệ hoặc liên kết đã thay đổi.' });
    if (student.shareEnabled === false) return res.status(403).json({ ok: false, error: 'Liên kết hồ sơ hiện đang được khóa.' });

    const sid = clean(student.id), name = clean(student.name);
    return res.status(200).json({
      ok: true,
      student: pick(student, ['id','name','gender','birthDate']),
      DIEM_DANH: byStudent(data.DIEM_DANH, sid, name, ['date','status','note']),
      VI_PHAM: byStudent(data.VI_PHAM, sid, name, ['date','type','level','action','note','status']),
      KHEN_THUONG: byStudent(data.KHEN_THUONG, sid, name, ['date','type','formType','note']),
      HOC_TAP: byStudent(data.HOC_TAP, sid, name, ['date','subject','result','level','note']),
      TIEN_BO: byStudent(data.TIEN_BO, sid, name, ['date','category','level','score','result','note']),
      NHAN_XET: (Array.isArray(data.NHAN_XET) ? data.NHAN_XET : [])
        .filter(x => (clean(x?.studentId) === sid || clean(x?.studentName) === name) && x?.visibleToStudent !== false)
        .map(x => pick(x, ['date','subject','content','level','note']))
    });
  } catch (error) {
    console.error('[student-data]', error?.message || error);
    return res.status(502).json({ ok: false, error: 'Không truy cập được nguồn dữ liệu Google.' });
  }
};