/* XÓA VĨNH VIỄN MENU VI PHẠM + KHEN THƯỞNG
 * Chỉ loại bỏ giao diện/chức năng menu khỏi website.
 * KHÔNG xóa, sửa hoặc ghi dữ liệu Google Sheets.
 */
(function(){'use strict';
  const ids={
    menus:['violation','violations','reward','rewards'],
    sections:['page-violations','page-rewards']
  };
  function remove(){
    document.querySelectorAll('.main-menu [data-page]').forEach(el=>{
      const p=(el.getAttribute('data-page')||'').toLowerCase();
      if(ids.menus.some(k=>p===k)) el.remove();
    });
    document.querySelectorAll('#page-violations,#page-rewards,[data-page-section="violations"],[data-page-section="rewards"]').forEach(el=>el.remove());
    document.querySelectorAll('#violationBadge,#rewardBadge').forEach(el=>el.remove());
    document.querySelectorAll('.quick-action[data-action="add-violation"],.quick-action[data-action="add-reward"]').forEach(el=>el.remove());
    document.querySelectorAll('.stat-card').forEach(el=>{
      const t=(el.innerText||'').trim().toLowerCase();
      if(t.includes('lượt vi phạm')||t.includes('lượt khen thưởng'))el.remove();
    });
  }
  function start(){remove();setTimeout(remove,300);setTimeout(remove,1200);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
  window.addEventListener('load',remove,{once:true});
})();
