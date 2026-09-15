/* MOBILE SIDEBAR FALLBACK — isolated UI safety net */
(function(){
  'use strict';
  if(window.__LH_MOBILE_SIDEBAR_FALLBACK__) return;
  window.__LH_MOBILE_SIDEBAR_FALLBACK__ = true;

  function close(){
    const sidebar=document.getElementById('sidebar');
    const overlay=document.getElementById('sidebarOverlay');
    if(sidebar) sidebar.classList.remove('open');
    if(overlay){
      overlay.classList.remove('active');
      overlay.hidden=true;
      overlay.style.display='';
      overlay.setAttribute('aria-hidden','true');
    }
    document.body.classList.remove('sidebar-open');
  }

  function open(){
    const sidebar=document.getElementById('sidebar');
    const overlay=document.getElementById('sidebarOverlay');
    if(sidebar) sidebar.classList.add('open');
    if(overlay){
      overlay.classList.add('active');
      overlay.hidden=false;
      overlay.style.display='block';
      overlay.setAttribute('aria-hidden','false');
    }
    document.body.classList.add('sidebar-open');
  }

  function bind(){
    const toggle=document.getElementById('sidebarToggle');
    const closeBtn=document.getElementById('sidebarClose');
    const overlay=document.getElementById('sidebarOverlay');
    if(toggle && toggle.dataset.mobileSidebarFallback!=='1'){
      toggle.dataset.mobileSidebarFallback='1';
      toggle.addEventListener('click',function(e){
        e.preventDefault();
        e.stopPropagation();
        const sidebar=document.getElementById('sidebar');
        if(sidebar?.classList.contains('open')) close(); else open();
      },true);
    }
    if(closeBtn && closeBtn.dataset.mobileSidebarFallback!=='1'){
      closeBtn.dataset.mobileSidebarFallback='1';
      closeBtn.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();close();},true);
    }
    if(overlay && overlay.dataset.mobileSidebarFallback!=='1'){
      overlay.dataset.mobileSidebarFallback='1';
      overlay.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();close();},true);
    }
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',bind,{once:true});
  }else bind();
  new MutationObserver(bind).observe(document.documentElement,{childList:true,subtree:true});
})();
