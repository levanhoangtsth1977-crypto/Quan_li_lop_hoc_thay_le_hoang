/* VI PHẠM — MENU RENDER 3.0
   Chỉ phụ trách danh sách Vi phạm.
   Không thay đổi Data Engine / Điểm danh / Khen thưởng / Thống kê.
*/
(function () {
  'use strict';
  if (window.__LH_VIOLATIONS_RENDER_30__) return;
  window.__LH_VIOLATIONS_RENDER_30__ = true;

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

  function looksLikeViolation(x) {
    return x && typeof x === 'object' && !Array.isArray(x) &&
      (x.studentId || x.student_id || x.idHocSinh || x.studentID) &&
      (x.type || x.content || x.violationType || x.note || x.noiDung) &&
      (x.date || x.ngay || x.createdAt || x.created_at);
  }

  function scan(value, depth = 0, seen = new Set()) {
    if (depth > 6 || value == null) return [];
    if (typeof value === 'object') {
      if (seen.has(value)) return [];
      seen.add(value);
    }
    if (Array.isArray(value)) {
      if (value.some(looksLikeViolation)) return value.filter(looksLikeViolation);
      let out=[];
      for(const x of value) out=out.concat(scan(x, depth+1, seen));
      return out;
    }
    if (typeof value === 'object') {
      let out=[];
      for(const k of Object.keys(value)) {
        const v=value[k];
        if (['violations','violationRecords','VI_PHAM','vi_pham','events','records','data'].includes(k)) out=out.concat(scan(v, depth+1, seen));
        else if (depth < 5 && typeof v === 'object') out=out.concat(scan(v, depth+1, seen));
      }
      return out;
    }
    return [];
  }

  function getRecords() {
    const sources=[];
    try { if (typeof violationRecords !== 'undefined' && Array.isArray(violationRecords)) sources.push(violationRecords); } catch(e) {}
    try { if (typeof APP_DATA !== 'undefined') sources.push(APP_DATA); } catch(e) {}
    try { if (typeof getViolationRecords === 'function') { const x=getViolationRecords(); if(Array.isArray(x)) sources.push(x); } } catch(e) {}
    sources.push(window.violationRecords, window.APP_DATA, window.appData, window.classData);

    let rows=[];
    for(const s of sources) rows=rows.concat(scan(s));

    // Nguồn dự phòng quan trọng: dữ liệu đã lưu trong LocalStorage/SessionStorage.
    for(const storage of [window.localStorage, window.sessionStorage]) {
      try {
        for(let i=0;i<storage.length;i++) {
          const raw=storage.getItem(storage.key(i));
          if(!raw) continue;
          try { rows=rows.concat(scan(JSON.parse(raw))); } catch(e) {}
        }
      } catch(e) {}
    }

    const map=new Map();
    rows.forEach(r=>{
      const id=t(r.id || r.violationId || r.ID || `${r.studentId||r.student_id}|${r.date||r.ngay}|${r.type||r.content}`);
      if(id && !map.has(id)) map.set(id,r);
    });
    return [...map.values()];
  }

  function getStudents() {
    try { if (typeof students !== 'undefined' && Array.isArray(students)) return students; } catch(e) {}
    try { if (typeof getStudentsSafe === 'function') { const x=getStudentsSafe(); if(Array.isArray(x)) return x; } } catch(e) {}
    let out=[];
    for(const storage of [window.localStorage, window.sessionStorage]) {
      try {
        for(let i=0;i<storage.length;i++) {
          try {
            const x=JSON.parse(storage.getItem(storage.key(i))||'null');
            const a=Array.isArray(x?.students)?x.students:[];
            if(a.length) out=out.concat(a);
          } catch(e) {}
        }
      } catch(e) {}
    }
    return out.length ? out : (Array.isArray(window.students) ? window.students : []);
  }

  function nameOf(id) {
    const sid=t(id), s=getStudents().find(x=>t(x?.id || x?.studentId)===sid);
    return s ? t(s.name || s.fullName || s.hoTen) : (sid || 'Học sinh');
  }

  function dateOf(r) { return r?.date || r?.ngay || r?.createdAt || r?.created_at || ''; }
  function fmtDate(v) {
    const s=t(v), d=s.match(/^(\d{4})-(\d{2})-(\d{2})/);
    return d ? `${d[3]}/${d[2]}/${d[1]}` : s;
  }

  function findBody() {
    const page=document.querySelector('#page-violations') || document.querySelector('[data-page-section="violations"]');
    if(!page) return null;
    const tables=[...page.querySelectorAll('table')];
    for(const table of tables) {
      const h=[...table.querySelectorAll('thead th')].map(x=>n(x.textContent));
      if(h.some(x=>x.includes('ngay')) && h.some(x=>x.includes('hoc sinh')) && h.some(x=>x.includes('noi dung'))) return table.tBodies[0] || table.createTBody();
    }
    const table=tables[0];
    return table ? (table.tBodies[0] || table.createTBody()) : null;
  }

  function render() {
    const tbody=findBody();
    if(!tbody) return;
    let rows=getRecords();

    const page=tbody.closest('#page-violations') || document.querySelector('#page-violations');
    const selects=page ? [...page.querySelectorAll('select')] : [];
    const searchEl=page?.querySelector('input[type="search"]');
    const search=n(searchEl?.value);
    const type=n(selects[0]?.value);
    const period=n(selects[1]?.value);

    if(search) rows=rows.filter(r=>n(nameOf(r.studentId||r.student_id||r.idHocSinh||r.studentID)).includes(search) || n(r.type||r.content||r.violationType||r.note||r.noiDung).includes(search));
    if(type && !['all','tat ca',''].includes(type)) rows=rows.filter(r=>n(r.type||r.content||r.violationType||r.noiDung)===type);
    if(period && !['all','tat ca',''].includes(period)) {
      const now=new Date();
      rows=rows.filter(r=>{
        const d=new Date(dateOf(r)); if(Number.isNaN(d.getTime())) return false;
        if(period.includes('week')||period.includes('tuan')) { const start=new Date(now); const day=now.getDay()||7; start.setHours(0,0,0,0); start.setDate(now.getDate()-day+1); return d>=start; }
        if(period.includes('month')||period.includes('thang')) return d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear();
        return true;
      });
    }

    rows.sort((a,b)=>String(dateOf(b)).localeCompare(String(dateOf(a))));
    if(!rows.length) {
      tbody.innerHTML='<tr><td colspan="7"><div class="empty-state"><strong>Chưa có dữ liệu vi phạm</strong><p>Các lượt vi phạm đã ghi nhận sẽ xuất hiện tại đây.</p></div></td></tr>';
      return;
    }

    tbody.innerHTML=rows.map(r=>{
      const id=t(r.id||r.violationId||r.ID);
      const sid=r.studentId||r.student_id||r.idHocSinh||r.studentID;
      const typeText=vi(r.type||r.content||r.violationType||r.noiDung||r.note)||'Khác';
      const level=vi(r.level||r.severity||r.mucDo)||'Nhẹ';
      const action=vi(r.action||r.measure||r.bienPhap)||'Chưa ghi';
      const status=vi(r.status||r.trangThai)||'Đang theo dõi';
      return `<tr><td>${esc(fmtDate(dateOf(r)))}</td><td><strong>${esc(nameOf(sid))}</strong></td><td>${esc(typeText)}</td><td>${esc(level)}</td><td>${esc(action)}</td><td>${esc(status)}</td><td>${id?`<button type="button" class="icon-button danger" data-violation-delete="${esc(id)}" title="Xóa lượt vi phạm"><i class="fa-solid fa-trash"></i></button>`:''}</td></tr>`;
    }).join('');
  }

  document.addEventListener('click',e=>{
    const b=e.target.closest?.('[data-violation-delete]');
    if(!b) return;
    e.preventDefault(); e.stopPropagation();
    const id=b.dataset.violationDelete;
    if(!confirm('Xóa đúng lượt vi phạm này?')) return;
    try { const fn=window.deleteViolation||window.removeViolation; if(typeof fn==='function') Promise.resolve(fn(id)).then(render); } catch(e) {}
  },true);

  const start=()=>{render();[100,500,1500,3000].forEach(ms=>setTimeout(render,ms));};
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start,{once:true}); else start();
  document.addEventListener('click',e=>{if(e.target.closest('[data-page="violations"]')) setTimeout(render,80);});
  document.addEventListener('input',e=>{if(e.target.closest('#page-violations')) setTimeout(render,0);});
  document.addEventListener('change',e=>{if(e.target.closest('#page-violations')) setTimeout(render,0);});
  new MutationObserver(()=>{if(document.querySelector('#page-violations')) render();}).observe(document.body,{childList:true,subtree:true});
  setInterval(render,1500);
  window.__LH_VIOLATIONS_MENU_API__={refresh:render};
})();