/* STUDENT GENDER SUMMARY 1.0
 * Scope: Học sinh page only.
 * Does not modify router, data engine, attendance, violations, rewards or SMAS.
 */
(function(){
  'use strict';
  if(window.__LH_STUDENT_GENDER_SUMMARY_10__) return;
  window.__LH_STUDENT_GENDER_SUMMARY_10__ = true;

  const mountId='lhStudentGenderSummary';
  const normalize=v=>String(v??'').trim().toLocaleLowerCase('vi').replace(/\s+/g,' ');

  function getStudents(){
    try{
      if(typeof window.getStudentsSafe==='function'){
        const x=window.getStudentsSafe();
        if(Array.isArray(x)) return x;
      }
    }catch(e){}
    if(Array.isArray(window.students)) return window.students;
    if(Array.isArray(window.classData?.students)) return window.classData.students;
    if(Array.isArray(window.appData?.students)) return window.appData.students;
    return [];
  }

  function genderOf(student){
    const raw=student?.gender ?? student?.gioiTinh ?? student?.['Giới tính'] ?? student?.sex ?? '';
    const g=normalize(raw);
    if(g==='nam'||g==='male'||g==='m') return 'nam';
    if(g==='nữ'||g==='nu'||g==='female'||g==='f') return 'nu';
    return '';
  }

  function ensureStyle(){
    if(document.getElementById('lhStudentGenderSummaryStyle')) return;
    const s=document.createElement('style');
    s.id='lhStudentGenderSummaryStyle';
    s.textContent=`#${mountId}{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin:14px 0 4px;padding:14px;border:1px solid #dbe3ef;border-radius:14px;background:#fff;box-shadow:0 2px 8px rgba(15,23,42,.04)}#${mountId} .lh-gs-item{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 12px;border-radius:10px;background:#f8fafc}#${mountId} .lh-gs-label{font-size:13px;color:#64748b;font-weight:600}#${mountId} .lh-gs-value{font-size:20px;font-weight:800;color:#0f172a}@media(max-width:600px){#${mountId}{grid-template-columns:1fr;gap:8px;padding:10px}#${mountId} .lh-gs-item{padding:9px 11px}}`;
    document.head.appendChild(s);
  }

  function render(){
    const page=document.getElementById('page-students');
    if(!page) return;
    const table=page.querySelector('#studentTable');
    if(!table) return;
    ensureStyle();
    let host=document.getElementById(mountId);
    if(!host){
      host=document.createElement('section');
      host.id=mountId;
      host.setAttribute('aria-label','Tổng hợp học sinh theo giới tính');
      table.parentNode?.insertBefore(host,table.nextSibling);
    }
    const students=getStudents();
    let nam=0,nu=0,khac=0;
    students.forEach(s=>{const g=genderOf(s);if(g==='nam')nam++;else if(g==='nu')nu++;else khac++;});
    const total=students.length || table.querySelectorAll('tbody tr').length;
    host.innerHTML=`<div class="lh-gs-item"><span class="lh-gs-label">Tổng số học sinh</span><strong class="lh-gs-value">${total}</strong></div><div class="lh-gs-item"><span class="lh-gs-label">👦 Nam</span><strong class="lh-gs-value">${nam}</strong></div><div class="lh-gs-item"><span class="lh-gs-label">👧 Nữ</span><strong class="lh-gs-value">${nu}</strong></div>`;
    if(khac>0){
      host.title=`Chưa xác định giới tính: ${khac} học sinh`;
    }else{
      host.removeAttribute('title');
    }
  }

  function boot(){
    render();
    window.addEventListener('load',render,{once:true});
    window.addEventListener('pageshow',render);
    window.addEventListener('data-updated',render);
    window.addEventListener('students-updated',render);
    const page=document.getElementById('page-students');
    const body=page?.querySelector('#studentTableBody');
    if(body){
      const obs=new MutationObserver(()=>requestAnimationFrame(render));
      obs.observe(body,{childList:true,subtree:true});
    }
    [300,800,1600].forEach(ms=>setTimeout(render,ms));
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
