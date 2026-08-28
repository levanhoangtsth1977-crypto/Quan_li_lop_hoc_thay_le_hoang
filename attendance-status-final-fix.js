/* ATTENDANCE STATUS FINAL GUARD 1.1 */
(function(){
'use strict';
if(window.__LH_ATTENDANCE_STATUS_GUARD_11__)return;
window.__LH_ATTENDANCE_STATUS_GUARD_11__=true;
var S=[['present','Có mặt'],['excused','Có phép'],['absent','Không phép']];
var norm=function(v){return String(v==null?'':v).trim().replace(/\s+/g,' ')};
var ok=function(v){return S.some(function(x){return x[0]===String(v)})};
function getStudents(){try{if(typeof window.getStudentsSafe==='function'){var a=window.getStudentsSafe();if(Array.isArray(a))return a}}catch(e){}return Array.isArray(window.students)?window.students:[]}
function idOf(row){var x=row.querySelector('[data-student-id]');if(x&&x.dataset.studentId)return String(x.dataset.studentId);var name=row.cells[1]?norm(row.cells[1].textContent):'';var a=getStudents();var s=a.find(function(v){return norm(v.name)===name});return s?String(s.id||''):''}
function make(v,id){var s=document.createElement('select');s.className='attendance-status';if(id)s.dataset.studentId=id;S.forEach(function(x){var o=document.createElement('option');o.value=x[0];o.textContent=x[1];o.selected=x[0]===v;s.appendChild(o)});return s}
function repair(){var tb=document.getElementById('attendanceTableBody');if(!tb)return;Array.from(tb.querySelectorAll('tr')).forEach(function(r){if(!r.cells||r.cells.length<3)return;var c=r.cells[2],q=c.querySelector('select'),id=(q&&q.dataset.studentId)||idOf(r),v=(q&&ok(q.value))?q.value:'present',bad=!q||!q.options||q.options.length!==3||!Array.from(q.options).every(function(o){return ok(o.value)})||!id;if(bad)c.replaceChildren(make(v,id))});if(typeof window.updateAttendanceSummary==='function'){try{window.updateAttendanceSummary()}catch(e){}}}
function boot(){repair();var tb=document.getElementById('attendanceTableBody');if(tb&&!tb.dataset.lhStatusGuard){tb.dataset.lhStatusGuard='1';new MutationObserver(function(){clearTimeout(window.__lhStatusTimer);window.__lhStatusTimer=setTimeout(repair,0)}).observe(tb,{childList:true,subtree:true})}[0,100,300,700,1500,3000].forEach(function(ms){setTimeout(repair,ms)})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();