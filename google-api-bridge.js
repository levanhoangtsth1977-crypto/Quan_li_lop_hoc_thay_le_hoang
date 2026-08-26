/* GOOGLE API BRIDGE 9.1 — AUTHORITATIVE DATA + LEARNING/COMMENTS BOOT */
'use strict';
(function(){
if(window.__LH_GOOGLE_BRIDGE_910__)return;
window.__LH_GOOGLE_BRIDGE_910__=true;
const CFG=Object.freeze({url:'https://script.google.com/macros/s/AKfycbxTPwf-jhrR8JOoKY5ZLuzlsDgcv3nWILtDPTrYNWZCEPpm2rkpXTn-sPAdFaUyy0z_uw/exec',key:'QL_LOP_HOC_LE_HOANG_2026_2027',sheetId:'1v9H6dReZiC_fCg6T9ISdfWOy1FN1HJQXXrKsABiCLI4',version:'MASTER-9.1'});
let loading=null,loadedOnce=false;
function jsonp(action,params){return new Promise((resolve,reject)=>{const cb='__LH910_'+Date.now()+'_'+Math.random().toString(36).slice(2),s=document.createElement('script');let done=false;const finish=(e,d)=>{if(done)return;done=true;clearTimeout(t);try{delete window[cb]}catch(_){}s.remove();e?reject(e):resolve(d)};const t=setTimeout(()=>finish(Error('Google Apps Script không phản hồi sau 20 giây')),20000);window[cb]=d=>finish(null,d);s.onerror=()=>finish(Error('Không truy cập được Google Apps Script'));const q=Object.assign({action,callback:cb,_:Date.now()},params||{});s.src=CFG.url+'?'+Object.keys(q).map(k=>encodeURIComponent(k)+'='+encodeURIComponent(typeof q[k]==='string'?q[k]:JSON.stringify(q[k]))).join('&');document.head.appendChild(s)})}
const clean=v=>String(v??'').trim().replace(/\s+/g,' ');
function normalizeStudent(s){return{id:clean(s?.id),name:clean(s?.name||s?.studentName),gender:clean(s?.gender),birthDate:clean(s?.birthDate),status:clean(s?.status)||'active',parentName:clean(s?.parentName),phone:clean(s?.phone),address:clean(s?.address),note:clean(s?.note),shareEnabled:s?.shareEnabled!==false,createdAt:s?.createdAt||'',updatedAt:s?.updatedAt||''}}
function publish(list){const a=(Array.isArray(list)?list:[]).map(normalizeStudent).filter(s=>s.id&&s.name);if(!a.length)throw Error('Google không trả về học sinh hợp lệ');if(typeof window.replaceStudents==='function')window.replaceStudents(a,{source:'GOOGLE_APPS_SCRIPT',authoritative:true});else if(Array.isArray(window.students))window.students.splice(0,window.students.length,...a);window.GOOGLE_SHEETS_STUDENTS=a;return a}
function load(){if(loadedOnce)return Promise.resolve(window.GOOGLE_SHEET_DATA||null);if(loading)return loading;loading=jsonp('get_all').then(r=>{if(!r?.ok)throw Error(r?.error||'Web App không trả dữ liệu');const s=publish(r.HOC_SINH||[]),a=r.DIEM_DANH||[],v=r.VI_PHAM||[],k=r.KHEN_THUONG||[],h=r.HOC_TAP||[];if(Array.isArray(window.attendanceRecords))window.attendanceRecords.splice(0,window.attendanceRecords.length,...a);if(Array.isArray(window.violationRecords))window.violationRecords.splice(0,window.violationRecords.length,...v);if(Array.isArray(window.rewardRecords))window.rewardRecords.splice(0,window.rewardRecords.length,...k);window.GOOGLE_SHEET_DATA={ok:true,version:CFG.version,sheetId:CFG.sheetId,webAppUrl:CFG.url,loadedAt:new Date().toISOString(),tabs:{HOC_SINH:s,DIEM_DANH:a,VI_PHAM:v,KHEN_THUONG:k,HOC_TAP:h},HOC_SINH:s,DIEM_DANH:a,VI_PHAM:v,KHEN_THUONG:k,HOC_TAP:h};window.learningRecords=Array.isArray(h)?h:[];loadedOnce=true;window.dispatchEvent(new CustomEvent('google-sheets-data-ready',{detail:window.GOOGLE_SHEET_DATA}));return window.GOOGLE_SHEET_DATA}).catch(e=>{console.warn('[LH910]',e.message);return null}).finally(()=>{loading=null});return loading}
function loadScript(src){return new Promise(resolve=>{const base=src.split('?')[0],existing=document.querySelector('script[src^="'+base+'"]');if(existing){resolve(true);return}const s=document.createElement('script');s.src=src;s.async=false;s.onload=()=>resolve(true);s.onerror=()=>resolve(false);document.head.appendChild(s)})}
async function init(){
  await loadScript('./learning-menu.js?v=STABLE-20260826');
  await loadScript('./ai-comments-engine.js?v=STABLE-20260826');
  await loadScript('./learning-comments-repair.js?v=1.0');
  load();
}
window.loadGoogleSheetsMenuData=load;
window.syncGoogleSheetsNow=()=>{loadedOnce=false;return load()};
window.getGoogleStudentRoster=()=>Array.isArray(window.GOOGLE_SHEETS_STUDENTS)?window.GOOGLE_SHEETS_STUDENTS:(Array.isArray(window.students)?window.students:[]);
window.getGoogleWebAppUrl=()=>CFG.url;window.getGoogleSpreadsheetId=()=>CFG.sheetId;window.GOOGLE_API_CONFIG=CFG;
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
