/* ATTENDANCE STATUS 6.0 — touch-safe custom status control */
(function(){
  'use strict';
  if(window.__LH_ATTENDANCE_FINAL_60__) return;
  window.__LH_ATTENDANCE_FINAL_60__=true;

  const STATUS=[
    ['present','Có mặt'],
    ['excused','Có phép'],
    ['absent','Không phép']
  ];
  const text=v=>String(v==null?'':v).trim();
  const byId=id=>document.getElementById(id);

  function today(){
    const d=new Date();
    return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  }
  function getDate(){return byId('attendanceDate')?.value||today();}

  function students(){
    try{if(typeof window.getStudentsSafe==='function'){const a=window.getStudentsSafe();if(Array.isArray(a))return a.slice();}}catch(e){console.error('[ATTENDANCE 6.0] students',e)}
    if(Array.isArray(window.students))return window.students.slice();
    if(Array.isArray(window.classData?.students))return window.classData.students.slice();
    if(Array.isArray(window.appData?.students))return window.appData.students.slice();
    return [];
  }
  function records(){
    try{if(typeof window.getAttendanceRecords==='function'){const a=window.getAttendanceRecords();if(Array.isArray(a))return a;}}catch(e){console.error('[ATTENDANCE 6.0] records',e)}
    return [];
  }

  function labelOf(v){return STATUS.find(x=>x[0]===v)?.[1]||'Có mặt';}
  function normalize(v){return STATUS.some(x=>x[0]===v)?v:'present';}

  function summary(){
    let p=0,e=0,a=0;
    document.querySelectorAll('#attendanceTableBody [data-attendance-status]').forEach(el=>{
      const v=normalize(el.dataset.value);
      if(v==='present')p++; else if(v==='excused')e++; else a++;
    });
    [['attendancePresentCount',p],['attendanceExcusedCount',e],['attendanceAbsentCount',a],['attendancePresent',p],['attendanceExcused',e],['attendanceAbsent',a]].forEach(([id,v])=>{
      const el=byId(id);if(el)el.textContent=String(v);
    });
  }

  let menu=null;
  let activeControl=null;

  function ensureMenu(){
    if(menu)return menu;
    menu=document.createElement('div');
    menu.id='lhAttendanceStatusMenu';
    menu.setAttribute('role','menu');
    menu.hidden=true;
    document.body.appendChild(menu);
    return menu;
  }

  function closeMenu(){
    if(!menu)return;
    menu.hidden=true;
    activeControl=null;
  }

  function positionMenu(control){
    const m=ensureMenu();
    const r=control.getBoundingClientRect();
    const width=Math.max(170,Math.round(r.width));
    m.style.width=width+'px';
    const margin=8;
    let left=Math.min(Math.max(margin,r.left),window.innerWidth-width-margin);
    let top=r.bottom+6;
    m.style.left=left+'px';
    m.style.top='0px';
    m.hidden=false;
    const h=m.offsetHeight||150;
    if(top+h>window.innerHeight-margin)top=Math.max(margin,r.top-h-6);
    m.style.top=top+'px';
  }

  function openMenu(control){
    if(activeControl===control&&!menu?.hidden){closeMenu();return;}
    activeControl=control;
    const current=normalize(control.dataset.value);
    const m=ensureMenu();
    m.innerHTML=STATUS.map(([v,label])=>`<button type="button" role="menuitem" class="lh-att-status-option${v===current?' is-current':''}" data-value="${v}">${label}</button>`).join('');
    positionMenu(control);
  }

  function setStatus(control,value){
    const v=normalize(value);
    control.dataset.value=v;
    const label=control.querySelector('[data-status-label]');
    if(label)label.textContent=labelOf(v);
    control.setAttribute('aria-expanded','false');
    control.setAttribute('aria-label','Trạng thái: '+labelOf(v));
    summary();
    closeMenu();
  }

  function makeControl(id,current){
    const wrap=document.createElement('button');
    wrap.type='button';
    wrap.className='attendance-status-button';
    wrap.dataset.attendanceStatus='1';
    wrap.dataset.studentId=text(id);
    wrap.dataset.value=normalize(current);
    wrap.setAttribute('aria-haspopup','menu');
    wrap.setAttribute('aria-expanded','false');
    wrap.setAttribute('aria-label','Trạng thái: '+labelOf(normalize(current)));
    wrap.innerHTML='<span data-status-label></span><span class="lh-att-status-chevron">▾</span>';
    wrap.querySelector('[data-status-label]').textContent=labelOf(normalize(current));
    return wrap;
  }

  function currentRecord(id,rs,d){
    return rs.find(x=>text(x.studentId)===id&&text(x.date).slice(0,10)===d)||null;
  }

  function render(){
    const page=byId('page-attendance'),body=byId('attendanceTableBody'),dateEl=byId('attendanceDate');
    if(!page||!body||!dateEl)return false;
    const d=getDate(); if(!dateEl.value)dateEl.value=d;
    const list=students(),rs=records(),f=document.createDocumentFragment();
    list.forEach((st,i)=>{
      const id=text(st.id||st.studentId||st.studentCode);
      const r=currentRecord(id,rs,d);
      const cur=normalize(text(r?.status));
      const tr=document.createElement('tr');
      const no=document.createElement('td');no.textContent=String(i+1);
      const name=document.createElement('td');const strong=document.createElement('strong');strong.textContent=text(st.name||st.studentName||id);name.appendChild(strong);
      const status=document.createElement('td');status.appendChild(makeControl(id,cur));
      const note=document.createElement('td');const input=document.createElement('input');input.type='text';input.className='attendance-note';input.dataset.studentId=id;input.value=text(r?.note);input.placeholder='Ghi chú';note.appendChild(input);
      tr.append(no,name,status,note);f.appendChild(tr);
    });
    body.replaceChildren(f);
    summary();
    return true;
  }

  function convertNativeSelects(){
    document.querySelectorAll('#attendanceTableBody select.attendance-status').forEach(sel=>{
      if(sel.parentElement?.querySelector(':scope > .attendance-status-button')){
        sel.remove();
        return;
      }
      const id=text(sel.dataset.studentId||sel.value);
      const control=makeControl(id,normalize(sel.value));
      sel.replaceWith(control);
    });
    summary();
  }

  function save(){
    const d=getDate();
    const nodes=[...document.querySelectorAll('#attendanceTableBody [data-attendance-status]')];
    if(!nodes.length){window.showToast?.('Chưa có danh sách học sinh để điểm danh.','warning');return;}
    let saved=0,failed=0;
    nodes.forEach(control=>{
      const id=text(control.dataset.studentId),status=normalize(control.dataset.value);
      const note=document.querySelector('#attendanceTableBody .attendance-note[data-student-id="'+CSS.escape(id)+'"]');
      try{
        const fn=window.saveAttendanceRecord;
        if(typeof fn!=='function'){failed++;return;}
        const result=fn(id,d,status,note?.value||'');
        if(result===true||(result&&result.success!==false))saved++; else failed++;
      }catch(e){failed++;console.error('[ATTENDANCE 6.0] save',e);}
    });
    summary();
    window.showToast?.(failed?`Đã lưu ${saved}/${nodes.length} học sinh; ${failed} bản ghi lỗi.`:`Đã lưu điểm danh ${saved} học sinh.`,failed?'warning':'success');
  }

  function navigate(){
    if(typeof window.navigateToPage==='function'){try{window.navigateToPage('attendance');}catch(e){console.error('[ATTENDANCE 6.0] navigate',e);}}
    else{
      document.querySelectorAll('.page-section').forEach(x=>x.classList.remove('active'));
      byId('page-attendance')?.classList.add('active');
      const title=byId('pageTitle');if(title)title.textContent='Điểm danh';
    }
    requestAnimationFrame(render);
  }

  function css(){
    if(byId('lhAttendance60Css'))return;
    const s=document.createElement('style');s.id='lhAttendance60Css';
    s.textContent=`
#page-attendance .attendance-table{position:relative;z-index:1;overflow:visible}
#page-attendance .attendance-table td:nth-child(3){position:relative;z-index:4;min-width:160px;overflow:visible}
#page-attendance .attendance-status-button{display:flex;align-items:center;justify-content:space-between;gap:10px;width:100%;min-height:44px;padding:9px 12px;border:1px solid #d7dee8;border-radius:9px;background:#fff;color:#172033;font:inherit;font-weight:600;text-align:left;cursor:pointer;pointer-events:auto;touch-action:manipulation;position:relative;z-index:5;-webkit-user-select:none;user-select:none}
#page-attendance .attendance-status-button:active{transform:scale(.99)}
#page-attendance .lh-att-status-chevron{flex:0 0 auto;opacity:.7;font-size:12px}
#lhAttendanceStatusMenu{position:fixed;z-index:2147483647;display:flex;flex-direction:column;gap:4px;padding:6px;border:1px solid #d7dee8;border-radius:10px;background:#fff;box-shadow:0 18px 40px rgba(15,23,42,.2);max-height:45vh;overflow:auto}
#lhAttendanceStatusMenu[hidden]{display:none!important}
#lhAttendanceStatusMenu .lh-att-status-option{display:block;width:100%;min-height:46px;padding:10px 12px;border:0;border-radius:8px;background:#fff;color:#172033;font:inherit;font-weight:600;text-align:left;cursor:pointer;touch-action:manipulation}
#lhAttendanceStatusMenu .lh-att-status-option:hover,#lhAttendanceStatusMenu .lh-att-status-option:focus{background:#f1f5f9;outline:none}
#lhAttendanceStatusMenu .lh-att-status-option.is-current{font-weight:800;background:#eff6ff}
`;
    document.head.appendChild(s);
  }

  function bind(){
    if(document.__lhAttendance60Bound)return;
    document.__lhAttendance60Bound=true;

    document.addEventListener('click',e=>{
      const option=e.target.closest?.('#lhAttendanceStatusMenu .lh-att-status-option');
      if(option&&activeControl){e.preventDefault();e.stopPropagation();setStatus(activeControl,option.dataset.value);return;}
      const control=e.target.closest?.('#attendanceTableBody .attendance-status-button');
      if(control){e.preventDefault();e.stopPropagation();openMenu(control);return;}
      if(menu&&!e.target.closest('#lhAttendanceStatusMenu'))closeMenu();
    },false);

    document.addEventListener('keydown',e=>{
      if(e.key==='Escape')closeMenu();
      const control=e.target.closest?.('#attendanceTableBody .attendance-status-button');
      if(control&&(e.key==='Enter'||e.key===' ')){e.preventDefault();openMenu(control);}
    },false);

    document.addEventListener('scroll',()=>{if(activeControl&&!menu?.hidden)positionMenu(activeControl)},true);
    window.addEventListener('resize',()=>{if(activeControl&&!menu?.hidden)positionMenu(activeControl)});

    const saveBtn=byId('saveAttendance');
    if(saveBtn){saveBtn.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();save();});}
    const dateEl=byId('attendanceDate');
    if(dateEl)dateEl.addEventListener('change',()=>render());

    const observer=new MutationObserver(()=>{
      if(document.__lhAttendance60Rendering)return;
      if(byId('attendanceTableBody'))convertNativeSelects();
    });
    const body=byId('attendanceTableBody');
    if(body)observer.observe(body,{childList:true,subtree:true});
  }

  css();
  bind();
  window.LHAttendanceFinal={render,save,summary,closeMenu};
  window.renderAttendance=render;
  function boot(){setTimeout(()=>{render();convertNativeSelects();},80);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
