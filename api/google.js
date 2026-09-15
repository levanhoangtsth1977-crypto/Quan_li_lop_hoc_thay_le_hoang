const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxTPwf-jhrR8JOoKY5ZLuzlsDgcv3nWILtDPTrYNWZCEPpm2rkpXTn-sPAdFaUyy0z_uw/exec';

function copyHeaders(target, upstream) {
  target.setHeader('cache-control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  const type = upstream.headers.get('content-type');
  if (type) target.setHeader('x-google-content-type', type);
  target.setHeader('content-type', 'application/json; charset=utf-8');
}

function parseUpstream(text) {
  const raw = String(text ?? '').replace(/^\uFEFF/, '').trim();
  if (!raw) return null;
  try { return JSON.parse(raw); } catch (_) {}

  // Accept accidental JSONP wrappers such as callback({...}).
  const a = raw.indexOf('{');
  const b = raw.lastIndexOf('}');
  if (a >= 0 && b > a) {
    try { return JSON.parse(raw.slice(a, b + 1)); } catch (_) {}
  }
  return null;
}

module.exports = async function handler(req, res) {
  try {
    if (req.method !== 'GET' && req.method !== 'POST') {
      res.setHeader('allow', 'GET, POST');
      return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
    }

    let upstream;

    if (req.method === 'GET') {
      const qs = new URLSearchParams();
      Object.entries(req.query || {}).forEach(([key, value]) => {
        if (Array.isArray(value)) value.forEach(v => qs.append(key, String(v)));
        else if (value !== undefined && value !== null) qs.set(key, String(value));
      });
      upstream = await fetch(APPS_SCRIPT_URL + (qs.toString() ? '?' + qs.toString() : ''), {
        method: 'GET',
        redirect: 'follow',
        cache: 'no-store'
      });
    } else {
      let raw = '';
      if (typeof req.body === 'string') {
        raw = req.body;
      } else if (req.body && typeof req.body === 'object') {
        const body = new URLSearchParams();
        Object.entries(req.body).forEach(([key, value]) => body.set(key, String(value ?? '')));
        raw = body.toString();
      }

      upstream = await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        redirect: 'follow',
        cache: 'no-store',
        headers: { 'content-type': 'application/x-www-form-urlencoded;charset=UTF-8' },
        body: raw
      });
    }

    const text = await upstream.text();
    copyHeaders(res, upstream);
    const data = parseUpstream(text);

    if (data && typeof data === 'object') {
      return res.status(upstream.ok ? 200 : 502).json(data);
    }

    return res.status(502).json({
      ok: false,
      error: 'Google Apps Script trả phản hồi không phải JSON.',
      upstreamStatus: upstream.status,
      upstreamStatusText: upstream.statusText,
      upstreamContentType: upstream.headers.get('content-type') || '',
      responsePreview: String(text || '').replace(/\s+/g, ' ').slice(0, 500)
    });
  } catch (error) {
    return res.status(502).json({
      ok: false,
      error: 'Không kết nối được Google Apps Script.',
      detail: String(error?.message || error)
    });
  }
};
