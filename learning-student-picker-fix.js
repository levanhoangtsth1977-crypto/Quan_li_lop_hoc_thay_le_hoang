/* LEARNING STUDENT PICKER FIX 1.0
   - Chỉ sửa ô Học sinh trong form Ghi nhận kết quả học tập.
   - Không thay đổi các trường khác.
   - Nguồn học sinh: Data Engine -> GOOGLE_SHEET_DATA -> window.students.
*/
(function(){
'use strict';
if(window.__LH_LEARNING_STUDENT_PICKER_FIX_10__) return;
window.__LH_LEARNING_STUDENT_PICKER_FIX_10__=true;

const text=v=>String(v??'').trim();
const norm=v=>text(v).replace(/\s+/g,' ').toLocaleLowerCase('vi');

function getStudents(){
  const sources=[];
  try{
    if(typeof window.getStudentsSafe==='function') sources.push(window.getStudentsSafe());
  }catch(e){}
  if(Array.isArray(window.students)) sources.push(window.students);
  const sheet=window.GOOGLE_SHEET_DATA?.tabs?.HOC_SINH;
  if(Array.isArray(sheet)) sources.push(sheet);
  for(const a of sources){
    if(Array.isArray(a) && a.length) return a.filter(Boolean).map((s,i)=>({
      id:text(s.id||s.studentId||s.studentCode||s.code)||`LH5C-${String(i+1).padStart(3,'0')}`,
      name:text(s.name||s.studentName||s.hoTen||s['Họ và tên'])||`Học sinh ${i+1}`
    })).filter(x=>x.name);
  }
  return [];
}

function isStudentSelect(sel){
  if(!(sel instanceof HTMLSelectElement)) return false;
  const opts=[...sel.options].map(o=>norm(o.textContent));
  return opts.some(x=>x.includes('chọn học sinh')) || opts.some(x=>x==='học sinh');
}

function labelFor(sel){
  if(sel.id){const l=document.querySelector(`label[for="${CSS.escape(sel.id)}"]`);if(l)return norm(l.textContent)}
  const parent=sel.closest('div,section,form');
  if(parent){
    const labels=[...parent.querySelectorAll('label')].map(x=>norm(x.textContent));
    if(labels.some(x=>x==='học sinh' || x.includes('học sinh'))) return 'học sinh';
  }
  const prev=sel.previousElementSibling;
  if(prev && norm(prev.textContent).includes('học sinh')) return 'học sinh';
  return '';
}

function findSelects(){
  return [...document.querySelectorAll('select')].filter(sel=>{
    const exact=labelFor(sel);
    return isStudentSelect(sel) || exact==='học sinh' || exact.includes('học sinh');
  });
}

function fill(sel,students){
  const current=text(sel.value);
  const placeholder=[...sel.options].find(o=>norm(o.textContent).includes('chọn học sinh'));
  const placeholderValue=placeholder ? placeholder.value : '';
  const fragment=document.createDocumentFragment();
  const ph=document.createElement('option');
  ph.value=placeholderValue;
  ph.textContent='Chọn học sinh';
  fragment.appendChild(ph);
  for(const s of students){
    const o=document.createElement('option');
    o.value=s.id;
    o.textContent=s.name;
    fragment.appendChild(o);
  }
  sel.replaceChildren(fragment);
  if(current && students.some(s=>s.id===current)) sel.value=current; else sel.value=placeholderValue;
  sel.dispatchEvent(new Event('change',{bubbles:true}));
}

function apply(){
  const students=getStudents();
  if(!students.length) return false;
  const sels=findSelects();
  if(!sels.length) return false;
  sels.forEach(sel=>fill(sel,students));
  return true;
}

function retry(){
  apply();
  setTimeout(apply,300);
  setTimeout(apply,800);
  setTimeout(apply,1500);
}

window.addEventListener('google-sheets-data-ready',retry);
window.addEventListener('data-changed',retry);
window.addEventListener('records-updated',retry);
window.addEventListener('DOMContentLoaded',retry,{once:true});
window.addEventListener('load',retry,{once:true});

const obs=new MutationObserver(()=>{ if(findSelects().some(s=>[...s.options].length<=1)) apply(); });
function start(){
  try{obs.observe(document.body,{childList:true,subtree:true});}catch(e){}
  retry();
  setInterval(apply,3000);
}
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start,{once:true}); else start();
})();