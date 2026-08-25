/* TIỆN ÍCH ĐỘC LẬP — CHỈ CHUYỂN TRANG */
(function(){
  'use strict';
  if(window.__LH_UTILITIES_REDIRECT_ONLY__) return;
  window.__LH_UTILITIES_REDIRECT_ONLY__=true;

  function bind(){
    document.addEventListener('click',function(e){
      var btn=e.target.closest && e.target.closest('.main-menu .menu-item[data-page="utilities"]');
      if(!btn) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      window.location.href='tien-ich.html';
    },true);

    document.addEventListener('touchend',function(e){
      var btn=e.target.closest && e.target.closest('.main-menu .menu-item[data-page="utilities"]');
      if(!btn) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      window.location.href='tien-ich.html';
    },{capture:true,passive:false});
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',bind,{once:true});
  else bind();
})();
