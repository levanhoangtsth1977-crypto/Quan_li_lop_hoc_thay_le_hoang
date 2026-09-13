/* TRIỆU PHÚ HỌC ĐƯỜNG MENU FIX — 2026-09-13 */
(function(){
  'use strict';
  if(window.__LH_TRIEU_PHU_MENU_FIX__) return;
  window.__LH_TRIEU_PHU_MENU_FIX__ = true;

  function addMenu(){
    const menu = document.querySelector('.main-menu');
    if(!menu || document.getElementById('lhTrieuPhuMenu')) return;

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
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', addMenu, {once:true});
  }else{
    addMenu();
  }
})();
