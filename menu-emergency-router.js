/* MENU EMERGENCY ROUTER 1.0 — window-capture fallback */
(function(){
  'use strict';
  if(window.__LH_MENU_EMERGENCY_10__) return;
  window.__LH_MENU_EMERGENCY_10__=true;

  var TITLES={dashboard:'Trang chủ',students:'Học sinh',attendance:'Điểm danh',violations:'Vi phạm',rewards:'Khen thưởng',learning:'Học tập',comments:'Nhận xét',statistics:'Thống kê','student-links':'Link học sinh',materials:'Kho học liệu',ai:'AI giáo viên',settings:'Cài đặt','lucky-wheel':'Vòng quay may mắn'};

  function text(v){return String(v==null?'':v).trim();}
  function section(page){
    var p=text(page).replace(/[^a-zA-Z0-9_-]/g,'');
    return document.querySelector('[data-page-section="'+p+'"]') || document.getElementById('page-'+p);
  }
  function closeSidebar(){
    var s=document.getElementById('sidebar'),o=document.getElementById('sidebarOverlay');
    if(s)s.classList.remove('open');
    if(o){o.classList.remove('active');o.hidden=true;o.setAttribute('aria-hidden','true');}
    document.body.classList.remove('sidebar-open');
  }
  function navigate(page){
    page=text(page); if(!page)return false;
    var sec=section(page); if(!sec)return false;
    var all=document.querySelectorAll('[data-page-section]');
    for(var i=0;i<all.length;i++){
      var active=all[i]===sec;
      all[i].classList.toggle('active',active);
      all[i].hidden=!active;
    }
    var items=document.querySelectorAll('.menu-item[data-page]');
    for(var j=0;j<items.length;j++) items[j].classList.toggle('active',text(items[j].dataset.page)===page);
    var title=document.getElementById('pageTitle'); if(title)title.textContent=TITLES[page]||page;
    closeSidebar();
    var renderer={students:'renderStudents',attendance:'renderAttendance',violations:'renderViolations',rewards:'renderRewards',learning:'renderLearningSafe',comments:'renderCommentsSafe',statistics:'renderStatistics','student-links':'renderStudentLinks'}[page];
    if(renderer && typeof window[renderer]==='function'){try{window[renderer]();}catch(e){console.warn('[MENU EMERGENCY RENDER]',page,e);}}
    return true;
  }

  function handle(e){
    var t=e.target instanceof Element?e.target:null; if(!t)return;
    var menu=t.closest('.menu-item[data-page]');
    if(menu){e.preventDefault();navigate(menu.dataset.page);return;}
    var link=t.closest('[data-page-link]');
    if(link){e.preventDefault();navigate(link.dataset.pageLink);return;}
    var action=t.closest('[data-action]');
    if(action && action.dataset.action==='attendance'){e.preventDefault();navigate('attendance');return;}
  }

  window.addEventListener('click',handle,true);
  window.LHMenuEmergency={navigate:navigate};
})();
