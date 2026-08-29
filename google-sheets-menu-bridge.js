/* GOOGLE SHEETS MENU BRIDGE — PASSIVE ONLY
   Active Web App deployment aligned with the current 2026-2027 / 5A3 Apps Script.
*/
(function(){
'use strict';
if(window.__LH_GOOGLE_MENU_BRIDGE_PASSIVE__)return;
window.__LH_GOOGLE_MENU_BRIDGE_PASSIVE__=true;
const SHEET_ID='1v9H6dReZiC_fCg6T9ISdfWOy1FN1HJQXXrKsABiCLI4';
const WEB_APP_URL='https://script.google.com/macros/s/AKfycbxTPwf-jhrR8JOoKY5ZLuzlsDgcv3nWILtDPTrYNWZCEPpm2rkpXTn-sPAdFaUyy0z_uw/exec';
window.getGoogleSheetTab=tab=>window.GOOGLE_SHEET_DATA?.tabs?.[tab]||[];
window.getGoogleSheetUrl=()=>`https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit`;
window.getGoogleSheetModuleSource=module=>({students:'HOC_SINH',attendance:'DIEM_DANH',violations:'VI_PHAM',rewards:'KHEN_THUONG',learning:'HOC_TAP',progress:'TIEN_BO',comments:'NHAN_XET'})[module]||'';
window.getGoogleSpreadsheetId=()=>SHEET_ID;
window.getGoogleWebAppUrl=()=>WEB_APP_URL;
window.getGoogleMenuBridgeVersion=()=> 'PASSIVE-1.1-ACTIVE-APP-URL';
})();
