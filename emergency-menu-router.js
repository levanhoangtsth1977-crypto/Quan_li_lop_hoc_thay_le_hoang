/* EMERGENCY MENU ROUTER — FINAL DIRECT NAV V4 */
(function(){
  'use strict';
  if(window.__LH_MENU_ROUTER_V4__) return;
  window.__LH_MENU_ROUTER_V4__=true;
  var LABELS={dashboard:'Trang chủ',students:'Học sinh',attendance:'Điểm danh',violations:'Vi phạm',rewards:'Khen thưởng',learning:'Học tập',comments:'Nhận xét',statistics:'Thống kê','student-links':'Link học sinh',ai:'AI giáo viên','lucky-wheel':'Vòng quay may mắn',settings:'Cài đặt',materials:'Kho học liệu'};
  function byId(id){return document.getElementById(id);}
  function showMenu(){var s=byId('sidebar'),o=byId('sidebarOverlay');if(s){s.classList.add('open');s.style.pointerEvents='auto';s.style.zIndex='99999';}if(o){o.classList.remove('active');o.style.display='none';o.style.pointerEvents='none';}}
  function hideMenu(){var s=byId('sidebar'),o=byId('sidebarOverlay');if(s)s.classList.remove('open');if(o){o.classList.remove('active');o.style.display='none';o.style.pointerEvents='none';}}
  function navigate(page){var target=document.querySelector('[data-page-section="'+page+'"]');if(!target)return false;document.querySelectorAll('[data-page-section]').forEach(function(sec){sec.classList.remove('active');sec.hidden=true;});target.hidden=false;target.classList.add('active');document.querySelectorAll('.menu-item[data-page]').forEach(function(btn){btn.classList.toggle('active',btn.getAttribute('data-page')===page);});var title=byId('pageTitle');if(title)title.textContent=LABELS[page]||page;if(window.innerWidth<=900)hideMenu();if(page==='lucky-wheel')window.dispatchEvent(new Event('pagechange'));return true;}
  function normalize(){showMenu();document.querySelectorAll('.menu-item[data-page]').forEach(function(btn){btn.style.pointerEvents='auto';btn.style.position='relative';btn.style.zIndex='100000';});}
  function bind(){normalize();var t=byId('sidebarToggle');if(t&&!t.__lhV4){t.__lhV4=true;t.addEventListener('click',function(e){e.preventDefault();e.stopImmediatePropagation();var s=byId('sidebar');if(s&&s.classList.contains('open'))hideMenu();else showMenu();},true);}var c=byId('sidebarClose');if(c&&!c.__lhV4){c.__lhV4=true;c.addEventListener('click',function(e){e.preventDefault();e.stopImmediatePropagation();hideMenu();},true);}document.addEventListener('click',function(e){var b=e.target&&e.target.closest?e.target.closest('.main-menu .menu-item[data-page]'):null;if(!b)return;var p=b.getAttribute('data-page');if(!document.querySelector('[data-page-section="'+p+'"]'))return;e.preventDefault();e.stopImmediatePropagation();navigate(p);},true);}
  function start(){bind();setTimeout(normalize,300);setTimeout(normalize,1000);setTimeout(normalize,2500);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
  new MutationObserver(normalize).observe(document.documentElement,{childList:true,subtree:true});
  window.LHDirectNavigate=navigate;
})();
