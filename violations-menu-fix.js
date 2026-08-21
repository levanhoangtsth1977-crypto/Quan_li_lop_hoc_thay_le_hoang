/* VIOLATIONS MENU FIX 1.5 — CHỈ SỬA BẢNG DỮ LIỆU VI PHẠM */
(function(){
'use strict';
if(window.__LH_VIOLATIONS_MENU_FIX_15__)return;
window.__LH_VIOLATIONS_MENU_FIX_15__=true;

const text=v=>String(v??'').trim();
const norm=v=>text(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const esc=v=>text(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');

const VI={
'forget supplies':'Quên đồ dùng','forget_supply':'Quên đồ dùng','quên đồ dùng':'Quên đồ dùng',
'incomplete task':'Chưa hoàn thành nhiệm vụ','incomplete_task':'Chưa hoàn thành nhiệm vụ','chưa hoàn thành nhiệm vụ':'Chưa hoàn thành nhiệm vụ',
'preparation':'Chưa chuẩn bị bài','not prepared':'Chưa chuẩn bị bài','chưa chuẩn bị bài':'Chưa chuẩn bị bài',
'noise':'Mất trật tự','disorder':'Mất trật tự','mất trật tự':'Mất trật tự',
'late':'Đi học muộn','đi học muộn':'Đi học muộn',
'group task':'Chưa thực hiện nhiệm vụ nhóm','group_task':'Chưa thực hiện nhiệm vụ nhóm','chưa thực hiện nhiệm vụ nhóm':'Chưa thực hiện nhiệm vụ nhóm',
'rule violation':'Vi phạm nội quy','violation':'Vi phạm nội quy','vi phạm nội quy':'Vi phạm nội quy',
'other':'Khác','khác':'Khác',
'light':'Nhẹ','minor':'Nhẹ','low':'Nhẹ','nhẹ':'Nhẹ',
'attention':'Nhắc nhở','warning':'Nhắc nhở','reminder':'Nhắc nhở',
'medium':'Trung bình','serious':'Nghiêm trọng','major':'Nặng','high':'Nặng','severe':'Nghiêm trọng',
'monitoring':'Đang theo dõi','resolved':'Đã khắc phục',
'counseling':'Tư vấn','support':'Hỗ trợ','parent contact':'Trao đổi với phụ huynh','parent_contact':'Trao đổi với phụ huynh','other measure':'Biện pháp khác'
};
function vi(v){const s=text(v),k=norm(v);return VI[k]||s}
function iso(v){const s=text(v);if(/^\d{4}-\d{2}-\d{2}/.test(s))return s.slice(0,10);const d=s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);return d?`${d[3]}-${String(d[2]).padStart(2,'0')}-${String(d[1]).padStart(2,'0')}`:''}
function fmt(v){const s=iso(v);return /^\d{4}-\d{2}-\d{2}$/.test(s)?`${s.slice(8,10)}/${s.slice(5,7)}/${s.slice(0,4)}`:text(v)}

/* DATA.JS dùng let/const ở global lexical scope, không phải window.*.
   Vì vậy phải đọc trực tiếp các biến global nếu chúng đã được nạp. */
function directRecords(){
  try{
    if(typeof violationRecords!=='undefined' && Array.isArray(violationRecords)) return violationRecords.slice();
  }catch(_){}
  try{
    if(typeof APP_DATA!=='undefined' && Array.isArray(APP_DATA.violations)) return APP_DATA.violations.slice();
  }catch(_){}
  return [];
}
function directStudents(){
  try{
    if(typeof students!=='undefined' && Array.isArray(students)) return students;
  }catch(_){}
  return [];
}
function records(){
  const direct=directRecords();
  if(direct.length) return direct;
  const candidates=[window.violationRecords,window.classData?.violations,window.classData?.violationRecords,window.appData?.violations,window.appData?.violationRecords];
  for(const a of candidates) if(Array.isArray(a)) return a.slice();
  try{if(typeof getViolationRecords==='function'){const a=getViolationRecords();if(Array.isArray(a))return a.slice()}}catch(_){}
  return [];
}
function studentsList(){
  const direct=directStudents();
  if(direct.length)return direct;
  const candidates=[window.students,window.classData?.students,window.appData?.students];
  for(const a of candidates)if(Array.isArray(a))return a;
  try{if(typeof getStudentsSafe==='function'){const a=getStudentsSafe();if(Array.isArray(a))return a}}catch(_){}
  return [];
}
function studentName(id){
  const sid=text(id),s=studentsList().find(x=>text(x?.id||x?.studentId)===sid);
  return s?text(s.name||s.fullName||s.hoTen)||'Học sinh':'Học sinh';
}

/* Không phụ thuộc id page-violations. Chỉ lấy tbody của bảng Vi phạm hiện tại. */
function getBody(){
  const selectors=[
    '#violationTableBody',
    '#violationsTableBody',
    '[data-violation-table] tbody',
    '#page-violations table tbody',
    '#violations table tbody',
    'section[data-page="violations"] table tbody',
    'table tbody'
  ];
  for(const selector of selectors){
    const e=document.querySelector(selector);
    if(e)return e;
  }
  return null;
}
function val(...ids){for(const id of ids){const e=document.getElementById(id);if(e)return text(e.value)}return ''}
function timeMatch(date,filter){if(!filter||norm(filter)==='all')return true;const d=iso(date),now=new Date(),x=new Date(`${d}T00:00:00`);if(!d||Number.isNaN(x.getTime()))return true;if(norm(filter)==='week'){const day=now.getDay()||7;const start=new Date(now);start.setHours(0,0,0,0);start.setDate(now.getDate()-day+1);return x>=start&&x<=now}if(norm(filter)==='month')return x.getMonth()===now.getMonth()&&x.getFullYear()===now.getFullYear();return true}

function render(){
  const tbody=getBody();
  if(!tbody)return;
  let list=records();
  const search=norm(val('violationSearch','violationStudentSearch'));
  const type=val('violationTypeFilter','violationContentFilter');
  const time=val('violationTimeFilter','violationPeriodFilter');
  if(search)list=list.filter(r=>norm(studentName(r.studentId||r.student_id||r.idHocSinh||r.studentID)).includes(search)||norm(r.type||r.content||r.violationType||r.note).includes(search));
  if(type&&norm(type)!=='all')list=list.filter(r=>norm(r.type||r.content||r.violationType)===norm(type));
  list=list.filter(r=>timeMatch(r.date||r.ngay||r.createdAt,time));
  list.sort((a,b)=>String(b.date||b.ngay||b.createdAt||'').localeCompare(String(a.date||a.ngay||a.createdAt||'')));
  if(!list.length){
    tbody.innerHTML='<tr><td colspan="7"><div class="empty-state"><strong>Chưa có dữ liệu vi phạm</strong><p>Các lượt vi phạm đã ghi nhận sẽ xuất hiện tại đây.</p></div></td></tr>';
    return;
  }
  tbody.innerHTML=list.map(r=>{
    const id=r.id||r.violationId||r.ID;
    const sid=r.studentId||r.student_id||r.idHocSinh||r.studentID;
    return `<tr><td>${esc(fmt(r.date||r.ngay||r.createdAt))}</td><td><strong>${esc(studentName(sid))}</strong></td><td>${esc(vi(r.type||r.content||r.violationType||r.note)||'Khác')}</td><td>${esc(vi(r.level||r.severity||r.mucDo)||'Nhẹ')}</td><td>${esc(vi(r.action||r.measure||r.bienPhap)||'Chưa ghi')}</td><td>${esc(vi(r.status||r.trangThai)||'Đang theo dõi')}</td><td>${id?`<button type="button" class="icon-button danger" title="Xóa lượt vi phạm" data-violation-delete="${esc(id)}"><i class="fa-solid fa-trash"></i></button>`:''}</td></tr>`;
  }).join('');
}
function bind(){
  ['violationSearch','violationStudentSearch','violationTypeFilter','violationContentFilter','violationTimeFilter','violationPeriodFilter'].forEach(id=>{
    const e=document.getElementById(id);
    if(e&&!e.dataset.lhViolationBound){e.dataset.lhViolationBound='1';e.addEventListener(e.tagName==='INPUT'?'input':'change',render)}
  });
  render();
}
document.addEventListener('click',e=>{
  const b=e.target.closest?.('[data-violation-delete]');
  if(!b)return;
  e.preventDefault();e.stopPropagation();
  const id=b.dataset.violationDelete;
  if(!confirm('Xóa đúng lượt vi phạm này?'))return;
  const f=window.deleteViolation||window.removeViolation;
  if(typeof f==='function')Promise.resolve(f(id)).then(()=>render());
},true);

const obs=new MutationObserver(()=>bind());
if(document.body)obs.observe(document.body,{childList:true,subtree:true});
setInterval(()=>render(),1000);
window.__LH_VIOLATIONS_MENU_API__={refresh:render};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();
})();