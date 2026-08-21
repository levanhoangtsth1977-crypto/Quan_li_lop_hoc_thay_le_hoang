/* =========================================================
   HỌC TẬP — GIAI ĐOẠN 1
   Module độc lập: ghi nhận / hiển thị / lọc / xóa từng lượt.
   Không sửa dữ liệu các module khác.
   ========================================================= */
(function () {
  'use strict';

  const SUBJECTS = ['Toán','Tiếng Việt','Khoa học','Lịch sử và Địa lí','Công nghệ','Tin học','Ngoại ngữ'];
  const LEVELS = ['Tốt','Đạt','Chưa đạt'];

  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  }
  function records() {
    if (Array.isArray(window.learningRecords)) return window.learningRecords;
    if (window.APP_DATA && Array.isArray(window.APP_DATA.learning)) return window.APP_DATA.learning;
    window.learningRecords = [];
    return window.learningRecords;
  }
  function students() {
    if (Array.isArray(window.students)) return window.students;
    if (window.APP_DATA && Array.isArray(window.APP_DATA.students)) return window.APP_DATA.students;
    if (Array.isArray(window.HOC_SINH)) return window.HOC_SINH;
    return [];
  }
  function studentIdOf(s) { return s.id || s.studentId || s.ID || ''; }
  function studentName(id) {
    const s = students().find(x => String(studentIdOf(x)) === String(id));
    return s ? (s.name || s.hoTen || s.hoten || s.fullName || '') : (id || '');
  }
  function uid() { return 'HT_' + Date.now() + '_' + Math.random().toString(36).slice(2,8); }
  function today() { return new Date().toISOString().slice(0,10); }
  function notify(msg) {
    if (typeof window.showToast === 'function') window.showToast(msg);
    else alert(msg);
  }

  function saveLocal() {
    try {
      if (Array.isArray(window.learningRecords)) localStorage.setItem('learningRecords', JSON.stringify(window.learningRecords));
    } catch (_) {}
    if (typeof window.saveData === 'function') { try { window.saveData(); } catch (_) {} }
  }

  function openForm(editId) {
    const old = records().find(r => String(r.id) === String(editId)) || {};
    const ss = students();
    const opts = ss.map(s => {
      const id = studentIdOf(s), name = s.name || s.hoTen || s.hoten || s.fullName || id;
      return `<option value="${esc(id)}" ${String(id)===String(old.studentId||'')?'selected':''}>${esc(name)}</option>`;
    }).join('');
    const subjectOpts = SUBJECTS.map(x => `<option ${x===old.subject?'selected':''}>${esc(x)}</option>`).join('');
    const levelOpts = LEVELS.map(x => `<option ${x===old.level?'selected':''}>${esc(x)}</option>`).join('');
    const html = `<div id="learningModal" class="modal-overlay" style="display:flex;z-index:9999">
      <div class="modal-card" style="max-width:620px;width:94%;max-height:90vh;overflow:auto">
        <div class="modal-header"><h3>📝 ${editId?'Chỉnh sửa':'Ghi nhận'} kết quả học tập</h3><button type="button" onclick="window.closeLearningForm()">×</button></div>
        <form id="learningForm">
          <input type="hidden" name="id" value="${esc(old.id||'')}">
          <label>Ngày<input type="date" name="date" value="${esc(old.date||today())}" required></label>
          <label>Học sinh<select name="studentId" required><option value="">-- Chọn học sinh --</option>${opts}</select></label>
          <label>Môn học<select name="subject" required><option value="">-- Chọn môn --</option>${subjectOpts}</select></label>
          <label>Nội dung<input name="content" value="${esc(old.content||'')}" placeholder="Ví dụ: Phân số" required></label>
          <label>Loại kết quả<select name="resultType"><option value="DIEM" ${old.resultType==='DIEM'?'selected':''}>Điểm</option><option value="MUC_DAT" ${old.resultType==='MUC_DAT'?'selected':''}>Mức đạt</option><option value="NHAN_XET" ${old.resultType==='NHAN_XET'?'selected':''}>Nhận xét</option></select></label>
          <label>Điểm (0–10)<input type="number" name="score" min="0" max="10" step="0.1" value="${esc(old.score??'')}" placeholder="Không bắt buộc"></label>
          <label>Mức đạt<select name="level"><option value="">-- Không chọn --</option>${levelOpts}</select></label>
          <label>Nhận xét<textarea name="comment" rows="3" placeholder="Nhận xét về kết quả học tập">${esc(old.comment||'')}</textarea></label>
          <label>Ghi chú<textarea name="note" rows="2">${esc(old.note||'')}</textarea></label>
          <div class="modal-actions"><button type="button" onclick="window.closeLearningForm()">Hủy</button><button class="btn-primary" type="submit">💾 ${editId?'Cập nhật':'Lưu kết quả'}</button></div>
        </form>
      </div></div>`;
    document.body.insertAdjacentHTML('beforeend', html);
    document.getElementById('learningForm').addEventListener('submit', saveForm);
  }

  function saveForm(e) {
    e.preventDefault();
    const f = new FormData(e.target);
    const id = f.get('id') || uid();
    const scoreRaw = String(f.get('score')||'').trim();
    if (scoreRaw !== '' && (Number(scoreRaw)<0 || Number(scoreRaw)>10)) return notify('Điểm phải từ 0 đến 10.');
    const item = { id, studentId:String(f.get('studentId')||''), date:String(f.get('date')||''), subject:String(f.get('subject')||''), content:String(f.get('content')||''), resultType:String(f.get('resultType')||'DIEM'), score:scoreRaw===''?'':Number(scoreRaw), level:String(f.get('level')||''), comment:String(f.get('comment')||''), note:String(f.get('note')||''), updatedAt:new Date().toISOString() };
    const arr = records(), i = arr.findIndex(r => String(r.id)===String(id));
    if (i >= 0) arr[i] = Object.assign({}, arr[i], item); else { item.createdAt=item.updatedAt; arr.unshift(item); }
    window.learningRecords = arr;
    if (window.APP_DATA) window.APP_DATA.learning = arr;
    saveLocal();
    closeForm();
    render();
    notify(i>=0?'Đã cập nhật kết quả học tập.':'Đã lưu kết quả học tập.');
  }
  function closeForm(){ const x=document.getElementById('learningModal'); if(x)x.remove(); }

  function render() {
    const root = document.querySelector('#page-learning') || document.querySelector('[data-page="learning"]');
    if (!root) return;
    const oldFilters = root.querySelector('#learningTableWrap');
    if (!oldFilters) return;
    const q = String(root.querySelector('#learningSearch')?.value||'').toLowerCase();
    const subject = root.querySelector('#learningSubject')?.value||'';
    let arr = records().slice();
    arr = arr.filter(r => !q || studentName(r.studentId).toLowerCase().includes(q) || String(r.content||'').toLowerCase().includes(q));
    arr = arr.filter(r => !subject || r.subject===subject);
    const tbody = root.querySelector('#learningTbody');
    if (!tbody) return;
    if (!arr.length) { tbody.innerHTML='<tr><td colspan="8" style="text-align:center;padding:28px">Chưa có dữ liệu học tập.<br><small>Hãy bấm “Ghi nhận kết quả” để bắt đầu.</small></td></tr>'; return; }
    tbody.innerHTML = arr.map((r,i)=>`<tr><td>${i+1}</td><td>${esc(r.date)}</td><td><strong>${esc(studentName(r.studentId))}</strong></td><td>${esc(r.subject)}</td><td>${esc(r.content)}</td><td>${r.score!==''&&r.score!=null?esc(r.score):(esc(r.level)||'—')}</td><td>${esc(r.comment)||'—'}</td><td><button onclick="window.editLearning('${esc(r.id)}')">✏️</button> <button onclick="window.deleteLearning('${esc(r.id)}')">🗑️</button></td></tr>`).join('');
  }
  function deleteLearning(id){ if(!confirm('Bạn có chắc muốn xóa lượt ghi nhận này?'))return; const arr=records().filter(r=>String(r.id)!==String(id)); window.learningRecords=arr;if(window.APP_DATA)window.APP_DATA.learning=arr;saveLocal();render();notify('Đã xóa lượt ghi nhận.'); }

  window.openLearningForm=openForm; window.closeLearningForm=closeForm; window.editLearning=openForm; window.deleteLearning=deleteLearning; window.renderLearning=render;
  document.addEventListener('input', e=>{if(e.target.id==='learningSearch')render();});
  document.addEventListener('change', e=>{if(e.target.id==='learningSubject')render();});
  document.addEventListener('DOMContentLoaded', ()=>setTimeout(render,100));
})();
