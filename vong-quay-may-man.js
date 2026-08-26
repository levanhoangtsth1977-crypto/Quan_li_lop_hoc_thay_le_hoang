/* VÒNG QUAY MAY MẮN — ĐÃ GỠ KHỎI HỆ THỐNG */
(function(){
'use strict';
if(window.__LH_LUCKY_WHEEL_REMOVED__)return;
window.__LH_LUCKY_WHEEL_REMOVED__=true;
function removeLuckyWheel(){
  try{
    document.querySelectorAll('[data-page="lucky-wheel"],#lhLuckyWheelStatic').forEach(el=>el.remove());
    const page=document.getElementById('page-lucky-wheel');
    if(page)page.remove();
    document.querySelectorAll('script[src*="vong-quay-may-man"],script[src*="lucky-wheel"]').forEach(el=>el.remove());
    const title=document.getElementById('pageTitle');
    if(title && /Vòng quay may mắn/i.test(title.textContent)) title.textContent='Trang chủ';
  }catch(e){console.warn('[LH] Không thể gỡ Vòng quay may mắn:',e)}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',removeLuckyWheel,{once:true});else removeLuckyWheel();
new MutationObserver(removeLuckyWheel).observe(document.body,{childList:true,subtree:true});
})();
