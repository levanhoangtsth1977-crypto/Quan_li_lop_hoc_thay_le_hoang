/* BEHAVIOR MULTI-STUDENT UI 1.0
 * Cho phép chọn nhiều học sinh khi Ghi nhận Vi phạm/Khen thưởng.
 * Chỉ tác động select eStudent trong modal thêm mới; không dùng MutationObserver.
 */
(function(){
  'use strict';
  if(window.__LH_BEHAVIOR_MULTI_STUDENT_UI_10__)return;
  window.__LH_BEHAVIOR_MULTI_STUDENT_UI_10__=true;

  const S=v=>String(v??'').trim();
  function makeMulti(){
    document.querySelectorAll('.ev-static-modal #eStudent').forEach(el=>{
      const modal=el.closest('.ev-static-modal');
      const heading=S(modal?.querySelector('.ev-static-head h3')?.textContent);
      if(/Chỉnh sửa/i.test(heading))return;
      if(el.multiple)return;
      el.multiple=true;
      el.size=Math.min(10,Math.max(6,el.options.length-1));
      el.setAttribute('aria-label','Chọn một hoặc nhiều học sinh');
      const label=el.closest('label');
      if(label){
        const old=label.querySelector('.lh-multi-hint');
        if(!old){
          const hint=document.createElement('small');
          hint.className='lh-multi-hint';
          hint.textContent='Có thể chọn nhiều học sinh (Ctrl/Cmd + chọn hoặc chạm từng học sinh trên điện thoại).';
          label.appendChild(hint);
        }
      }
    });
  }
  function afterAdd(){[0,80,220,500].forEach(ms=>setTimeout(makeMulti,ms));}
  document.addEventListener('click',e=>{
    if(e.target.closest?.('[data-action="add-violation"],[data-action="add-reward"]'))afterAdd();
  },true);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',makeMulti,{once:true});
  else makeMulti();
})();
