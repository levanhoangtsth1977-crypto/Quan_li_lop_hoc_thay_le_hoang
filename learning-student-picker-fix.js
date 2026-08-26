/* LEARNING STUDENT PICKER FIX 2.0
   - Chỉ sửa ô Học sinh trong các form Học tập/Nhận xét.
   - Đọc danh sách trực tiếp từ Data Engine hiện hành.
   - Hỗ trợ nhiều schema tên học sinh.
   - Không thay đổi môn, mức đạt, nhận xét, nội dung hoặc ghi chú.
*/
(function(){
'use strict';
if(window.__LH_LEARNING_STUDENT_PICKER_FIX_20__)return;
window.__LH_LEARNING_STUDENT_PICKER_FIX_20__=true;

const text=v=>String(v??'').trim();
const norm=v=>text(v).replace(/\s+/g,' ').toLocaleLowerCase('vi');
const NAME_KEYS=['name','studentName','fullName','full_name','hoTen','ho_ten','hoten','displayName','student_full_name','Họ và tên','Họ tên','HỌ VÀ TÊN'];
const ID_KEYS=['id','studentId','studentID','studentCode','code','maHocSinh','ma_hoc_sinh','Mã học sinh','Mã HS'];

function getStudents(){
  const sources=[];
  try{
    if(typeof window.loadClassData==='function') window.loadClassData();
  }catch(e){}
  try{
    if(typeof window.syncAppDataReferences==='function') window.syncAppDataReferences();
  }catch(e){}
  try{if(typeof window.getStudentsSafe==='function') sources.push(window.getStudentsSafe())}catch(e){}
  if(Array.isArray(window.students)) sources.push(window.students);
  const sheet=window.GOOGLE_SHEET_DATA?.tabs?.HOC_SINH;
  if(Array.isArray(sheet)) sources.push(sheet);
  for(const arr of sources){
    if(!Array.isArray(arr)||!arr.length)continue;
    const out=[];
    const seen=new Set();
    arr.forEach((s,i)=>{
      if(!s||typeof s!=='object')return;
      let name='';
      for(const k of NAME_KEYS){if(text(s[k])){name=text(s[k]);break}}
      if(!name){
        const values=Object.values(s).filter(v=>typeof v==='string').map(text).filter(Boolean);
        name=values.find(v=>v.length>3 && !/^\d{1,4}$/.test(v) && !/^HS\d+$/i.test(v))||'';
      }
      if(!name)return;
      let id='';
      for(const k of ID_KEYS){if(text(s[k])){id=text(s[k]);break}}
      id=id||`LH5C-${String(i+1).padStart(3,'0')}`;
      const key=id+'|'+norm(name);
      if(seen.has(key))return;
      seen.add(key);out.push({id,name});
    });
    if(out.length)return out;
  }
  return [];
}

function isStudentSelect(sel){
  if(!(sel instanceof HTMLSelectElement))return false;
  const hay=[sel.id,sel.name,sel.getAttribute('aria-label'),sel.getAttribute('data-field'),sel.getAttribute('data-student-field'),sel.options?.[0]?.textContent].map(norm).join(' ');
  if(hay.includes('học sinh')||hay.includes('student'))return true;
  return [...sel.options].some(o=>norm(o.textContent).includes('chọn học sinh'));
}

function findSelects(){
  return [...document.querySelectorAll('select')].filter(sel=>{
    if(isStudentSelect(sel))return true;
    const parent=sel.closest('.modal,form,.form-grid,.form-group,.page-section,section,div');
    if(!parent)return false;
    const labelText=norm(parent.innerText||parent.textContent);
    const hasStudent=labelText.includes('học sinh');
    const hasOther=labelText.includes('môn học')||labelText.includes('mức đạt')||labelText.includes('mức đánh giá');
    return hasStudent&&!hasOther;
  });
}

function fill(sel,students){
  const current=text(sel.value);
  const old=[...sel.options].find(o=>norm(o.textContent).includes('chọn học sinh'));
  const placeholderValue=old?old.value:'';
  const frag=document.createDocumentFragment();
  const ph=document.createElement('option');ph.value=placeholderValue;ph.textContent='Chọn học sinh';frag.appendChild(ph);
  students.forEach(s=>{const o=document.createElement('option');o.value=s.id;o.textContent=s.name;frag.appendChild(o)});
  sel.replaceChildren(frag);
  if(current&&students.some(s=>s.id===current))sel.value=current;else sel.value=placeholderValue;
  sel.dataset.lhStudentPickerReady='1';
}

function apply(){
  const students=getStudents();
  if(students.length<1)return false;
  const sels=findSelects();
  if(!sels.length)return false;
  sels.forEach(s=>fill(s,students));
  return true;
}

function retry(){
  apply();
  [250,600,1200,2000].forEach(ms=>setTimeout(apply,ms));
}

['google-sheets-data-ready','data-changed','records-updated','students-updated'].forEach(ev=>window.addEventListener(ev,retry));
['DOMContentLoaded','load'].forEach(ev=>window.addEventListener(ev,retry,{once:true}));

let obs=null;
function start(){
  try{
    obs=new MutationObserver(()=>{
      const needs=findSelects().some(s=>s.options.length<=1);
      if(needs)retry();
    });
    obs.observe(document.body,{childList:true,subtree:true});
  }catch(e){}
  retry();
  setInterval(apply,2000);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();