/* AI GIÁO VIÊN — TỔNG HỢP DỮ LIỆU TOÀN LỚP 5A3
 * Không sửa logic các menu hiện hữu.
 * Đọc trực tiếp kho dữ liệu canonical trên máy giáo viên.
 * Tích hợp GPT theo cách không cần API key: sao chép prompt + mở ChatGPT.
 */
(() => {
  'use strict';

  const STORAGE_KEY = 'LH_CANONICAL_2026_2027';
  const MOUNT_ID = 'aiClassSummaryPanel';

  const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (ch) => ({
    '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
  }[ch]));

  const clean = (value) => String(value ?? '').trim().replace(/\s+/g, ' ');
  const fold = (value) => clean(value).normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd').replace(/Đ/g, 'D')
    .toLocaleLowerCase('vi');

  const normalStatus = (value) => {
    const s = fold(value);
    if (['present','co mat','di hoc'].includes(s)) return 'Có mặt';
    if (['excused','co phep'].includes(s)) return 'Có phép';
    if (['absent','vang','khong phep'].includes(s)) return 'Không phép';
    return clean(value) || '—';
  };

  function readData() {
    try {
      const d = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      return d && typeof d === 'object' ? d : null;
    } catch (e) {
      console.warn('[AI class summary]', e);
      return null;
    }
  }

  function learningRows(d) {
    return Object.entries(d?.learning || {}).flatMap(([stage, rows]) =>
      (Array.isArray(rows) ? rows : []).map((r) => ({...r, __stage: stage}))
    );
  }

  function studentMap(d) {
    return new Map((Array.isArray(d?.students) ? d.students : []).map((s) => [
      String(s?.id ?? ''), s
    ]));
  }

  function nameOf(d, id) {
    const s = studentMap(d).get(String(id ?? ''));
    return clean(s?.name) || clean(id) || 'Chưa xác định';
  }

  function getSummaryRows(d) {
    const students = Array.isArray(d?.students) ? d.students : [];
    const att = Array.isArray(d?.attendance) ? d.attendance : [];
    const vio = Array.isArray(d?.violations) ? d.violations : [];
    const rew = Array.isArray(d?.rewards) ? d.rewards : [];
    const pro = Array.isArray(d?.progress) ? d.progress : [];
    const com = Array.isArray(d?.comments) ? d.comments : [];
    const learning = learningRows(d);

    return students.map((s, i) => {
      const sid = String(s?.id ?? '');
      const by = (rows) => rows.filter((r) => String(r?.studentId ?? '') === sid).length;
      return {
        stt: i + 1,
        id: sid,
        code: clean(s?.studentCode || s?.code),
        name: clean(s?.name) || 'Chưa có tên',
        status: s?.status === 'inactive' ? 'Không còn học' : 'Đang học',
        present: att.filter((r) => String(r?.studentId ?? '') === sid && normalStatus(r?.status) === 'Có mặt').length,
        excused: att.filter((r) => String(r?.studentId ?? '') === sid && normalStatus(r?.status) === 'Có phép').length,
        absent: att.filter((r) => String(r?.studentId ?? '') === sid && normalStatus(r?.status) === 'Không phép').length,
        vio: by(vio),
        rew: by(rew),
        learning: by(learning),
        progress: by(pro),
        comments: by(com)
      };
    });
  }

  function safeStudents(d) {
    return (Array.isArray(d?.students) ? d.students : []).map((s) => ({
      id: clean(s?.id),
      code: clean(s?.studentCode || s?.code),
      name: clean(s?.name),
      status: s?.status === 'inactive' ? 'Không còn học' : 'Đang học'
    })).filter((s) => s.name);
  }

  function safeRows(d, rows, extra) {
    return (Array.isArray(rows) ? rows : []).map((r) => {
      const out = Object.assign({
        date: clean(r?.date),
        studentId: clean(r?.studentId),
        studentName: nameOf(d, r?.studentId)
      }, extra || {});
      Object.entries(r || {}).forEach(([k, v]) => {
        if (['id','studentId','studentName','date','phone','address','parentName','parentPhone','url','link','token'].includes(k)) return;
        if (v !== null && v !== undefined && typeof v !== 'object') out[k] = v;
      });
      return out;
    });
  }

  function buildModel(d) {
    const learning = learningRows(d);
    return {
      thongTinLop: {
        truong: clean(d?.school || 'Trường Tiểu học Nghĩa Hành'),
        lop: clean(d?.className || '5A3'),
        namHoc: clean(d?.schoolYear || '2026–2027'),
        giaoVien: clean(d?.teacher || 'Lê Hoàng')
      },
      soLieuTongQuan: {
        hocSinh: Array.isArray(d?.students) ? d.students.length : 0,
        diemDanh: Array.isArray(d?.attendance) ? d.attendance.length : 0,
        viPham: Array.isArray(d?.violations) ? d.violations.length : 0,
        khenThuong: Array.isArray(d?.rewards) ? d.rewards.length : 0,
        hocTap: learning.length,
        tienBo: Array.isArray(d?.progress) ? d.progress.length : 0,
        nhanXet: Array.isArray(d?.comments) ? d.comments.length : 0
      },
      danhSachTongHop: getSummaryRows(d),
      danhSachHocSinh: safeStudents(d),
      diemDanh: safeRows(d, d?.attendance),
      viPham: safeRows(d, d?.violations),
      khenThuong: safeRows(d, d?.rewards),
      hocTap: safeRows(d, learning, {hocKy: ''}).map((r, i) => Object.assign(r, {
        hocKy: clean(learning[i]?.__stage)
      })),
      tienBo: safeRows(d, d?.progress),
      nhanXet: safeRows(d, d?.comments)
    };
  }

  function copyPayload(model) {
    return [
      'DỮ LIỆU PHÂN TÍCH AI GIÁO VIÊN — LỚP 5A3',
      'Chỉ sử dụng dữ liệu thực có; không tự tạo số liệu.',
      'Đã loại SĐT, địa chỉ, thông tin phụ huynh và URL/token link cá nhân.',
      '',
      JSON.stringify(model, null, 2)
    ].join('\n');
  }

  function analysisPrompt(model) {
    return [
      'Bạn là trợ lý phân tích dữ liệu giáo dục cho giáo viên chủ nhiệm lớp 5A3.',
      `Trường: ${model.thongTinLop.truong}. Năm học: ${model.thongTinLop.namHoc}. GVCN: ${model.thongTinLop.giaoVien}.`,
      '',
      'Hãy phân tích toàn bộ dữ liệu lớp theo các yêu cầu:',
      '1. Chỉ sử dụng số liệu/tên học sinh có trong dữ liệu; không tự tạo số liệu.',
      '2. Đối chiếu chéo: học sinh, điểm danh, vi phạm, khen thưởng, học tập GK1/CK1/GK2/CK2, tiến bộ, nhận xét.',
      '3. Nêu điểm tích cực của lớp và những vấn đề giáo viên cần ưu tiên theo dõi.',
      '4. Lập danh sách học sinh cần quan tâm theo bằng chứng dữ liệu và ghi rõ căn cứ; không suy đoán nguyên nhân.',
      '5. Lập danh sách học sinh có dữ liệu tích cực/tiến bộ.',
      '6. Phân tích mối liên hệ quan sát được giữa chuyên cần, hành vi và học tập; nếu chưa đủ dữ liệu thì nói rõ.',
      '7. Đề xuất biện pháp giáo dục thực tế cho tuần tiếp theo: cá nhân, nhóm nhỏ, cả lớp và phối hợp cha mẹ học sinh.',
      '8. Đề xuất cách theo dõi/cập nhật dữ liệu hàng tuần.',
      '9. Trình bày bằng bảng, dễ đọc, mỗi kết luận quan trọng nêu dữ liệu làm căn cứ.',
      '',
      'DỮ LIỆU LỚP:',
      JSON.stringify(model, null, 2)
    ].join('\n');
  }

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (e) {
      try {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        const ok = document.execCommand('copy');
        ta.remove();
        return ok;
      } catch {
        return false;
      }
    }
  }

  function notify(message) {
    try {
      if (typeof window.toast === 'function') {
        window.toast(message);
        return;
      }
    } catch {}
    alert(message);
  }

  function details(title, rows, cols) {
    const body = rows.length
      ? rows.map((r) => '<tr>' + cols.map((c) => '<td>' + escapeHtml(c.get(r)) + '</td>').join('') + '</tr>').join('')
      : '<tr><td colspan="' + cols.length + '"><div class="empty">Chưa có dữ liệu.</div></td></tr>';

    return '<details class="ai-data-details" style="margin-top:10px;border:1px solid #e4e9f0;border-radius:10px;padding:10px;background:#fff;">' +
      '<summary style="cursor:pointer;display:flex;justify-content:space-between;gap:8px;align-items:center"><b>' +
      escapeHtml(title) + '</b><span class="tag info">' + rows.length + ' bản ghi</span></summary>' +
      '<div class="table-wrap" style="margin-top:10px"><table class="table"><thead><tr>' +
      cols.map((c) => '<th>' + escapeHtml(c.label) + '</th>').join('') +
      '</tr></thead><tbody>' + body + '</tbody></table></div></details>';
  }

  function renderPanel() {
    const host = document.getElementById('mainContent');
    if (!host || document.getElementById(MOUNT_ID)) return;

    const d = readData();
    if (!d) {
      notify('Chưa có dữ liệu lớp để tổng hợp.');
      return;
    }

    const model = buildModel(d);
    const s = model.soLieuTongQuan;
    const rows = model.danhSachTongHop;

    const attention = rows.filter((r) => r.vio > 0 || r.absent > 0);
    const positive = rows.filter((r) => r.rew > 0 || r.progress > 0);

    const panel = document.createElement('section');
    panel.id = MOUNT_ID;
    panel.className = 'card';
    panel.style.marginTop = '14px';

    let html = '';
    html += '<style>' +
      '#' + MOUNT_ID + ' .ai-brand{display:flex;align-items:center;gap:12px;margin-bottom:10px}' +
      '#' + MOUNT_ID + ' .ai-brand img{width:64px;height:64px;object-fit:cover;border-radius:16px;border:1px solid #dbe2ec;background:#fff;flex:none}' +
      '#' + MOUNT_ID + ' .ai-brand h2{margin:0 0 3px}' +
      '#' + MOUNT_ID + ' .ai-stat-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px;margin-top:12px}' +
      '#' + MOUNT_ID + ' .ai-stat{background:#f8fafc;border:1px solid #e4e9f0;border-radius:10px;padding:10px}' +
      '#' + MOUNT_ID + ' .ai-stat b{display:block;font-size:22px;margin-top:4px}' +
      '#' + MOUNT_ID + ' .ai-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}' +
      '#' + MOUNT_ID + ' .ai-actions .btn{display:inline-flex;align-items:center}' +
      '#' + MOUNT_ID + ' .ai-mini-list{display:grid;gap:7px}' +
      '#' + MOUNT_ID + ' .ai-mini-row{padding:8px 10px;border:1px solid #edf1f5;border-radius:9px;background:#fafbfd}' +
      '#' + MOUNT_ID + ' .ai-summary-table-wrap{overflow-x:auto}' +
      '#' + MOUNT_ID + ' .ai-summary-table{min-width:980px}' +
      '#' + MOUNT_ID + ' .ai-summary-table th,#' + MOUNT_ID + ' .ai-summary-table td{white-space:nowrap;vertical-align:middle}' +
      '#' + MOUNT_ID + ' .ai-summary-table .ai-summary-name{min-width:220px;white-space:nowrap}' +
      '#' + MOUNT_ID + ' .ai-code{width:100%;min-height:260px;font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-size:12px}' +
      '@media(max-width:900px){#' + MOUNT_ID + ' .ai-stat-grid{grid-template-columns:repeat(3,1fr)}}' +
      '@media(max-width:600px){#' + MOUNT_ID + ' .ai-stat-grid{grid-template-columns:repeat(2,1fr)}}' +
      '</style>';

    html += '<div class="ai-brand"><img src="/assets/logo-5a3.svg" alt="Logo lớp 5A3"><div><h2>🤖 AI GIÁO VIÊN · 5A3</h2><div class="muted">Trường Tiểu học Nghĩa Hành · Năm học 2026–2027</div></div></div><div><h3 style="margin:0 0 4px">📊 Tổng hợp dữ liệu toàn lớp 5A3</h3>';
    html += '<div class="muted">Liên kết trực tiếp từ Học sinh · Hồ sơ · Điểm danh · Vi phạm · Khen thưởng · Học tập · Tiến bộ · Nhận xét</div></div>';

    html += '<div class="ai-actions">' +
      '<button class="btn" type="button" data-ai-class-action="refresh">↻ Cập nhật</button>' +
      '<button class="btn" type="button" data-ai-class-action="copy-all">📋 Sao chép tất cả danh sách</button>' +
      '<button class="btn primary" type="button" data-ai-class-action="gpt">🤖 Gửi GPT phân tích</button>' +
      '</div>';

    html += '<div class="ai-stat-grid">' +
      '<div class="ai-stat">Học sinh<b>' + s.hocSinh + '</b></div>' +
      '<div class="ai-stat">Điểm danh<b>' + s.diemDanh + '</b></div>' +
      '<div class="ai-stat">Vi phạm<b>' + s.viPham + '</b></div>' +
      '<div class="ai-stat">Khen thưởng<b>' + s.khenThuong + '</b></div>' +
      '<div class="ai-stat">Học tập<b>' + s.hocTap + '</b></div>' +
      '</div>';

    html += '<div class="notice" style="margin-top:12px"><b>Bản gửi GPT:</b> gồm dữ liệu phục vụ phân tích giáo dục; không gửi SĐT, địa chỉ, thông tin phụ huynh hoặc URL/token link cá nhân.</div>';

    html += '<div style="margin-top:14px"><h3 style="margin:0 0 8px">🔗 Nguồn dữ liệu</h3><div class="actions">' +
      '<a class="btn" href="#students">👥 Học sinh</a>' +
      '<a class="btn" href="#profiles">🪪 Hồ sơ</a>' +
      '<a class="btn" href="#attendance">📅 Điểm danh</a>' +
      '<a class="btn" href="#violations">⚠️ Vi phạm</a>' +
      '<a class="btn" href="#rewards">🏆 Khen thưởng</a>' +
      '<a class="btn" href="#learning">📚 Học tập</a>' +
      '<a class="btn" href="#progress">📈 Tiến bộ</a>' +
      '<a class="btn" href="#comments">💬 Nhận xét</a>' +
      '</div></div>';

    html += '<div style="margin-top:14px"><h3 style="margin:0 0 8px">📋 Danh sách tổng hợp chung cả lớp</h3>' +
      '<div class="table-wrap ai-summary-table-wrap"><table class="table ai-summary-table"><thead><tr>' +
      '<th>STT</th><th>Học sinh</th><th>Có mặt</th><th>Có phép</th><th>Vắng KP</th><th>Vi phạm</th><th>Khen</th><th>Học tập</th><th>Tiến bộ</th><th>Nhận xét</th>' +
      '</tr></thead><tbody>' +
      (rows.length ? rows.map((r) => '<tr>' +
        '<td>' + r.stt + '</td>' +
        '<td class="ai-summary-name"><b>' + escapeHtml(r.name) + '</b><div class="subtle">' + escapeHtml(r.code || r.id) + '</div></td>' +
        '<td>' + r.present + '</td><td>' + r.excused + '</td><td>' + r.absent + '</td>' +
        '<td>' + r.vio + '</td><td>' + r.rew + '</td><td>' + r.learning + '</td><td>' + r.progress + '</td><td>' + r.comments + '</td>' +
      '</tr>').join('') : '<tr><td colspan="10"><div class="empty">Chưa có dữ liệu học sinh.</div></td></tr>') +
      '</tbody></table></div></div>';

    html += '<div class="grid g2" style="margin-top:14px">' +
      '<div class="card"><h3>⚠️ Dữ liệu cần giáo viên xem xét</h3><div class="ai-mini-list">' +
      (attention.length ? attention.map((r) => '<div class="ai-mini-row"><b>' + escapeHtml(r.name) + '</b> · Vi phạm ' + r.vio + ' · Vắng không phép ' + r.absent + '</div>').join('') :
        '<div class="empty">Chưa có dữ liệu theo bộ lọc tự động.</div>') +
      '</div></div>' +
      '<div class="card"><h3>🌟 Dữ liệu tích cực</h3><div class="ai-mini-list">' +
      (positive.length ? positive.map((r) => '<div class="ai-mini-row"><b>' + escapeHtml(r.name) + '</b> · Khen ' + r.rew + ' · Tiến bộ ' + r.progress + '</div>').join('') :
        '<div class="empty">Chưa có dữ liệu theo bộ lọc tự động.</div>') +
      '</div></div></div>';

    html += details('👥 Danh sách học sinh', model.danhSachHocSinh, [
      {label:'Mã HS', get:(r)=>r.code || r.id},
      {label:'Họ tên', get:(r)=>r.name},
      {label:'Trạng thái', get:(r)=>r.status}
    ]);

    html += details('📅 Điểm danh', model.diemDanh, [
      {label:'Ngày', get:(r)=>r.date},
      {label:'Học sinh', get:(r)=>r.studentName},
      {label:'Trạng thái', get:(r)=>normalStatus(r.status)},
      {label:'Ghi chú', get:(r)=>r.note || ''}
    ]);

    html += details('⚠️ Vi phạm', model.viPham, [
      {label:'Ngày', get:(r)=>r.date},
      {label:'Học sinh', get:(r)=>r.studentName},
      {label:'Nội dung', get:(r)=>r.type || r.content || 'Ghi nhận'},
      {label:'Mức độ', get:(r)=>r.level || ''},
      {label:'Ghi chú', get:(r)=>r.note || ''}
    ]);

    html += details('🏆 Khen thưởng', model.khenThuong, [
      {label:'Ngày', get:(r)=>r.date},
      {label:'Học sinh', get:(r)=>r.studentName},
      {label:'Nội dung', get:(r)=>r.type || r.content || 'Ghi nhận'},
      {label:'Ghi chú', get:(r)=>r.note || ''}
    ]);

    html += details('📚 Học tập', model.hocTap, [
      {label:'Học kỳ', get:(r)=>r.hocKy},
      {label:'Học sinh', get:(r)=>r.studentName},
      {label:'Môn', get:(r)=>r.mon || r.subject || r.monHoc || ''},
      {label:'Điểm/Kết quả', get:(r)=>r.score ?? r.diem ?? r.result ?? r.ketQua ?? r.xepLoai ?? ''},
      {label:'Đánh giá', get:(r)=>r.assessment || r.danhGia || r.mucDat || r.mucDo || ''}
    ]);

    html += details('📈 Tiến bộ', model.tienBo, [
      {label:'Ngày', get:(r)=>r.date},
      {label:'Học sinh', get:(r)=>r.studentName},
      {label:'Nội dung', get:(r)=>r.content || r.type || ''}
    ]);

    html += details('💬 Nhận xét', model.nhanXet, [
      {label:'Ngày', get:(r)=>r.date},
      {label:'Học sinh', get:(r)=>r.studentName},
      {label:'Nội dung', get:(r)=>r.content || r.type || ''}
    ]);

    html += '<div style="margin-top:14px"><h3 style="margin:0 0 8px">🧾 Bản dữ liệu phân tích</h3>' +
      '<textarea class="ai-code" id="aiClassPayloadPreview" readonly></textarea></div>';

    panel.innerHTML = html;

    const current = host.querySelector('.card');
    if (current) current.insertAdjacentElement('afterend', panel);
    else host.appendChild(panel);

    const preview = panel.querySelector('#aiClassPayloadPreview');
    if (preview) preview.value = analysisPrompt(model);

    const aiText = document.getElementById('aiText');
    if (aiText) {
      aiText.value = 'Phân tích toàn bộ dữ liệu lớp 5A3 dựa trên dữ liệu thực tế hiện có; không tự tạo số liệu. Ưu tiên chuyên cần, hành vi, học tập, tiến bộ và biện pháp giáo dục.';
    }

    panel.addEventListener('click', async (event) => {
      const btn = event.target.closest('[data-ai-class-action]');
      if (!btn) return;

      const action = btn.dataset.aiClassAction;
      if (action === 'refresh') {
        panel.remove();
        renderPanel();
        notify('Đã cập nhật tổng hợp từ dữ liệu hiện tại.');
        return;
      }

      if (action === 'copy-all') {
        const ok = await copyText(copyPayload(buildModel(readData())));
        notify(ok ? 'Đã sao chép toàn bộ danh sách dữ liệu giáo dục.' : 'Không sao chép được. Có thể chọn ô dữ liệu và sao chép thủ công.');
        return;
      }

      if (action === 'gpt') {
        const latest = readData();
        if (!latest) {
          notify('Không đọc được dữ liệu lớp.');
          return;
        }
        const payload = analysisPrompt(buildModel(latest));
        const ok = await copyText(payload);
        if (!ok) {
          notify('Không thể sao chép tự động. Hãy sao chép khối dữ liệu bên dưới rồi mở GPT.');
          if (preview) {
            preview.removeAttribute('readonly');
            preview.focus();
            preview.select();
          }
          return;
        }
        window.open('https://chatgpt.com/', '_blank', 'noopener,noreferrer');
        notify('Đã sao chép dữ liệu phân tích. GPT đã được mở; dán nội dung rồi bấm Gửi.');
      }
    });
  }

  function schedule() {
    setTimeout(() => {
      if ((location.hash || '#home').split('?')[0] === '#ai') renderPanel();
    }, 0);
  }

  window.addEventListener('hashchange', schedule);
  document.addEventListener('DOMContentLoaded', schedule);

  const root = document.getElementById('mainContent');
  if (root) new MutationObserver(schedule).observe(root, {childList:true});

  schedule();
})();
