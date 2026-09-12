/* CLEAR CURRENT VIOLATIONS ONCE 2.0
 * Làm sạch toàn bộ bản ghi VI_PHAM hiện có trên Google Sheets + local data.
 * Chỉ chạy một lần cho đợt làm sạch 2026-09-12.
 * KHÔNG đụng Khen thưởng, Điểm danh, Học tập, SMAS hay danh sách học sinh.
 * Chờ dữ liệu đồng bộ xong trước khi đánh dấu hoàn tất, tránh dữ liệu quay lại.
 */
(function(){
  'use strict';
  const FLAG='LH_CLEAR_CURRENT_VIOLATIONS_ONCE_20260912';
  if(localStorage.getItem(FLAG)==='done') return;
  let busy=false;
  const clean=v=>String(v==null?'':v).trim();

  async function run(){
    if(busy || localStorage.getItem(FLAG)==='done') return;
    busy=true;
    try{
      const getter=window.getViolationRecords;
      const deleter=window.deleteViolation;
      if(typeof getter!=='function' || typeof deleter!=='function') return;

      const records=Array.isArray(getter())?[...getter()]:[];
      if(!records.length) return;

      let success=0;
      for(const r of records){
        const id=clean(r&&r.id);
        if(!id) continue;
        try{
          const ok=await deleter(id);
          if(ok) success++;
        }catch(e){console.warn('[CLEAR VIOLATIONS 2.0]',id,e)}
      }

      const remaining=Array.isArray(getter())?getter().length:0;
      if(remaining===0 && success===records.length){
        localStorage.setItem(FLAG,'done');
        try{if(window.__LH_BEHAVIOR_AI_API__)window.__LH_BEHAVIOR_AI_API__.refresh()}catch(_){ }
        try{if(typeof window.renderViolations==='function')window.renderViolations();}catch(_){ }
        try{if(typeof window.renderDashboard==='function')window.renderDashboard();}catch(_){ }
        try{if(typeof window.showToast==='function')window.showToast('Đã làm sạch toàn bộ Vi phạm. Có thể bắt đầu ghi nhận lại từ đầu.','success');}catch(_){ }
      }
    }catch(e){console.error('[CLEAR VIOLATIONS 2.0]',e)}
    finally{busy=false;}
  }

  function schedule(){setTimeout(run,1200)}
  window.addEventListener('google-sheets-data-ready',schedule,{once:true});
  window.addEventListener('google-sheets-refresh',schedule,{once:true});
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>setTimeout(run,4500),{once:true});
  else setTimeout(run,4500);
})();
