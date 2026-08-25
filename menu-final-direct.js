/* MENU FINAL DIRECT — chạy sau mọi module */
(function(){
'use strict';
if(window.__LH_MENU_FINAL_DIRECT__)return;
window.__LH_MENU_FINAL_DIRECT__=true;
function nav(page){
 const target=[...document.querySelectorAll('[data-page-section]')].find(x=>x.getAttribute('data-page-section')===page);
 if(!target)return false;
 document.querySelectorAll('[data-page-section]').forEach(x=>{x.classList.remove('active');x.hidden=true});
 target.hidden=false;target.classList.add('active');
 document.querySelectorAll('.main-menu [data-page]').forEach(x=>x.classList.toggle('active',x.getAttribute('data-page')===page));
 const title=document.getElementById('pageTitle');
 const labels={dashboard:'Trang chủ',students:'Học sinh',attendance:'Điểm danh',violations:'Vi phạm',rewards:'Khen thưởng',learning:'Học tập',comments:'Nhận xét',statistics:'Thống kê','student-links':'Link học sinh',ai:'AI giáo viên','lucky-wheel':'Vòng quay may mắn',settings:'Cài đặt',materials:'Kho học liệu'};
 if(title)title.textContent=labels[page]||page;
 const s=document.getElementById('sidebar'),o=document.getElementById('sidebarOverlay');
 if(window.innerWidth<=900){if(s)s.classList.remove('open');if(o)o.classList.remove('active')}
 if(page==='lucky-wheel')window.dispatchEvent(new Event('pagechange'));
 return true;
}
function bindMobile(){
 const t=document.getElementById('sidebarToggle'),c=document.getElementById('sidebarClose'),o=document.getElementById('sidebarOverlay');
 if(t&&!t.__mfd){t.__mfd=1;t.addEventListener('click',function(e){e.preventDefault();e.stopImmediatePropagation();const s=document.getElementById('sidebar');if(s){s.classList.toggle('open');if(o)o.classList.toggle('active',s.classList.contains('open'))}},true)}
 if(c&&!c.__mfd){c.__mfd=1;c.addEventListener('click',function(e){e.preventDefault();e.stopImmediatePropagation();if(document.getElementById('sidebar'))document.getElementById('sidebar').classList.remove('open');if(o)o.classList.remove('active')},true)}
 if(o&&!o.__mfd){o.__mfd=1;o.addEventListener('click',function(){if(document.getElementById('sidebar'))document.getElementById('sidebar').classList.remove('open');o.classList.remove('active')},true)}
}
function boot(){bindMobile();document.querySelectorAll('.main-menu [data-page]').forEach(b=>{if(!b.__mfd){b.__mfd=1;b.addEventListener('click',function(e){e.preventDefault();e.stopImmediatePropagation();nav(b.getAttribute('data-page'))},true)}});const o=document.getElementById('sidebarOverlay');if(o)o.style.pointerEvents='none';}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
setTimeout(boot,200);setTimeout(boot,800);
window.LHFinalMenu=nav;
})();
