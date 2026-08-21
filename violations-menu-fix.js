/* VI PHẠM - MENU RIÊNG
   Chỉ render #page-violations / #violationTableBody.
   Không đụng Điểm danh, Khen thưởng, Thống kê hay CSDL.
*/
(function(){
'use strict';
if(window.__LH_VIOLATIONS_MENU_FINAL__) return;
window.__LH_VIOLATIONS_MENU_FINAL__=true;

const S=v=>String(v??'').trim();
const N=v=>S(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const E=v=>S(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
const MAP={preparation:'Chưa chuẩn bị bài',assignment:'Chưa hoàn thành nhiệm vụ','school-supplies':'Quên đồ dùng',discipline:'Mất trật tự',late:'Đi học muộn','group-work':'Chưa thực hiện nhiệm vụ nhóm',rules:'Vi phạm nội quy',other:'Khác',light:'Nhẹ',minor:'Nhẹ',low:'Nhẹ',medium:'Trung bình',major:'Nặng',high:'Nặng',severe:'Nghiêm trọng',warning:'Nhắc nhở',reminder:'Nhắc nhở',monitoring:'Đang theo dõi',resolved:'Đã khắc phục',counseling:'Tư vấn',support:'Hỗ trợ','parent-contact':'Trao đổi với phụ huynh'};
const VI=v=>MAP[N(v)]||S(v);

function records(){
  try{if(typeof violationRecords!=='undefined' && Array.isArray(violationRecords)) return violationRecords.slice();}catch(e){}
  try{if(typeof APP_DATA!=='undefined' && Array.isArray(APP_DATA.violations)) return APP_DATA.violations.slice();}catch(e){}
  try{if(typeof getViolationRecords==='function'){const x=getViolationRecords();if(Array.isArray(x))return x.slice();}}catch(e){}
  if(Array.isArray(window.violationRecords)) return window.violationRecords.slice();
  if(Array.isArray(window.APP_DATA?.violations)) return window.APP_DATA.violations.slice();
  return [];
}
function studentsList(){
  try{if(typeof students!=='undefined'&&Array.isArray(students))return students;}catch(e){}
  try{if(typeof APP_DATA!=='undefined'&&Array.isArray(APP_DATA.students))return APP_DATA.students;}catch(e){}
  return Array.isArray(window.students)?window.students:[];
}
function studentName(r){
  const id=S(r.studentId??r.student_id??r.idHocSinh??r.studentID??r.student);
  const a=studentsList();
  const x=a.find(s=>S(s?.id??s?.studentId)===id);
  return x?S(x.name??x.fullName??x.hoTen):S(r.studentName??r.hocSinh??r.name??id??'Học sinh');
}
function dateValue(r){return r?.date??r?.ngay??r?.createdAt??r?.created_at??r?.timestamp??'';}
function dateText(v){const s=S(v),m=s.match(/^(\d{4})-(\d{2})-(\d{2})/);return m?`${m[3]}/${m[2]}/${m[1]}`:s;}
function body(){return document.querySelector('#page-violations #violationTableBody')||document.querySelector('#violationTableBody');}
function render(){
  const b=body(); if(!b)return;
  let rows=records();
  const page=document.querySelector('#page-violations');
  const search=N(page?.querySelector('#violationSearch')?.value);
  const type=N(page?.querySelector('#violationTypeFilter')?.value);
  const period=N(page?.querySelector('#violationPeriodFilter')?.value);
  if(search) rows=rows.filter(r=>N(studentName(r)).includes(search)||N(r.type??r.content??r.violationType??r.noiDung??r.note).includes(search));
  if(type&&type!=='all') rows=rows.filter(r=>N(r.type??r.content??r.violationType??r.noiDung)===type);
  if(period&&period!=='all'){
    const now=new Date(); rows=rows.filter(r=>{const d=new Date(dateValue(r));if(isNaN(d))return false;if(period==='week'){const x=new Date(now);const day=x.getDay()||7;x.setHours(0,0,0,0);x.setDate(x.getDate()-day+1);return d>=x;}if(period==='month')return d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear();return true;});
  }
  rows.sort((a,b)=>String(dateValue(b)).localeCompare(String(dateValue(a))));
  if(!rows.length){b.innerHTML='<tr><td colspan="7"><div class="empty-state"><strong>Chưa có dữ liệu vi phạm</strong><p>Các lượt vi phạm đã ghi nhận sẽ xuất hiện tại đây.</p></div></td></tr>';return;}
  b.innerHTML=rows.map(r=>{
    const id=S(r.id??r.violationId??r.ID);
    const typeText=VI(r.type??r.content??r.violationType??r.noiDung??r.note)||'Khác';
    const level=VI(r.level??r.severity??r.mucDo)||'Nhẹ';
    const action=VI(r.action??r.measure??r.bienPhap)||'Chưa ghi';
    const status=VI(r.status??r.trangThai)||'Đang theo dõi';
    return `<tr><td>${E(dateText(dateValue(r)))}</td><td><strong>${E(studentName(r))}</strong></td><td>${E(typeText)}</td><td>${E(level)}</td><td>${E(action)}</td><td>${E(status)}</td><td>${id?`<button type="button" class="icon-button danger" data-violation-delete="${E(id)}" title="Xóa lượt vi phạm"><i class="fa-solid fa-trash"></i></button>`:''}</td></tr>`;
  }).join('');
}
document.addEventListener('click',e=>{const x=e.target.closest?.('[data-violation-delete]');if(!x)return;e.preventDefault();e.stopPropagation();const id=x.dataset.violationDelete;if(!confirm('Xóa đúng lượt vi phạm này?'))return;try{const f=window.deleteViolation||window.removeViolation;if(typeof f==='function')Promise.resolve(f(id)).then(render);}catch(err){}},true);
document.addEventListener('input',e=>{if(e.target.closest?.('#page-violations'))render();});
document.addEventListener('change',e=>{if(e.target.closest?.('#page-violations'))render();});
document.addEventListener('click',e=>{if(e.target.closest?.('[data-page="violations"]'))setTimeout(render,50);});
const start=()=>{render();[100,500,1000,2000].forEach(x=>setTimeout(render,x));};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
setInterval(render,1000);
window.__LH_VIOLATIONS_MENU_API__={refresh:render};
})();