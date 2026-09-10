/* LEARNING SMAS UI CLEAN 1.0
 * Học tập dùng SMAS làm nguồn định kỳ chính.
 * Chỉ loại nút nhập thủ công dư thừa; không xóa dữ liệu.
 */
(function(){
  'use strict';
  if(window.__LH_LEARNING_SMAS_UI_CLEAN_10__) return;
  window.__LH_LEARNING_SMAS_UI_CLEAN_10__=true;
  function clean(){
    const page=document.getElementById('page-learning')||document.querySelector('[data-page-section="learning"]');
    if(!page)return;
    page.querySelectorAll('[data-action="add-learning"]').forEach(el=>el.remove());
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',clean,{once:true});else clean();
})();
