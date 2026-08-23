/* THỐNG KÊ — HỌC SINH XUẤT SẮC TOÀN DIỆN — FINAL FIX 2026-08-23 */
(function () {
  'use strict';

  const PAGE = '#page-statistics';
  const BTN_ID = 'btnHSXuatSacToanDien';
  const PANEL_ID = 'hsXuatSacToanDienPanel';

  const root = () => document.querySelector(PAGE);
  const text = el => (el && el.textContent || '').replace(/\s+/g, ' ').trim();
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));

  function students() {
    const candidates = [window.students, window.classData && window.classData.students, window.appData && window.appData.students];
    for (const a of candidates) if (Array.isArray(a)) return a;
    try { if (typeof window.getStudentsSafe === 'function') return window.getStudentsSafe() || []; } catch (e) {}
    return [];
  }

  function records() {
    const names = ['attendanceRecords','attendanceData','violations','violationRecords','rewards','rewardRecords','learningRecords','learningData','progressRecords','comments','commentRecords'];
    const out = {};
    names.forEach(k => out[k] = Array.isArray(window[k]) ? window[k] : []);
    return out;
  }

  function sid(s) { return String(s && (s.id || s.studentId || s.studentCode || s.code) || '').trim(); }
  function nameOf(s) { return String(s && (s.name || s.fullName || s.hoTen || s.studentName) || '').trim(); }

  function countFor(arr, s) {
    const id = sid(s), name = nameOf(s).toLowerCase();
    return arr.filter(r => String(r && (r.studentId || r.studentCode || r.id || '')).trim() === id || String(r && (r.studentName || r.name || r.hoTen || '')).trim().toLowerCase() === name).length;
  }

  function learningScore(s) {
    const r = records();
    const arr = r.learningRecords.concat(r.learningData);
    const id = sid(s), name = nameOf(s).toLowerCase();
    const rs = arr.filter(x => String(x && (x.studentId || x.studentCode || x.id || '')).trim() === id || String(x && (x.studentName || x.name || x.hoTen || '')).trim().toLowerCase() === name);
    const vals = rs.map(x => Number(x.score ?? x.diem ?? x.average ?? x.avg ?? x.mark)).filter(Number.isFinite);
    return vals.length ? vals.reduce((a,b) => a+b, 0) / vals.length : 0;
  }

  function buildRows(limit) {
    const r = records(), ss = students();
    return ss.map(s => {
      const absent = countFor(r.attendanceRecords.concat(r.attendanceData), s);
      const vio = countFor(r.violations.concat(r.violationRecords), s);
      const rew = countFor(r.rewards.concat(r.rewardRecords), s);
      const learn = learningScore(s);
      const score = (learn / 10) * 60 + Math.min(rew, 10) * 2 - Math.min(vio, 10) * 3 - Math.min(absent, 10) * 1.5;
      return {s, absent, vio, rew, learn, score};
    }).sort((a,b) => b.score-a.score || b.learn-a.learn || b.rew-a.rew || a.vio-b.vio || a.absent-b.absent || nameOf(a.s).localeCompare(nameOf(b.s), 'vi')).slice(0, limit);
  }

  /* XÓA TRIỆT ĐỂ KHUNG THỐNG KÊ VẮNG TRÙNG.
     Chỉ xóa khung chi tiết bắt đầu bằng "📌 HS vắng";
     KHÔNG xóa khung "Theo dõi toàn bộ quá trình". */
  function removeDuplicateAttendanceDetail() {
    const page = root();
    if (!page) return;

    const candidates = [...page.querySelectorAll('*')].filter(el => {
      const t = text(el);
      return /^📌\s*HS vắng/.test(t) || /^HS vắng/.test(t) || t === '📌 HS vắng';
    });

    candidates.forEach(head => {
      let el = head;
      for (let i = 0; i < 10 && el && el !== page; i++, el = el.parentElement) {
        const t = text(el);
        const hasTable = !!el.querySelector('table');
        const isDetail = hasTable && (
          t.includes('Chưa có học sinh vắng') ||
          t.includes('1 học sinh = 1 dòng') ||
          t.includes('tính toàn bộ lượt đã lưu trên Google Sheets')
        );
        if (isDetail) {
          el.remove();
          return;
        }
      }
    });

    /* Nếu giao diện chỉ còn tiêu đề/tab rời rạc, loại riêng dòng tab vắng. */
    [...page.querySelectorAll('button')].forEach(b => {
      if (/^📌\s*HS vắng$/.test(text(b))) b.remove();
    });
  }

  function ensureButton() {
    const page = root();
    if (!page) return;
    let b = document.getElementById(BTN_ID);
    if (b) return;

    b = document.createElement('button');
    b.id = BTN_ID;
    b.type = 'button';
    b.className = 'button primary';
    b.innerHTML = '<i class="fa-solid fa-star"></i> HS xuất sắc toàn diện';
    b.addEventListener('click', showPanel);

    const header = page.querySelector('.page-header');
    if (header) {
      const actions = header.querySelector('.page-actions') || header;
      actions.appendChild(b);
    } else {
      page.insertBefore(b, page.firstChild);
    }
  }

  function showPanel() {
    const page = root();
    if (!page) return;

    const old = document.getElementById(PANEL_ID);
    if (old) old.remove();

    const p = document.createElement('section');
    p.id = PANEL_ID;
    p.className = 'dashboard-panel';
    p.style.marginTop = '16px';
    p.innerHTML = `
      <div class="panel-header">
        <div>
          <h3>🌟 Học sinh xuất sắc toàn diện</h3>
          <p>Xếp hạng theo học tập, năng lực/phẩm chất, chuyên cần, vi phạm và khen thưởng.</p>
        </div>
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
          <label for="hsXuatSacPreset" style="font-weight:700">Số lượng</label>
          <select id="hsXuatSacPreset" class="period-select">
            <option value="5">Top 5</option>
            <option value="10">Top 10</option>
            <option value="15">Top 15</option>
            <option value="20">Top 20</option>
            <option value="custom">Tùy chọn</option>
          </select>
          <input id="hsXuatSacCustom" class="period-select" type="number" min="1" max="999" step="1" placeholder="Nhập số" style="display:none;width:90px">
        </div>
      </div>
      <div class="table-container">
        <table class="data-table">
          <thead><tr><th>Hạng</th><th>Học sinh</th><th>Điểm tổng hợp</th><th>Học tập</th><th>Vắng</th><th>Vi phạm</th><th>Khen thưởng</th></tr></thead>
          <tbody id="hsXuatSacBody"></tbody>
        </table>
      </div>`;

    const anchor = document.getElementById(BTN_ID);
    const parent = anchor && anchor.parentElement ? anchor.parentElement.parentElement || page : page;
    parent.appendChild(p);

    const preset = document.getElementById('hsXuatSacPreset');
    const custom = document.getElementById('hsXuatSacCustom');

    function getLimit() {
      if (preset.value === 'custom') {
        const n = Math.floor(Number(custom.value));
        return Number.isFinite(n) && n > 0 ? Math.min(n, 999) : 5;
      }
      return Number(preset.value) || 5;
    }

    function render() {
      const rows = buildRows(getLimit());
      const body = document.getElementById('hsXuatSacBody');
      if (!body) return;
      body.innerHTML = rows.length
        ? rows.map((x,i) => `<tr><td><strong>${i+1}</strong></td><td><strong>${esc(nameOf(x.s) || 'Chưa xác định')}</strong></td><td><strong>${x.score.toFixed(1)}</strong></td><td>${x.learn ? x.learn.toFixed(1) : '—'}</td><td>${x.absent}</td><td>${x.vio}</td><td>${x.rew}</td></tr>`).join('')
        : '<tr><td colspan="7"><div class="empty-state"><strong>Chưa có dữ liệu học sinh</strong><p>Hệ thống không tự tạo hoặc đoán dữ liệu.</p></div></td></tr>';
    }

    preset.addEventListener('change', () => {
      custom.style.display = preset.value === 'custom' ? '' : 'none';
      if (preset.value === 'custom') custom.focus();
      render();
    });
    custom.addEventListener('input', render);
    render();
    p.scrollIntoView({behavior:'smooth', block:'start'});
  }

  function init() {
    removeDuplicateAttendanceDetail();
    ensureButton();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once:true});
  else init();

  /* Chạy lại sau các module thống kê khác render DOM. */
  let last = '';
  const timer = setInterval(() => {
    const page = root();
    if (!page) return;
    const key = page.innerHTML.length + '|' + text(page.querySelector('h1'));
    if (key !== last) {
      last = key;
      init();
    } else {
      /* Luôn kiểm tra khung vắng vì module khác có thể chèn lại. */
      removeDuplicateAttendanceDetail();
      ensureButton();
    }
  }, 700);

  window.addEventListener('hashchange', init);
})();
