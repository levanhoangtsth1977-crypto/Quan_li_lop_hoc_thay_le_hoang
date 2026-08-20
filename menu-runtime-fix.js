/* ============================================================
   MENU RUNTIME FIX 7.2 — STUDENT MENU + BRIDGE 6.4
   ============================================================ */
(function(){'use strict';
if(window.__MENU_RUNTIME_FIX_720__)return;
window.__MENU_RUNTIME_FIX_720__=true;
const q=s=>document.querySelector(s),text=v=>String(v??'').trim();
function renderPage(page){const target=text(page),sections=[...document.querySelectorAll('[data-page-section]')],section=sections.find(s=>s.dataset.pageSection===target);if(!section)return false;sections.forEach(s=>{const on=s.dataset.pageSection===target;s.classList.toggle('active',on);s.hidden=!on});document.querySelectorAll('.menu-item[data-page]').forEach(b=>b.classList.toggle('active',b.dataset.page===target));const title=q('#pageTitle');if(title){const t={dashboard:'Trang chủ',students:'Học sinh',attendance:'Điểm danh',violations:'Vi phạm',rewards:'Khen thưởng',learning:'Học tập',comments:'Nhận xét',statistics:'Thống kê','student-links':'Link học sinh',materials:'Kho học liệu',ai:'AI giáo viên',settings:'Cài đặt',game:'Triệu Phú Học Đường'};title.textContent=t[target]||target}q('#sidebar')?.classList.remove('open');q('#sidebarOverlay')?.classList.remove('active');if(target==='students'){setTimeout(()=>{if(typeof window.loadGoogleSheetsMenuData==='function')window.loadGoogleSheetsMenuData();else if(typeof window.renderStudents==='function')window.renderStudents()},150)}return true}
function loadFresh(src,marker,onload){if(document.querySelector('script[data-runtime-refresh="'+marker+'"]')){if(onload)setTimeout(onload,100);return}const s=document.createElement('script');s.src=src+'?runtime='+Date.now();s.dataset.runtimeRefresh=marker;s.async=false;s.onload=()=>{console.info('[RUNTIME] loaded',marker);if(onload)onload()};s.onerror=e=>console.warn('[RUNTIME] load failed',marker,e);document.body.appendChild(s)}
function install(){
 document.addEventListener('click',e=>{const m=e.target.closest('.menu-item[data-page], [data-page-link]');if(m){e.preventDefault();renderPage(m.dataset.page||m.dataset.pageLink);return}if(e.target.closest('#sidebarToggle,#menuToggle')){e.preventDefault();q('#sidebar')?.classList.add('open');q('#sidebarOverlay')?.classList.add('active');return}if(e.target.closest('#sidebarClose,#sidebarOverlay')){e.preventDefault();q('#sidebar')?.classList.remove('open');q('#sidebarOverlay')?.classList.remove('active')}});
 window.__LH_STUDENT_RECOVERY_STATUS__={policy:'NO_AUTO_RESTORE',source:'GOOGLE_API_SAFE_IDENTITY_UPSERT',at:new Date().toISOString()};
 setTimeout(()=>{
   loadFresh('student-sync-dedupe.js','student-dedupe-220');
   loadFresh('google-api-bridge.js','google-bridge-640',()=>{if(typeof window.loadGoogleSheetsMenuData==='function')window.loadGoogleSheetsMenuData()});
 },150);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
