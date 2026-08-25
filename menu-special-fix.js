/* TIỆN ÍCH ĐỘC LẬP — SINGLE LINK TO STANDALONE PAGE */
(function(){
  'use strict';
  if(window.__LH_STANDALONE_UTILITIES__) return;
  window.__LH_STANDALONE_UTILITIES__=true;

  function cleanUtilitiesMenu(){
    var nav=document.querySelector('.main-menu');
    if(!nav) return;

    /* Xóa mọi bản Tiện ích cũ do các module khác tự chèn. */
    nav.querySelectorAll('[data-page="utilities"],#lhUtilitiesFinal,#lhUtilitiesMenu').forEach(function(el){el.remove();});
    nav.querySelectorAll('.lh-utilities-divider').forEach(function(el){el.remove();});

    /* Chỉ tạo đúng 1 mục Tiện ích, mở trang độc lập. */
    if(!nav.querySelector('#lhStandaloneUtilities')){
      var a=document.createElement('a');
      a.id='lhStandaloneUtilities';
      a.className='menu-item';
      a.href='tien-ich.html';
      a.innerHTML='<i class="fa-solid fa-toolbox"></i><span>Tiện ích</span>';
      var settings=nav.querySelector('[data-page="settings"]');
      if(settings) nav.insertBefore(a,settings);
      else nav.appendChild(a);
    }

    /* Không cho page tiện ích cũ tồn tại trên trang quản lý. */
    document.querySelectorAll('#page-utilities-final,[data-page-section="utilities"]').forEach(function(el){
      if(el.id!=='page-dashboard') el.remove();
    });
  }

  function redirect(e){
    var a=e.target.closest && e.target.closest('#lhStandaloneUtilities');
    if(!a) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    window.location.href='tien-ich.html';
  }

  function boot(){
    cleanUtilitiesMenu();
    window.addEventListener('click',redirect,true);
    window.addEventListener('touchend',redirect,{capture:true,passive:false});
    var mo=new MutationObserver(function(){cleanUtilitiesMenu();});
    if(document.body) mo.observe(document.body,{childList:true,subtree:true});
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
