/* BEHAVIOR RECORDS AI SUMMARY — COMPATIBILITY SHIM 2.1
 * Canonical UI owner: behavior-ui-canonical-v11.js.
 * This compatibility file does not render tables, so it cannot duplicate the UI.
 * It keeps the legacy API available for existing AI integrations.
 */
(function(){
'use strict';
if(window.__LH_BEHAVIOR_RECORDS_AI_SHIM_21__)return;
window.__LH_BEHAVIOR_RECORDS_AI_SHIM_21__=true;
const S=v=>String(v??'').trim();
const fmt=v=>{const m=S(v).match(/^(\d{4})[-\/]([0-9]{1,2})[-\/]([0-9]{1,2})/);return m?`${m[3].padStart(2,'0')}/${m[2].padStart(2,'0')}/${m[1]}`:S(v)||'—'};
const students=()=>{try{return typeof window.getStudentsSafe==='function'?window.getStudentsSafe():(Array.isArray(window.students)?window.students:[])}catch{return[]}};
const name=id=>S(students().find(x=>S(x.id)===S(id))?.name)||'Học sinh';
const records=k=>{try{const f=k==='V'?'getViolationRecords':'getRewardRecords';return typeof window[f]==='function'?(window[f]()||[]):[]}catch{return[]}};
function rows(){const v=records('V').map(r=>({loai:'Vi phạm',studentId:r.studentId,hoTen:name(r.studentId),ngay:fmt(r.date||r.createdAt),noiDung:S(r.type)||'Khác',hinhThuc:S(r.action)||'Chưa ghi nhận'}));const k=records('R').map(r=>({loai:'Khen thưởng',studentId:r.studentId,hoTen:name(r.studentId),ngay:fmt(r.date||r.createdAt),noiDung:S(r.type)||'Khác',hinhThuc:S(r.formType)||'Chưa ghi nhận'}));return [...v,...k];}
function refresh(){try{const api=window.LH_BEHAVIOR_UI_CANONICAL;if(api&&typeof api.render==='function')api.render()}catch(e){console.warn('[BEHAVIOR AI SHIM]',e)}}
window.__LH_BEHAVIOR_AI_API__={refresh,violations:()=>records('V'),rewards:()=>records('R'),summary:rows};
function boot(){refresh();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();