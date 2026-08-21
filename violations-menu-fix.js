/* VIOLATIONS MENU FIX 1.1 — CHỈ SỬA MODULE VI PHẠM */
(function(){
'use strict';
if(window.__LH_VIOLATIONS_MENU_FIX_11__)return;
window.__LH_VIOLATIONS_MENU_FIX_11__=true;
const text=v=>String(v??'').trim(),norm=v=>text(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase(),esc=v=>text(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
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
  'attention':'Nhắc nhở','medium':'Trung bình','serious':'Nghiêm trọng','major':'Nặng','high':'Nặng','severe':'Nghiêm trọng',
  'monitoring':'Đang theo dõi','resolved':'Đã khắc phục',
  'warning':'Nhắc nhở','reminder':'Nhắc nhở','counseling':'Tư vấn','support':'Hỗ trợ','parent contact':'Trao đổi với phụ huynh','parent_contact':'Trao đổi với phụ huynh','other measure':'Biện pháp khác'
};
function vi(v){const s=text(v);if(!s)return '';const k=norm(s);if(VI[k])return VI[k];return s}
function iso(v){const s=text(v);if(/^\d{4}-\d{2}-\d{2}/.test(s))return s.slice(0,10);const d=s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);return d?`${d[3]}-${String(d[2]).padStart(2,'0')}-${String(d[1]).padStart(2,'0')}`:''}
function fmt(v){const s=iso(v);return /^\d{4}-\d{2}-\d{2}$/.test(s)?`${s.slice(8,10)}/${s.slice(5,7)}/${s.slice(0,4)}`:text(v)}
function students(){try{if(typeof window.getStudentsSafe==='function'){const a=window.getStudentsSafe();if(Array.isArray(a))return a}}catch(_){}return Array.isArray(window.students)?window.students:[]}
function studentName(id){const sid=text(id);try{if(typeof window.getStudentById==='function'){const s=window.getStudentById(sid);if(s?.name)return s.name}}catch(_){}return students().find(s=>text(s.id)===sid)?.name||'Học sinh'}
function records(){try{if(typeof window.getViolationRecords==='function'){const a=window.getViolationRecords();if(Array.isArray(a))return a}}catch(_){}return Array.isArray(window.violationRecords)?window.violationRecords.slice():[]}
function val(...ids){for(const id of ids){const e=document.getElementById(id);if(e)return text(e.value)}return ''}
function timeMatch(date,filter){if(!filter||norm(filter)==='all')return true;const d=iso(date),now=new Date(),x=new Date(`${d}T00:00:00`);if(!d||Number.isNaN(x.getTime()))return true;if(norm(filter)==='week'){const day=now.getDay()||7;const start=new Date(now);start.setHours(0,0,0,0);start.setDate(now.getDate()-day+1);return x>=start&&x<=now}if(norm(filter)==='month')return x.getMonth()===now.getMonth()&&x.getFullYear()===now.getFullYear();if(norm(filter)==='semester'){const m=now.getMonth()+1;return now.getFullYear()===x.getFullYear()&&((m>=1&&m<=5)?x.getMonth()+1<=5:x.getMonth()+1>=6)}return true}
function render(){const page=document.getElementById('page-violations'),tbody=document.getElementById('violationTableBody');if(!page||!tbody)return;let list=records();const search=norm(val('violationSearch','violationStudentSearch'));const type=val('violationTypeFilter','violationContentFilter');const time=val('violationTimeFilter','violationPeriodFilter');if(search)list=list.filter(r=>norm(studentName(r.studentId)).includes(search)||norm(r.type).includes(search)||norm(r.note).includes(search)||norm(r.description).includes(search));if(type&&norm(type)!=='all')list=list.filter(r=>norm(r.type)===norm(type));list=list.filter(r=>timeMatch(r.date,time));list.sort((a,b)=>String(b.date||'').localeCompare(String(a.date||'')));if(!list.length){tbody.innerHTML='<tr><td colspan="7"><div class="empty-state"><strong>Chưa có dữ liệu vi phạm</strong><p>Các lượt vi phạm đã ghi nhận sẽ xuất hiện tại đây.</p></div></td></tr>';return}tbody.innerHTML=list.map(r=>`<tr><td>${esc(fmt(r.date))}</td><td><strong>${esc(studentName(r.studentId))}</strong></td><td>${esc(vi(r.type)||'Khác')}</td><td>${esc(vi(r.level)||'Nhẹ')}</td><td>${esc(vi(r.action)||'Chưa ghi')}</td><td>${esc(vi(r.status)||'Đang theo dõi')}</td><td><button type="button" class="icon-button danger" title="Xóa lượt vi phạm" data-violation-delete="${esc(r.id)}"><i class="fa-solid fa-trash"></i></button></td></tr>`).join('')}
function bind(){const page=document.getElementById('page-violations');if(!page)return;['violationSearch','violationStudentSearch','violationTypeFilter','violationContentFilter','violationTimeFilter','violationPeriodFilter'].forEach(id=>{const e=document.getElementById(id);if(e&&!e.dataset.lhViolationBound){e.dataset.lhViolationBound='1';e.addEventListener(e.tagName==='INPUT'?'input':'change',render)}});render()}
const obs=new MutationObserver(()=>{if(document.getElementById('page-violations'))bind()});obs.observe(document.body,{childList:true,subtree:true});
window.__LH_VIOLATIONS_MENU_API__={refresh:render};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();
})();