/* LEARNING + COMMENTS STUDENT PICKER v1.0
   Chỉ bổ sung danh sách học sinh cho các modal Học tập/Nhận xét.
   Không đụng bảng Điểm danh, Vi phạm, Khen thưởng.
   Không thay đổi môn học, mức đạt, nội dung hay ghi chú.
*/
(function(){
  'use strict';
  if(window.__LH_LEARNING_COMMENTS_STUDENT_PICKER_V10__) return;
  window.__LH_LEARNING_COMMENTS_STUDENT_PICKER_V10__ = true;

  const norm=v=>String(v??'').trim().replace(/\s+/g,' ').toLocaleLowerCase('vi');
  const text=v=>String(v??'').trim();

  function students(){
    try{
      if(typeof window.getStudentsSafe==='function'){
        const a=window.getStudentsSafe();
        if(Array.isArray(a)&&a.length) return a;
      }
    }catch(_){ }
    if(Array.isArray(window.students)&&window.students.length) return window.students;
    if(Array.isArray(window.classData?.students)&&window.classData.students.length) return window.classData.students;
    return [];
  }

  function studentOptions(){
    return students().map((s,i)=>{
      const id=text(s?.id||s?.studentId||s?.studentCode||s?.code)||`STU_${i+1}`;
      const name=text(s?.name||s?.studentName||s?.fullName||s?.hoTen||s?.['Họ và tên']);
      return {id,name};
    }).filter(x=>x.name);
  }

  function isTargetModal(modal){
    const t=norm(modal.innerText||modal.textContent);
    if(!t) return false;
    const learning=t.includes('ghi nhận kết quả học tập') || t.includes('ghi nhận kết quả');
    const comments=t.includes('thêm nhận xét') || t.includes('nhận xét');
    const attendance=t.includes('điểm danh') && t.includes('trạng thái');
    return !attendance && (learning || comments);
  }

  function isStudentSelect(sel){
    if(!(sel instanceof HTMLSelectElement)) return false;
    const own=norm([
      sel.id,sel.name,sel.getAttribute('aria-label'),
      sel.getAttribute('data-field'),sel.getAttribute('data-student-field')
    ].join(' '));
    if(own.includes('student')||own.includes('học sinh')) return true;
    const ph=[...sel.options].find(o=>norm(o.textContent).includes('chọn học sinh'));
    return !!ph;
  }

  function findTargetSelect(modal){
    return [...modal.querySelectorAll('select')].find(isStudentSelect)||
      [...modal.querySelectorAll('select')].find(sel=>{
        const parent=sel.closest('.form-group,.form-field,.form-grid,div,label')||sel.parentElement;
        const t=norm(parent?.innerText||parent?.textContent);
        return t.includes('học sinh');
      })||null;
  }

  function fill(sel){
    const list=studentOptions();
    if(!list.length) return false;
    const current=text(sel.value);
    const oldPlaceholder=[...sel.options].find(o=>norm(o.textContent).includes('chọn học sinh'));
    const placeholderValue=oldPlaceholder?oldPlaceholder.value:'';
    const frag=document.createDocumentFragment();
    const ph=document.createElement('option');
    ph.value=placeholderValue;
    ph.textContent='Chọn học sinh';
    frag.appendChild(ph);
    for(const s of list){
      const o=document.createElement('option');
      o.value=s.id;
      o.textContent=s.name;
      frag.appendChild(o);
    }
    const same=current&&list.some(s=>s.id===current);
    sel.replaceChildren(frag);
    sel.value=same?current:placeholderValue;
    sel.dataset.lhStudentPickerReady='1';
    return true;
  }

  function apply(){
    const modals=[...document.querySelectorAll('.modal')].filter(m=>!m.hidden&&isTargetModal(m));
    let changed=false;
    for(const modal of modals){
      const sel=findTargetSelect(modal);
      if(sel){
        const before=sel.options.length;
        if(before<=1 || !sel.dataset.lhStudentPickerReady){
          changed=fill(sel)||changed;
        }
      }
    }
    return changed;
  }

  function kick(){
    apply();
    [100,300,700,1200].forEach(ms=>setTimeout(apply,ms));
  }

  ['click','input'].forEach(ev=>document.addEventListener(ev,function(e){
    const modal=e.target?.closest?.('.modal');
    if(modal) kick();
  },true));
  window.addEventListener('google-sheets-data-ready',kick);
  window.addEventListener('data-changed',kick);
  window.addEventListener('students-updated',kick);
  window.addEventListener('load',kick,{once:true});

  const mo=new MutationObserver(()=>{
    const modal=[...document.querySelectorAll('.modal')].some(m=>!m.hidden&&isTargetModal(m));
    if(modal) requestAnimationFrame(apply);
  });
  function start(){
    try{mo.observe(document.body,{childList:true,subtree:true});}catch(_){ }
    kick();
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
