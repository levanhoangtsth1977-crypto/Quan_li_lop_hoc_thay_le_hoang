/* QUẢN LÝ LỚP HỌC — SINGLE MENU ROUTER */
(function(){
'use strict';
if(window.__LH_SINGLE_MENU_ROUTER__)return;
window.__LH_SINGLE_MENU_ROUTER__=true;
const labels={dashboard:'Trang chủ',students:'Học sinh',attendance:'Điểm danh',violations:'Vi phạm',rewards:'Khen thưởng',learning:'Học tập',comments:'Nhận xét',statistics:'Thống kê','student-links':'Link học sinh',ai:'AI giáo viên',materials:'Kho học liệu','lucky-wheel':'Vòng quay may mắn',settings:'Cài đặt'};
function closeMobile(){if(window.innerWidth>900)return;const s=document.getElementById('sidebar'),o=document.getElementById('sidebarOverlay');if(s)s.classList.remove('open');if(o)o.classList.remove('active');}
function setActive(page){document.querySelectorAll('.main-menu .menu-item[data-page]').forEach(b=>b.classList.toggle('active',b.getAttribute('data-page')===page));const t=document.getElementById('pageTitle');if(t)t.textContent=labels[page]||page;closeMobile();}
function show(page){const target=document.querySelector('[data-page-section="'+page+'"]');if(!target)return false;document.querySelectorAll('[data-page-section]').forEach(el=>{el.hidden=true;el.classList.remove('active')});target.hidden=false;target.classList.add('active');setActive(page);if(page==='lucky-wheel')window.dispatchEvent(new Event('pagechange'));return true;}
function ensureUtilitiesLink(){
 const nav=document.querySelector('.main-menu');if(!nav)return;
 nav.querySelectorAll('[data-page="utilities"],#lhUtilitiesDynamic,.lh-utilities-divider').forEach(el=>el.remove());
 let link=nav.querySelector('a[href="tien-ich.html"]');
 if(!link){link=document.createElement('a');link.href='tien-ich.html';link.className='menu-item';link.id='lhUtilitiesStandalone';link.innerHTML='<i class="fa-solid fa-toolbox"></i><span>Tiện ích</span>';const settings=nav.querySelector('[data-page="settings"]');if(settings){nav.insertBefore(link,settings)}else nav.appendChild(link);}
 link.addEventListener('click',()=>closeMobile(),{capture:true});
}
function bind(){
 ensureUtilitiesLink();
 const menu=document.querySelector('.main-menu');
 if(menu&&!menu.__LH_SINGLE_BOUND__){menu.__LH_SINGLE_BOUND__=true;
  menu.addEventListener('click',function(e){const btn=e.target.closest('.menu-item[data-page]');if(!btn)return;const page=btn.getAttribute('data-page');if(show(page)){e.preventDefault();e.stopImmediatePropagation();}},true);
  menu.addEventListener('touchend',function(e){const btn=e.target.closest('.menu-item[data-page]');if(!btn)return;const page=btn.getAttribute('data-page');if(show(page)){e.preventDefault();e.stopImmediatePropagation();}},{capture:true,passive:false});
 }
 const toggle=document.getElementById('sidebarToggle');if(toggle&&!toggle.__LH_SINGLE_BOUND__){toggle.__LH_SINGLE_BOUND__=true;toggle.addEventListener('click',function(e){e.preventDefault();e.stopImmediatePropagation();const s=document.getElementById('sidebar'),o=document.getElementById('sidebarOverlay');if(!s)return;const open=!s.classList.contains('open');s.classList.toggle('open',open);if(o)o.classList.toggle('active',open)},true)}
 const close=document.getElementById('sidebarClose');if(close&&!close.__LH_SINGLE_BOUND__){close.__LH_SINGLE_BOUND__=true;close.addEventListener('click',function(e){e.preventDefault();e.stopImmediatePropagation();closeMobile()},true)}
 const overlay=document.getElementById('sidebarOverlay');if(overlay&&!overlay.__LH_SINGLE_BOUND__){overlay.__LH_SINGLE_BOUND__=true;overlay.addEventListener('click',function(e){e.preventDefault();e.stopImmediatePropagation();closeMobile()},true)}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();
setTimeout(bind,250);setTimeout(bind,900);
})();