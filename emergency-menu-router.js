/* EMERGENCY MENU ROUTER — MENU + MOBILE SIDEBAR */
(function(){'use strict';
if(window.__LH_EMERGENCY_ROUTER__)return;window.__LH_EMERGENCY_ROUTER__=true;
const labels={dashboard:'Trang chủ',students:'Học sinh',attendance:'Điểm danh',violations:'Vi phạm',rewards:'Khen thưởng',learning:'Học tập',comments:'Nhận xét',statistics:'Thống kê','student-links':'Link học sinh',ai:'AI giáo viên','lucky-wheel':'Vòng quay may mắn',settings:'Cài đặt',materials:'Kho học liệu'};
function toggleSidebar(force){const s=document.getElementById('sidebar'),o=document.getElementById('sidebarOverlay');if(!s)return;const open=force!==undefined?!!force:!s.classList.contains('open');s.classList.toggle('open',open);if(o)o.classList.toggle('active',open);}
function ensureMobileVisible(){if(window.innerWidth<=900){const s=document.getElementById('sidebar');if(s)s.classList.add('open');}}
function open(page){const sections=[...document.querySelectorAll('[data-page-section]')],t=sections.find(s=>s.dataset.pageSection===page);if(!t)return false;sections.forEach(s=>{const active=s===t;s.classList.toggle('active',active);s.hidden=!active});document.querySelectorAll('.menu-item').forEach(b=>b.classList.toggle('active',b.dataset.page===page));const title=document.getElementById('pageTitle');if(title)title.textContent=labels[page]||page;try{window.LopHocApp?.navigateToPage?.(page)}catch(e){};if(page==='lucky-wheel')window.dispatchEvent(new Event('pagechange'));if(window.innerWidth<=900)toggleSidebar(false);return true}
function bind(){
 ensureMobileVisible();
 const toggle=document.getElementById('sidebarToggle');if(toggle&&!toggle.dataset.emergencyBound){toggle.dataset.emergencyBound='1';toggle.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();toggleSidebar()},true)}
 const close=document.getElementById('sidebarClose');if(close&&!close.dataset.emergencyBound){close.dataset.emergencyBound='1';close.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();toggleSidebar(false)},true)}
 const overlay=document.getElementById('sidebarOverlay');if(overlay&&!overlay.dataset.emergencyBound){overlay.dataset.emergencyBound='1';overlay.addEventListener('click',()=>toggleSidebar(false),true)}
}
document.addEventListener('click',e=>{bind();const b=e.target.closest?.('.main-menu [data-page]');if(!b)return;const p=b.dataset.page,t=document.querySelector('[data-page-section="'+CSS.escape(p)+'"]');if(t){e.preventDefault();e.stopImmediatePropagation();open(p)}},true);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();
new MutationObserver(bind).observe(document.body,{childList:true,subtree:true});
window.addEventListener('resize',ensureMobileVisible);
})();
