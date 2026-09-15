const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxTPwf-jhrR8JOoKY5ZLuzlsDgcv3nWILtDPTrYNWZCEPpm2rkpXTn-sPAdFaUyy0z_uw/exec';

function copyHeaders(res) {
  const type = res.headers.get('content-type');
  if (type) res.setHeader('content-type', type);
  res.setHeader('cache-control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
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
      if (typeof req.body === 'string') raw = req.body;
      else if (req.body && typeof req.body === 'object') {
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

    try {
      return res.status(upstream.ok ? 200 : 502).json(JSON.parse(text));
    } catch (_) {
      return res.status(upstream.ok ? 200 : 502).send(text);
    }
  } catch (error) {
    return res.status(502).json({
      ok: false,
      error: 'Không kết nối được Google Apps Script.',
      detail: String(error?.message || error)
    });
  }
};
