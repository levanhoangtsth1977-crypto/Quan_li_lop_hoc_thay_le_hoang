/* GOOGLE SHEETS MENU BRIDGE 7.0 — CURRENT MASTER SHEET */
(function(){
'use strict';
if(window.__LH_GOOGLE_MENU_BRIDGE_700__)return;
window.__LH_GOOGLE_MENU_BRIDGE_700__=true;
const SHEET_ID='1v9H6dReZiC_fCg6T9ISdfWOy1FN1HJQXXrKsABiCLI4';
const WEB_APP_URL='https://script.google.com/macros/s/AKfycbxTPwf-jhrR8JOoKY5ZLuzlsDgcv3nWILtDPTrYNWZCEPpm2rkpXTn-sPAdFaUyy0z_uw/exec';
const VERSION='MASTER-7.0-CURRENT-SHEET';
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
