/* VI PHẠM — MENU RENDER 2.0
   Chỉ phụ trách danh sách Vi phạm.
   Không thay đổi Data Engine / Điểm danh / Khen thưởng / Thống kê.
*/
(function () {
  'use strict';
  if (window.__LH_VIOLATIONS_RENDER_20__) return;
  window.__LH_VIOLATIONS_RENDER_20__ = true;

  const t = v => String(v ?? '').trim();
  const n = v => t(v).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const esc = v => t(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');

  const translate = {
    preparation:'Chưa chuẩn bị bài', forget_supplies:'Quên đồ dùng', 'forget supplies':'Quên đồ dùng',
    incomplete_task:'Chưa hoàn thành nhiệm vụ', 'incomplete task':'Chưa hoàn thành nhiệm vụ',
    noise:'Mất trật tự', disorder:'Mất trật tự', late:'Đi học muộn',
    group_task:'Chưa thực hiện nhiệm vụ nhóm', 'group task':'Chưa thực hiện nhiệm vụ nhóm',
    violation:'Vi phạm nội quy', 'rule violation':'Vi phạm nội quy', other:'Khác',
    light:'Nhẹ', minor:'Nhẹ', low:'Nhẹ', medium:'Trung bình', major:'Nặng', high:'Nặng', severe:'Nghiêm trọng',
    warning:'Nhắc nhở', attention:'Nhắc nhở', reminder:'Nhắc nhở',
    monitoring:'Đang theo dõi', resolved:'Đã khắc phục',
    counseling:'Tư vấn', support:'Hỗ trợ', parent_contact:'Trao đổi với phụ huynh', 'parent contact':'Trao đổi với phụ huynh'
  };
  const vi = v => translate[n(v)] || t(v);

  function getRecords() {
    try { if (typeof violationRecords !== 'undefined' && Array.isArray(violationRecords)) return violationRecords; } catch(e) {}
    try { if (typeof APP_DATA !== 'undefined' && Array.isArray(APP_DATA.violations)) return APP_DATA.violations; } catch(e) {}
    try { if (typeof getViolationRecords === 'function') { const x = getViolationRecords(); if (Array.isArray(x)) return x; } } catch(e) {}
    const x = [window.violationRecords, window.APP_DATA?.violations, window.appData?.violations, window.classData?.violations];
    return x.find(Array.isArray) || [];
  }

  function getStudents() {
    try { if (typeof students !== 'undefined' && Array.isArray(students)) return students; } catch(e) {}
    try { if (typeof getStudentsSafe === 'function') { const x=getStudentsSafe(); if(Array.isArray(x)) return x; } } catch(e) {}
    return Array.isArray(window.students) ? window.students : [];
  }

  function nameOf(id) {
    const sid=t(id), s=getStudents().find(x=>t(x?.id || x?.studentId)===sid);
    return s ? t(s.name || s.fullName || s.hoTen) : (sid || 'Học sinh');
  }

  function dateOf(r) { return r?.date || r?.ngay || r?.createdAt || r?.created_at || ''; }
  function fmtDate(v) {
    const s=t(v);
    const d=s.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if(d) return `${d[3]}/${d[2]}/${d[1]}`;
    return s;
  }

  function findViolationBody() {
    const page = document.querySelector('#page-violations[data-page-section="violations"]') || document.querySelector('[data-page-section="violations"]');
    if (!page) return null;
    const tables = [...page.querySelectorAll('table')];
    for (const table of tables) {
      const heads = [...table.querySelectorAll('thead th')].map(x=>n(x.textContent));
      if (heads.some(x=>x.includes('ngay')) && heads.some(x=>x.includes('hoc sinh')) && heads.some(x=>x.includes('noi dung'))) {
        return table.tBodies[0] || table.createTBody();
      }
    }
    return tables.length ? (tables[tables.length-1].tBodies[0] || tables[tables.length-1].createTBody()) : null;
  }

  function render() {
    const tbody=findViolationBody();
    if(!tbody) return;
    let rows=getRecords().slice();

    const searchEl=document.querySelector('#page-violations input[type="search"], #page-violations input[placeholder*="Tìm"], #page-violations input[placeholder*="học sinh"]');
    const selects=[...document.querySelectorAll('#page-violations select')];
    const search=n(searchEl?.value);
    const type=n(selects[0]?.value);
    const period=n(selects[1]?.value);

    if(search) rows=rows.filter(r=>n(nameOf(r.studentId || r.student_id || r.idHocSinh || r.studentID)).includes(search) || n(r.type || r.content || r.violationType || r.note).includes(search));
    if(type && !['all','tat ca',''].includes(type)) rows=rows.filter(r=>n(r.type || r.content || r.violationType)===type);

    if(period && !['all','tat ca',''].includes(period)) {
      const now=new Date(), start=new Date(now);
      if(period.includes('week') || period.includes('tuan')) { const day=now.getDay()||7; start.setHours(0,0,0,0); start.setDate(now.getDate()-day+1); rows=rows.filter(r=>new Date(dateOf(r))>=start); }
      else if(period.includes('month') || period.includes('thang')) rows=rows.filter(r=>{const d=new Date(dateOf(r));return d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear();});
    }

    rows.sort((a,b)=>String(dateOf(b)).localeCompare(String(dateOf(a))));
    if(!rows.length) {
      tbody.innerHTML='<tr><td colspan="7"><div class="empty-state"><strong>Chưa có dữ liệu vi phạm</strong><p>Các lượt vi phạm đã ghi nhận sẽ xuất hiện tại đây.</p></div></td></tr>';
      return;
    }

    tbody.innerHTML=rows.map(r=>{
      const id=t(r.id || r.violationId || r.ID);
      const sid=r.studentId || r.student_id || r.idHocSinh || r.studentID;
      const typeText=vi(r.type || r.content || r.violationType || r.note) || 'Khác';
      const level=vi(r.level || r.severity || r.mucDo) || 'Nhẹ';
      const action=vi(r.action || r.measure || r.bienPhap) || 'Chưa ghi';
      const status=vi(r.status || r.trangThai) || 'Đang theo dõi';
      return `<tr><td>${esc(fmtDate(dateOf(r)))}</td><td><strong>${esc(nameOf(sid))}</strong></td><td>${esc(typeText)}</td><td>${esc(level)}</td><td>${esc(action)}</td><td>${esc(status)}</td><td>${id?`<button type="button" class="icon-button danger" data-violation-delete="${esc(id)}" title="Xóa lượt vi phạm"><i class="fa-solid fa-trash"></i></button>`:''}</td></tr>`;
    }).join('');
  }

  document.addEventListener('click', e => {
    const b=e.target.closest?.('[data-violation-delete]');
    if(!b) return;
    e.preventDefault(); e.stopPropagation();
    const id=b.dataset.violationDelete;
    if(!confirm('Xóa đúng lượt vi phạm này?')) return;
    try {
      const fn=window.deleteViolation || window.removeViolation;
      if(typeof fn==='function') Promise.resolve(fn(id)).then(render);
    } catch(err) {}
  }, true);

  const start=()=>{ render(); setTimeout(render,100); setTimeout(render,500); setTimeout(render,1500); };
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start,{once:true}); else start();
  document.addEventListener('click', e=>{ if(e.target.closest('[data-page="violations"]')) setTimeout(render,50); });
  new MutationObserver(()=>{ if(document.querySelector('#page-violations')) render(); }).observe(document.body,{childList:true,subtree:true});
  setInterval(render,1000);
  window.__LH_VIOLATIONS_MENU_API__={refresh:render};
})();