/* TRIỆU PHÚ HỌC ĐƯỜNG MENU FIX — 2026-09-16 */
(function(){
  'use strict';
  if(window.__LH_TRIEU_PHU_MENU_FIX_V2__) return;
  window.__LH_TRIEU_PHU_MENU_FIX_V2__ = true;

  function addMenu(){
    const menu = document.querySelector('.main-menu');
    if(!menu) return false;
    if(document.getElementById('lhTrieuPhuMenu')) return true;

    const wheel = document.getElementById('lhLuckyWheelStatic');
    const item = document.createElement('a');
    item.className = 'menu-item';
    item.id = 'lhTrieuPhuMenu';
    item.href = 'game/index.html';
    item.setAttribute('aria-label','Mở Triệu Phú Học Đường');
    item.innerHTML = '<i class="fa-solid fa-award"></i><span>Triệu Phú Học Đường</span><span class="menu-label">Game</span>';

    if(wheel && wheel.parentNode === menu){
      menu.insertBefore(item, wheel);
    }else{
      menu.appendChild(item);
    }
    return true;
  }

  function boot(){
    if(addMenu()) return;
    let tries = 0;
    const timer = setInterval(function(){
      tries += 1;
      if(addMenu() || tries >= 40) clearInterval(timer);
    },250);
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', boot, {once:true});
  }else{
    boot();
  }
})();
