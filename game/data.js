/* Triệu Phú Học Đường — shared-data adapter. Không tạo CSDL học sinh thứ hai. */
(function(){'use strict';
var roster=[];
window.GameData={
 getStudents:function(){var list=Array.isArray(window.students)&&window.students.length?window.students:roster;return list.filter(function(s){return s&&s.status!==false;});},
 loadStudents:function(){return fetch('../DANH_SACH_HOC_SINH_5C_2026_2027.json?v=2026.08.20',{cache:'no-store'}).then(function(r){if(!r.ok)throw new Error('Không tải được master roster');return r.json();}).then(function(data){roster=Array.isArray(data)?data:(Array.isArray(data.students)?data.students:[]);window.students=roster.slice();return roster;});},
 saveResult:function(result){var key='QL_GAME_RESULTS_2026_2027',rows=[];try{rows=JSON.parse(localStorage.getItem(key)||'[]');}catch(_){}rows.push(result);localStorage.setItem(key,JSON.stringify(rows));return true;},
 getResults:function(){try{return JSON.parse(localStorage.getItem('QL_GAME_RESULTS_2026_2027')||'[]');}catch(_){return [];}}
};
function bootRoster(){if(window.GameData.getStudents().length)return;window.GameData.loadStudents().then(function(){if(typeof window.fillStudents==='function')window.fillStudents();}).catch(function(err){console.warn('GameData:',err);});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bootRoster);else bootRoster();
})();
