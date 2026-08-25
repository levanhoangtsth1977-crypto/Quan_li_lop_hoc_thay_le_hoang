/* QUẢN LÝ LỚP HỌC — SINGLE MENU ROUTER */
(function(){
  'use strict';
  if(window.__LH_SINGLE_MENU_ROUTER__) return;
  window.__LH_SINGLE_MENU_ROUTER__=true;

  const labels={
    dashboard:'Trang chủ',students:'Học sinh',attendance:'Điểm danh',violations:'Vi phạm',rewards:'Khen thưởng',
    learning:'Học tập',comments:'Nhận xét',statistics:'Thống kê','student-links':'Link học sinh',
    ai:'AI giáo viên',materials:'Kho học liệu','lucky-wheel':'Vòng quay may mắn',settings:'Cài đặt'
  };

  function closeMobile(){
    if(window.innerWidth>900)return;
    const s=document.getElementById('sidebar'),o=document.getElementById('sidebarOverlay');
    if(s)s.classList.remove('open');
    if(o)o.classList.remove('active');
  }

  function show(page){
    const target=document.querySelector('[data-page-section="'+page+'"]');
    if(!target)return false;
    document.querySelectorAll('[data-page-section]').forEach(function(el){
      el.classList.remove('active');
      el.hidden=true;
    });
    target.hidden=false;
    target.classList.add('active');
    document.querySelectorAll('.main-menu .menu-item[data-page]').forEach(function(btn){
      btn.classList.toggle('active',btn.getAttribute('data-page')===page);
    });
    const title=document.getElementById('pageTitle');
    if(title)title.textContent=labels[page]||page;
    closeMobile();
    if(page==='lucky-wheel')window.dispatchEvent(new Event('pagechange'));
    return true;
  }

  function bind(){
    const menu=document.querySelector('.main-menu');
    if(menu&&!menu.__LH_SINGLE_BOUND__){
      menu.__LH_SINGLE_BOUND__=true;
      menu.addEventListener('click',function(e){
        const btn=e.target.closest('.menu-item[data-page]');
        if(!btn)return;
        const page=btn.getAttribute('data-page');
        if(show(page)){
          e.preventDefault();
          e.stopImmediatePropagation();
        }
      },true);
      menu.addEventListener('touchend',function(e){
        const btn=e.target.closest('.menu-item[data-page]');
        if(!btn)return;
        const page=btn.getAttribute('data-page');
        if(show(page)){
          e.preventDefault();
          e.stopImmediatePropagation();
        }
      },{capture:true,passive:false});
    }

    const toggle=document.getElementById('sidebarToggle');
    if(toggle&&!toggle.__LH_SINGLE_BOUND__){
      toggle.__LH_SINGLE_BOUND__=true;
      toggle.addEventListener('click',function(e){
        e.preventDefault();e.stopImmediatePropagation();
        const s=document.getElementById('sidebar'),o=document.getElementById('sidebarOverlay');
        if(!s)return;
        const open=!s.classList.contains('open');
        s.classList.toggle('open',open);
        if(o)o.classList.toggle('active',open);
      },true);
    }

    const close=document.getElementById('sidebarClose');
    if(close&&!close.__LH_SINGLE_BOUND__){
      close.__LH_SINGLE_BOUND__=true;
      close.addEventListener('click',function(e){e.preventDefault();e.stopImmediatePropagation();closeMobile();},true);
    }

    const overlay=document.getElementById('sidebarOverlay');
    if(overlay&&!overlay.__LH_SINGLE_BOUND__){
      overlay.__LH_SINGLE_BOUND__=true;
      overlay.addEventListener('click',function(e){e.preventDefault();e.stopImmediatePropagation();closeMobile();},true);
    }
  }

  function boot(){bind();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
  setTimeout(bind,200);setTimeout(bind,800);setTimeout(bind,1500);
  window.LHStableMenu=show;
})();
