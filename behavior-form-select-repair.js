/* BEHAVIOR FORM SELECT REPAIR 1.0
 * Bổ sung lại danh sách học sinh cho form Vi phạm/Khen thưởng.
 * Chỉ xử lý 2 form; không thay router, không thay dữ liệu.
 * Không dùng MutationObserver toàn trang.
 */
(function(){
  'use strict';
  if(window.__LH_BEHAVIOR_FORM_SELECT_REPAIR_10__) return;
  window.__LH_BEHAVIOR_FORM_SELECT_REPAIR_10__=true;

  const clean=v=>String(v??'').trim();
  const esc=v=>clean(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  const students=()=>{
    try{
      if(typeof window.getGoogleStudentRoster==='function'){
        const a=window.getGoogleStudentRoster();
        if(Array.isArray(a)&&a.length) return a;
      }
      if(Array.isArray(window.GOOGLE_SHEETS_STUDENTS)&&window.GOOGLE_SHEETS_STUDENTS.length) return window.GOOGLE_SHEETS_STUDENTS;
      if(typeof window.getStudentsSafe==='function'){
        const a=window.getStudentsSafe();
        if(Array.isArray(a)&&a.length) return a;
      }
      if(Array.isArray(window.students)) return window.students;
    }catch(_){ }
    return [];
  };

  function fill(select, list, current=''){
    if(!select) return false;
    const valid=list.filter(s=>clean(s?.id)&&clean(s?.name));
    if(!valid.length) return false;
    const frag=document.createDocumentFragment();
    frag.appendChild(new Option('Chọn học sinh',''));
    valid.forEach(s=>frag.appendChild(new Option(clean(s.name),clean(s.id))));
    select.replaceChildren(frag);
    if(valid.some(s=>clean(s.id)===clean(current))) select.value=current;
    return true;
  }

  function repair(){
    const list=students();
    ['violationStudent','rewardStudent'].forEach(id=>{
      const el=document.getElementById(id);
      if(el && el.options.length<=1) fill(el,list,el.value);
    });
    document.querySelectorAll('.ev-static-modal #eStudent').forEach(el=>{
      if(el.options.length<=1) fill(el,list,el.value);
    });
  }

  function afterAction(){
    [0,50,150,350,800].forEach(ms=>setTimeout(repair,ms));
  }

  document.addEventListener('click',e=>{
    if(e.target.closest?.('[data-action="add-violation"],[data-action="add-reward"]')) afterAction();
  },true);
  document.addEventListener('focusin',e=>{
    if(e.target?.id==='violationStudent'||e.target?.id==='rewardStudent') repair();
  },true);
  window.addEventListener('google-sheets-data-ready',repair,false);
  window.addEventListener('students-updated',repair,false);
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',repair,{once:true}); else repair();
})();
