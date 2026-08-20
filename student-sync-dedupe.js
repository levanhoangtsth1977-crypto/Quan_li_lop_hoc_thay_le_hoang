/* ============================================================
   STUDENT SYNC DEDUPE 2.1 — SAFE IDENTITY DEDUPE
   - Không hard-code sĩ số 42
   - Không chặn import Excel/CSV
   - Không tạo studentCode mới
   - Không tự xóa dữ liệu Google
   ============================================================ */
(function(){'use strict';
if(window.__STUDENT_SYNC_DEDUPE_210__)return;
window.__STUDENT_SYNC_DEDUPE_210__=true;

const text=v=>String(v??'').trim().replace(/\s+/g,' ');
const key=v=>text(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/Đ/g,'D').toLowerCase().replace(/[^a-z0-9]/g,'');
const dateKey=v=>text(v).replace(/\D/g,'');
function idOf(s){return text(s&&s.id)}
function identity(s){return key(s&&s.name)+'|'+dateKey(s&&s.birthDate)+'|'+key(s&&s.gender)}
function preferred(a,b){
  if(!a)return b;if(!b)return a;
  const ca=/^STU_5C_2026_\d{3,4}$/i.test(idOf(a));
  const cb=/^STU_5C_2026_\d{3,4}$/i.test(idOf(b));
  if(cb&&!ca)return b;if(ca&&!cb)return a;
  return idOf(a)<=idOf(b)?a:b;
}
function dedupeStudents(input){
  const by=new Map(),duplicates=[];
  (Array.isArray(input)?input:[]).filter(s=>s&&idOf(s)&&text(s.name)).forEach(s=>{
    const k=identity(s);if(!k||k==='||')return;
    const old=by.get(k);
    if(!old){by.set(k,s);return;}
    const keep=preferred(old,s),drop=keep===old?s:old;
    by.set(k,keep);
    duplicates.push({keptId:idOf(keep),droppedId:idOf(drop),name:text(keep.name)});
  });
  return {students:Array.from(by.values()).sort((a,b)=>key(a.name).localeCompare(key(b.name),'vi')||idOf(a).localeCompare(idOf(b),'vi',{numeric:true})),duplicates};
}
window.dedupeStudentsForSync=dedupeStudents;
window.getStudentsSafe=function(){
  const source=Array.isArray(window.students)?window.students:[];
  return dedupeStudents(source).students;
};
const wrap=()=>{
  if(typeof window.replaceStudents!=='function'||window.replaceStudents.__SAFE_IDENTITY_WRAPPED__)return;
  const original=window.replaceStudents;
  window.replaceStudents=function(incoming,options){
    const source=Array.isArray(incoming)?incoming:[];
    const d=dedupeStudents(source);
    const opts=options&&typeof options==='object'?options:{};
    const result=original.call(this,d.students,Object.assign({},opts,{dedupeApplied:true,sourceCount:source.length,uniqueCount:d.students.length}));
    if(result&&typeof result==='object')result.dedupe={applied:true,sourceCount:source.length,uniqueCount:d.students.length,removed:d.duplicates.length};
    return result;
  };
  window.replaceStudents.__SAFE_IDENTITY_WRAPPED__=true;
};
let tries=0;const timer=setInterval(()=>{tries++;wrap();if((window.replaceStudents&&window.replaceStudents.__SAFE_IDENTITY_WRAPPED__)||tries>200)clearInterval(timer)},50);
window.__STUDENT_SYNC_DEDUPE_STATUS__={policy:'SAFE_IDENTITY_DEDUPE',identity:'name+birthDate+gender',canonicalPreference:'STU_5C_2026_xxxx',at:new Date().toISOString()};
})();
