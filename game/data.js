/* ============================================================
   TRIỆU PHÚ HỌC ĐƯỜNG — SHARED DATA ADAPTER 2.0
   Nguồn học sinh duy nhất: Apps Script / Google Sheets.
   Không tạo roster thứ hai, không tự phục hồi Master JSON.
   ============================================================ */
(function(){'use strict';
var API_URL='https://script.google.com/macros/s/AKfycbynklm7SobnkcEZKfAUGdMIBugA4lQ2kA3yOThHVjNoiJzCK7veuwO2vE1tR1QKI-nkIQ/exec',studentsCache=[];
function text(v){return String(v??'').trim().replace(/\s+/g,' ')}
function key(v){return text(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/Đ/g,'D').toLowerCase().replace(/[^a-z0-9]/g,'')}
function identity(s){return key(s.name)+'|'+text(s.birthDate).replace(/\D/g,'')+'|'+key(s.gender)}
function preferred(a,b){if(!a)return b;if(!b)return a;var ca=/^STU_5C_2026_\d{3,4}$/i.test(text(a.id)),cb=/^STU_5C_2026_\d{3,4}$/i.test(text(b.id));if(cb&&!ca)return b;if(ca&&!cb)return a;return text(a.id)<=text(b.id)?a:b}
function dedupe(list){var by=new Map();(Array.isArray(list)?list:[]).filter(function(s){return s&&text(s.id||s.studentId||s.studentCode)&&text(s.name||s.studentName)}).forEach(function(s){var n={id:text(s.id||s.studentId||s.studentCode),studentCode:text(s.studentCode||s.id||s.studentId),name:text(s.name||s.studentName),gender:text(s.gender),birthDate:text(s.birthDate||s.dateOfBirth),status:text(s.status)||'active',parentName:text(s.parentName),phone:text(s.phone),address:text(s.address),note:text(s.note),shareEnabled:s.shareEnabled!==false,createdAt:text(s.createdAt),updatedAt:text(s.updatedAt)};var k=identity(n),old=by.get(k);by.set(k,old?preferred(old,n):n)});return Array.from(by.values()).sort(function(a,b){return key(a.name).localeCompare(key(b.name),'vi')||text(a.id).localeCompare(text(b.id),'vi',{numeric:true})})}
window.GameData={
 getStudents:function(){var list=Array.isArray(window.students)&&window.students.length?window.students:studentsCache;return dedupe(list).filter(function(s){return s.status!=='inactive'&&s.status!==false})},
 loadStudents:function(){return fetch(API_URL+'?action=get_students&t='+Date.now(),{cache:'no-store',redirect:'follow'}).then(function(r){if(!r.ok)throw new Error('Google API HTTP '+r.status);return r.json()}).then(function(data){if(!data||data.ok!==true)throw new Error(data&&data.error||'Google API không trả dữ liệu');var list=dedupe(data.students||[]);if(!list.length)throw new Error('Google chưa có học sinh hợp lệ');studentsCache=list;window.students=list.slice();try{window.dispatchEvent(new CustomEvent('gameRosterReady',{detail:{count:list.length,source:'google-sheets'}}))}catch(_){}return list})},
 saveResult:function(result){var keyName='QL_GAME_RESULTS_2026_2027',rows=[];try{rows=JSON.parse(localStorage.getItem(keyName)||'[]')}catch(_){}rows.push(result);localStorage.setItem(keyName,JSON.stringify(rows));return true},
 getResults:function(){try{return JSON.parse(localStorage.getItem('QL_GAME_RESULTS_2026_2027')||'[]')}catch(_){return []}}
};
function boot(){if(window.GameData.getStudents().length)return;window.GameData.loadStudents().catch(function(err){console.warn('GameData Google:',err)})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
