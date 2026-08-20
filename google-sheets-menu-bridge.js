/* GOOGLE SHEETS MENU BRIDGE 6.0 — CURRENT MASTER DELEGATION */
(function(){
'use strict';
if(window.__LH_GOOGLE_MENU_BRIDGE_600__)return;
window.__LH_GOOGLE_MENU_BRIDGE_600__=true;
const SHEET_ID='174xQ29phs-Or7OOEKOM0IHylFJXg5SsqzOC27x7K3Wg';
const WEB_APP_URL='https://script.google.com/macros/s/AKfycbynklm7SobnkcEZKfAUGdMIBugA4lQ2kA3yOThHVjNoiJzCK7veuwO2vE1tR1QKI-nkIQ/exec';
const VERSION='MASTER-6.0-DELEGATED';
function load(){if(typeof window.loadGoogleSheetsMenuData==='function'&&window.loadGoogleSheetsMenuData!==load)return window.loadGoogleSheetsMenuData();return Promise.resolve(null)}
window.getGoogleSheetTab=tab=>window.GOOGLE_SHEET_DATA?.tabs?.[tab]||[];
window.getGoogleSheetUrl=()=>`https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit`;
window.getGoogleSheetModuleSource=module=>({students:'HOC_SINH',attendance:'DIEM_DANH',violations:'VI_PHAM',rewards:'KHEN_THUONG'})[module]||'';
window.getGoogleSpreadsheetId=()=>SHEET_ID;
window.getGoogleWebAppUrl=()=>WEB_APP_URL;
window.getGoogleMenuBridgeVersion=()=>VERSION;
window.addEventListener('google-sheets-refresh',()=>{try{load()}catch(_){} });
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(load,1500),{once:true});else setTimeout(load,1500);
})();
