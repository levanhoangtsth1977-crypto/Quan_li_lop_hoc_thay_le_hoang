/* EMERGENCY MENU ROUTER — FINAL DIRECT NAV */
(function(){
'use strict';
if(window.__LH_EMERGENCY_ROUTER_FINAL__) return;
window.__LH_EMERGENCY_ROUTER_FINAL__=true;
const labels={dashboard:'Trang chủ',students:'Học sinh',attendance:'Điểm danh',violations:'Vi phạm',rewards:'Khen thưởng',learning:'Học tập',comments:'Nhận xét',statistics:'Thống kê','student-links':'Link học sinh',ai:'AI giáo viên','lucky-wheel':'Vòng quay may mắn',settings:'Cài đặt',materials:'Kho học liệu'};
function sidebar(open){const s=document.getElementById('sidebar'),o=document.getElementById('sidebarOverlay');if(s)s.classList.toggle('open',!!open);if(o)o.classList.toggle('active',!!open)}
function navigate(page){const target=[...document.querySelectorAll('[data-page-section]')].find(s=>s.dataset.pageSection===page);if(!target)return false;document.querySelectorAll('[data-page-section]').forEach(sec=>{sec.classList.remove('active');sec.hidden=true});target.hidden=false;target.classList.add('active');document.querySelectorAll('.menu-item[data-page]').forEach(btn=>btn.classList.toggle('active',btn.getAttribute('data-page')===page));const title=document.getElementById('pageTitle');if(title)title.textContent=labels[page]||page;if(window.innerWidth<=900)sidebar(false);if(page==='lucky-wheel')window.dispatchEvent(new Event('pagechange'));return true}
function bind(){const toggle=document.getElementById('sidebarToggle');if(toggle&&!toggle.__lhBound){toggle.__lhBound=true;toggle.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();const s=document.getElementById('sidebar');sidebar(!s||!s.classList.contains('open'))})}const close=document.getElementById('sidebarClose');if(close&&!close.__lhBound){close.__lhBound=true;close.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();sidebar(false)})}const overlay=document.getElementById('sidebarOverlay');if(overlay&&!overlay.__lhBound){overlay.__lhBound=true;overlay.addEventListener('click',function(){sidebar(false)})}document.querySelectorAll('.main-menu .menu-item[data-page]').forEach(function(btn){if(btn.__lhBound)return;btn.__lhBound=true;btn.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();navigate(btn.getAttribute('data-page'))})})}
function start(){bind();setTimeout(bind,300);setTimeout(bind,1000)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
new MutationObserver(bind).observe(document.body,{childList:true,subtree:true});
window.LHDirectNavigate=navigate;
})();
