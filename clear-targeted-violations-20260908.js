/* CLEAR VI_PHAM ONCE — 2026-09-13
 * Dọn sạch toàn bộ bản ghi hiện có trong VI_PHAM.
 * Chỉ tác động VI_PHAM; không đụng các sheet/menu khác.
 * Sau khi dọn, dữ liệu mới chỉ được tạo khi giáo viên thực sự ghi nhận.
 */
(function(){
  'use strict';
  const FLAG='LH_VIOLATION_FULL_CLEAN_20260913_DONE';
  if(localStorage.getItem(FLAG)==='done') return;
  const clean=v=>String(v==null?'':v).trim();

  async function run(){
    const getter=window.getViolationRecords;
    const deleter=window.deleteViolation;
    if(typeof getter!=='function' || typeof deleter!=='function') return false;

    const records=Array.isArray(getter())?[...getter()]:[];
    let ok=0;
    for(const r of records){
      const id=clean(r&&r.id);
      if(!id) continue;
      try{ if(await deleter(id)) ok++; }catch(e){ console.warn('[CLEAR VI_PHAM]',id,e); }
    }

    const remaining=Array.isArray(getter())?getter():[];
    if(remaining.length===0){
      localStorage.setItem(FLAG,'done');
      try{ if(typeof window.renderViolations==='function') window.renderViolations(); }catch(e){}
      try{ if(typeof window.renderDashboard==='function') window.renderDashboard(); }catch(e){}
      try{ if(typeof window.showToast==='function') window.showToast('Đã dọn sạch danh sách Vi phạm. Có thể bắt đầu ghi nhận lại từ đầu.','success'); }catch(e){}
      return true;
    }
    return false;
  }

  function schedule(){
    setTimeout(()=>run().catch(e=>console.error('[CLEAR VI_PHAM]',e)),1500);
  }

  window.addEventListener('google-sheets-data-ready',schedule,{once:true});
  window.addEventListener('google-sheets-refresh',schedule,{once:true});
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>setTimeout(run,5000),{once:true});
  else setTimeout(run,5000);
})();
