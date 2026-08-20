/* GOOGLE SHEETS MENU BRIDGE 5.1 — AUTHORITATIVE WEB APP ONLY */
(function(){
'use strict';
if(window.__LH_GOOGLE_MENU_BRIDGE_510__)return;
window.__LH_GOOGLE_MENU_BRIDGE_510__=true;
const SHEET_ID='1v9H6dReZiC_fCg6T9ISdfWOy1FN1HJQXXrKsABiCLI4';
const WEB_APP_URL='https://script.google.com/macros/s/AKfycbxTPwf-jhrR8JOoKY5ZLuzlsDgcv3nWILtDPTrYNWZCEPpm2rkpXTn-sPAdFaUyy0z_uw/exec';
const KEY='QL_LOP_HOC_LE_HOANG_GOOGLE_SHEETS_2026_2027';
const VERSION='5.1-AUTHORITATIVE-WEBAPP';
function clean(v){return String(v??'').trim().replace(/\s+/g,' ')}
function normalize(s,i){s=s||{};return{id:clean(s.id||s.studentId)||('STU_5C_2026_'+String(i+1).padStart(3,'0')),name:clean(s.name||s.studentName),gender:clean(s.gender),birthDate:clean(s.birthDate),status:clean(s.status)||'active',parentName:clean(s.parentName),phone:clean(s.phone),address:clean(s.address),note:clean(s.note),shareEnabled:s.shareEnabled!==false,createdAt:s.createdAt||new Date().toISOString(),updatedAt:s.updatedAt||new Date().toISOString()}}
function dedupe(list){const m=new Map();(Array.isArray(list)?list:[]).map(normalize).filter(s=>s.name).forEach(s=>{const k=clean(s.name).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase()+'|'+clean(s.birthDate)+'|'+clean(s.gender);if(!m.has(k))m.set(k,s)});return[...m.values()]}
function jsonp(action){return new Promise((resolve,reject)=>{const cb='__LH510_'+Date.now()+'_'+Math.random().toString(36).slice(2),sc=document.createElement('script'),tm=setTimeout(()=>finish(Error('Google Apps Script timeout')),15000);function finish(e,d){clearTimeout(tm);try{delete window[cb]}catch(_){}sc.remove();e?reject(e):resolve(d)}window[cb]=d=>finish(null,d);sc.onerror=()=>finish(Error('Không truy cập được Web App Google Sheets'));sc.src=WEB_APP_URL+'?action='+encodeURIComponent(action)+'&callback='+encodeURIComponent(cb)+'&_='+Date.now();document.head.appendChild(sc)})}
function applyStudents(list){const data=dedupe(list);if(!data.length)return[];try{if(typeof window.replaceStudents==='function'){window.replaceStudents(data,{source:'GOOGLE_WEB_APP',authoritative:true})}else if(typeof window.students!=='undefined'&&Array.isArray(window.students)){window.students.splice(0,window.students.length,...data)}else{window.students=data}}catch(e){window.students=data;console.warn('[LH510 students]',e)}try{if(typeof window.syncAppDataReferences==='function')window.syncAppDataReferences()}catch(_){}try{if(typeof window.renderStudents==='function')window.renderStudents()}catch(_){}try{if(typeof window.renderDashboard==='function')window.renderDashboard()}catch(_){}window.GOOGLE_SHEETS_STUDENTS=data;window.GOOGLE_SHEET_CONFIG={sheetId:SHEET_ID,webAppUrl:WEB_APP_URL,version:VERSION,studentCount:data.length,syncConfigured:true,source:'GOOGLE_APPS_SCRIPT'};try{localStorage.setItem(KEY,JSON.stringify({version:VERSION,sheetId:SHEET_ID,savedAt:new Date().toISOString(),students:data}))}catch(_){}return data}
async function loadAll(){try{const r=await jsonp('get_all');if(!r||r.ok!==true)throw Error(r&&r.error||'Web App không trả dữ liệu');const studentList=applyStudents(r.HOC_SINH||[]);window.GOOGLE_SHEET_DATA={ok:true,version:VERSION,sheetId:SHEET_ID,webAppUrl:WEB_APP_URL,loadedAt:new Date().toISOString(),tabs:{HOC_SINH:studentList,DIEM_DANH:r.DIEM_DANH||[],VI_PHAM:r.VI_PHAM||[],KHEN_THUONG:r.KHEN_THUONG||[]},source:'GOOGLE_APPS_SCRIPT'};try{if(typeof window.syncAppDataReferences==='function')window.syncAppDataReferences()}catch(_){}try{if(typeof window.renderAttendance==='function')window.renderAttendance()}catch(_){}try{if(typeof window.renderViolations==='function')window.renderViolations()}catch(_){}try{if(typeof window.renderRewards==='function')window.renderRewards()}catch(_){}if(typeof window.showToast==='function'&&studentList.length)window.showToast('Đã kết nối Google Sheets: '+studentList.length+' học sinh.','success');return window.GOOGLE_SHEET_DATA}catch(e){console.warn('[LH510]',e.message);window.GOOGLE_SHEET_CONFIG={sheetId:SHEET_ID,webAppUrl:WEB_APP_URL,version:VERSION,syncConfigured:true,error:e.message};return null}}
window.loadGoogleSheetsMenuData=loadAll;
window.getGoogleSheetTab=tab=>window.GOOGLE_SHEET_DATA?.tabs?.[tab]||[];
window.getGoogleSheetUrl=()=>`https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit`;
window.getGoogleSheetModuleSource=module=>module==='students'?'HOC_SINH':'';
window.getGoogleSpreadsheetId=()=>SHEET_ID;
window.getGoogleWebAppUrl=()=>WEB_APP_URL;
window.syncStudentsToGoogleSheet=async()=>({ok:false,error:'MASTER-5.1: danh sách học sinh lấy từ Google Sheets, không ghi đè từ Web'});
window.addEventListener('google-sheets-refresh',loadAll);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(loadAll,900),{once:true});else setTimeout(loadAll,900);
})();
