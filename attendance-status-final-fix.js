/* ATTENDANCE STATUS 6.1 — touch-safe custom status control */
(function(){
  'use strict';
  if(window.__LH_ATTENDANCE_FINAL_61__) return;
  window.__LH_ATTENDANCE_FINAL_61__=true;
  const STATUS=[['present','Có mặt'],['excused','Có phép'],['absent','Không phép']];
  const text=v=>String(v==null?'':v).trim();
  const byId=id=>document.getElementById(id);
  const today=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
  const getDate=()=>byId('attendanceDate')?.value||today();
  function students(){
    try{if(typeof window.getStudentsSafe==='function'){const a=window.getStudentsSafe();if(Array.isArray(a))return a.slice();}}catch(e){}
    if(Array.isArray(window.students))return window.students.slice();
    if(Array.isArray(window.classData?.students))return window.classData.students.slice();
    if(Array.isArray(window.appData?.students))return window.appData.students.slice();
    return [];
  }
  function records(){
    try{if(typeof window.getAttendanceRecords==='function'){const a=window.getAttendanceRecords();if(Array.isArray(a))return a;}}catch(e){}
    return [];
  }
  const normalize=v=>STATUS.some(x=>x[0]===v)?v:'present';
  const label=v=>STATUS.find(x=>x[0]===v)?.[1]||'Có mặt';
  function summary(){
    let p=0,e=0,a=0;
    document.querySelectorAll('#attendanceTableBody [data-attendance-status]').forEach(x=>{
      const v=normalize(x.dataset.value);if(v==='present')p++;else if(v==='excused')e++;else a++;
    });
    [['attendancePresentCount',p],['attendanceExcusedCount',e],['attendanceAbsentCount',a],['attendancePresent',p],['attendanceExcused',e],['attendanceAbsent',a]].forEach(([id,v])=>{const el=byId(id);if(el)el.textContent=String(v)});
  }
  let menu=null,active=null;
  function ensureMenu(){
    if(menu)return menu;
    menu=document.createElement('div');menu.id='lhAttendanceStatusMenu';menu.hidden=true;menu.setAttribute('role','menu');
    document.body.appendChild(menu);return menu;
  }
  function closeMenu(){if(menu){menu.hidden=true;menu.innerHTML='';}active=null;}
  function position(){
    if(!active||!menu||menu.hidden)return;
    const r=active.getBoundingClientRect(),w=Math.max(180,Math.round(r.width));
    menu.style.width=w+'px';menu.style.left=Math.max(8,Math.min(r.left,window.innerWidth-w-8))+'px';menu.style.top='0px';menu.hidden=false;
    const h=menu.offsetHeight||160;const below=r.bottom+8;const top=below+h<=window.innerHeight-8?below:Math.max(8,r.top-h-8);menu.style.top=top+'px';
  }
  function openMenu(control){
    const m=ensureMenu();active=control;
    const cur=normalize(control.dataset.value);
    m.innerHTML=STATUS.map(([v,t])=>`<button type="button" class="lh-att-status-option${v===cur?' is-current':''}" data-value="${v}" role="menuitem"><span>${t}</span>${v===cur?'<b aria-hidden="true">✓</b>':''}</button>`).join('');
    position();
    control.setAttribute('aria-expanded','true');
  }
  function setStatus(v){
    if(!active)return;
    const c=active;c.dataset.value=normalize(v);
    const l=c.querySelector('[data-status-label]');if(l)l.textContent=label(c.dataset.value);
    c.setAttribute('aria-label','Trạng thái: '+label(c.dataset.value));c.setAttribute('aria-expanded','false');summary();closeMenu();
  }
  function makeControl(id,current){
    const b=document.createElement('button');b.type='button';b.className='attendance-status-button';b.dataset.attendanceStatus='1';b.dataset.studentId=text(id);b.dataset.value=normalize(current);
    b.setAttribute('aria-haspopup','menu');b.setAttribute('aria-expanded','false');b.setAttribute('aria-label','Trạng thái: '+label(b.dataset.value));
    b.innerHTML='<span data-status-label></span><span class="lh-att-status-chevron" aria-hidden="true">▾</span>';
    b.querySelector('[data-status-label]').textContent=label(b.dataset.value);return b;
  }
  function render(){
    const page=byId('page-attendance'),body=byId('attendanceTableBody'),date=byId('attendanceDate');if(!page||!body||!date)return false;
    const d=getDate();if(!date.value)date.value=d;const list=students(),rs=records(),f=document.createDocumentFragment();
    list.forEach((st,i)=>{
      const id=text(st.id||st.studentId||st.studentCode),r=rs.find(x=>text(x.studentId)===id&&text(x.date).slice(0,10)===d),cur=normalize(text(r?.status));
      const tr=document.createElement('tr');const no=document.createElement('td');no.textContent=String(i+1);const name=document.createElement('td');const strong=document.createElement('strong');strong.textContent=text(st.name||st.studentName||id);name.appendChild(strong);
      const status=document.createElement('td');status.appendChild(makeControl(id,cur));const note=document.createElement('td');const input=document.createElement('input');input.type='text';input.className='attendance-note';input.dataset.studentId=id;input.value=text(r?.note);input.placeholder='Ghi chú';note.appendChild(input);
      tr.append(no,name,status,note);f.appendChild(tr);
    });
    body.replaceChildren(f);summary();return true;
  }
  function convert(){
    document.querySelectorAll('#attendanceTableBody select.attendance-status').forEach(sel=>{
      const id=text(sel.dataset.studentId||sel.closest('tr')?.querySelector('.attendance-status')?.value||'');
      const control=makeControl(id,normalize(sel.value));sel.replaceWith(control);
    });
    summary();
  }
  function save(){
    const d=getDate(),nodes=[...document.querySelectorAll('#attendanceTableBody [data-attendance-status]')];
    if(!nodes.length){window.showToast?.('Chưa có danh sách học sinh để điểm danh.','warning');return;}
    let saved=0,failed=0;
    nodes.forEach(c=>{const id=text(c.dataset.studentId),note=document.querySelector('#attendanceTableBody .attendance-note[data-student-id="'+CSS.escape(id)+'"]');try{const fn=window.saveAttendanceRecord;if(typeof fn!=='function'){failed++;return}const r=fn(id,d,normalize(c.dataset.value),note?.value||'');if(r===true||(r&&r.success!==false))saved++;else failed++;}catch(e){failed++;}});
    summary();window.showToast?.(failed?`Đã lưu ${saved}/${nodes.length} học sinh; ${failed} bản ghi lỗi.`:`Đã lưu điểm danh ${saved} học sinh.`,failed?'warning':'success');
  }
  function navigate(){if(typeof window.navigateToPage==='function'){try{window.navigateToPage('attendance');}catch(e){}}requestAnimationFrame(render);}
  function css(){
    if(byId('lhAttendance61Css'))return;const s=document.createElement('style');s.id='lhAttendance61Css';s.textContent=`#page-attendance .attendance-table{position:relative;z-index:1;overflow:visible!important}#page-attendance .attendance-table td:nth-child(3){position:relative;z-index:100;min-width:180px;overflow:visible!important}#page-attendance .attendance-status-button{display:flex!important;width:100%;min-height:48px;align-items:center;justify-content:space-between;gap:10px;padding:10px 14px;border:1px solid #cbd5e1;border-radius:10px;background:#fff;color:#172033;font:inherit;font-weight:700;text-align:left;cursor:pointer;pointer-events:auto!important;touch-action:manipulation!important;position:relative;z-index:101;-webkit-user-select:none;user-select:none}#lhAttendanceStatusMenu{position:fixed!important;z-index:2147483647!important;display:flex;flex-direction:column;gap:5px;padding:6px;border:1px solid #cbd5e1;border-radius:12px;background:#fff;box-shadow:0 20px 50px rgba(15,23,42,.28);max-height:60vh;overflow:auto;pointer-events:auto!important}#lhAttendanceStatusMenu[hidden]{display:none!important}#lhAttendanceStatusMenu .lh-att-status-option{display:flex;width:100%;min-height:50px;align-items:center;justify-content:space-between;padding:11px 14px;border:0;border-radius:9px;background:#fff;color:#172033;font:inherit;font-weight:700;text-align:left;cursor:pointer;touch-action:manipulation!important;pointer-events:auto!important}#lhAttendanceStatusMenu .lh-att-status-option.is-current{background:#eff6ff}#lhAttendanceStatusMenu .lh-att-status-option:active{background:#dbeafe}`;document.head.appendChild(s);
  }
  function bind(){
    if(document.__lhAttendance61Bound)return;document.__lhAttendance61Bound=true;
    document.addEventListener('click',e=>{
      const opt=e.target.closest?.('#lhAttendanceStatusMenu .lh-att-status-option');if(opt){e.preventDefault();e.stopPropagation();setStatus(opt.dataset.value);return;}
      const control=e.target.closest?.('#attendanceTableBody .attendance-status-button');if(control){e.preventDefault();e.stopPropagation();openMenu(control);return;}
      if(menu&&!e.target.closest('#lhAttendanceStatusMenu'))closeMenu();
    },false);
    document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMenu();if(active&&e.target===active&&(e.key==='Enter'||e.key===' ')){e.preventDefault();openMenu(active);}},false);
    document.addEventListener('scroll',position,true);window.addEventListener('resize',position);
    const sb=byId('saveAttendance');if(sb)sb.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();save();});
    const de=byId('attendanceDate');if(de)de.addEventListener('change',render);
    const observer=new MutationObserver(()=>{if(document.__lhAttendance61Rendering)return;if(byId('attendanceTableBody'))convert();});
    const body=byId('attendanceTableBody');if(body)observer.observe(body,{childList:true,subtree:true});
  }
  css();bind();window.LHAttendanceFinal={render,save,summary,closeMenu};window.renderAttendance=render;
  function boot(){setTimeout(()=>{window.__lhAttendance61Rendering=true;render();window.__lhAttendance61Rendering=false;convert();},120);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
