/* ============================================================
   MENU RUNTIME FIX 7.3 — STUDENT MENU + BRIDGE 7.1
   ============================================================ */
(function(){'use strict';
if(window.__MENU_RUNTIME_FIX_730__)return;
window.__MENU_RUNTIME_FIX_730__=true;
const q=s=>document.querySelector(s),text=v=>String(v??'');
function renderPage(page){
 const target=text(page),sections=[...document.querySelectorAll('[data-page-section]')],section=sections.find(s=>s.dataset.pageSection===target);
 if(!section)return false;
 sections.forEach(s=>{const on=s.dataset.pageSection===target;s.classList.toggle('active',on);s.hidden=!on});
 document.querySelectorAll('.menu-item[data-page]').forEach(b=>b.classList.toggle('active',b.dataset.page===target));
 const title=q('#pageTitle');if(title){const t={dashboard:'Trang chủ',students:'Học sinh',attendance:'Điểm danh',violations:'Vi phạm',rewards:'Khen thưởng',learning:'Học tập',comments:'Nhận xét',statistics:'Thống kê','student-links':'Link học sinh',materials:'Kho học liệu',ai:'AI giáo viên',settings:'Cài đặt',game:'Triệu Phú Học Đường'};title.textContent=t[target]||target}
 q('#sidebar')?.classList.remove('open');q('#sidebarOverlay')?.classList.remove('active');
 if(target==='students')setTimeout(()=>{if(typeof window.loadGoogleSheetsMenuData==='function')window.loadGoogleSheetsMenuData();else if(typeof window.renderStudents==='function')window.renderStudents()},100);
 return true;
}
function loadFresh(src,marker,onload){
 const old=document.querySelectorAll('script[data-runtime-refresh="'+marker+'"]');old.forEach(x=>x.remove());
 const s=document.createElement('script');s.src=src+'?runtime=7.3.'+Date.now();s.dataset.runtimeRefresh=marker;s.async=false;s.onload=()=>{console.info('[RUNTIME] loaded',marker);if(onload)onload()};s.onerror=e=>console.warn('[RUNTIME] load failed',marker,e);document.body.appendChild(s);
}
function install(){
 document.addEventListener('click',e=>{const m=e.target.closest('.menu-item[data-page], [data-page-link]');if(m){e.preventDefault();renderPage(m.dataset.page||m.dataset.pageLink);return}if(e.target.closest('#sidebarToggle,#menuToggle')){e.preventDefault();q('#sidebar')?.classList.add('open');q('#sidebarOverlay')?.classList.add('active');return}if(e.target.closest('#sidebarClose,#sidebarOverlay')){e.preventDefault();q('#sidebar')?.classList.remove('open');q('#sidebarOverlay')?.classList.remove('active')}});
 window.__LH_STUDENT_RECOVERY_STATUS__={policy:'GOOGLE_FIRST_SAFE_BACKUP',schema:'12_COLUMNS',at:new Date().toISOString()};
 setTimeout(()=>{
   loadFresh('student-sync-dedupe.js','student-dedupe-230');
   loadFresh('google-api-bridge.js','google-bridge-710',()=>{if(typeof window.loadGoogleSheetsMenuData==='function')window.loadGoogleSheetsMenuData()});
 },150);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
