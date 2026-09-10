/* CLEAR CURRENT VIOLATIONS ONCE
 * Xóa một lần toàn bộ bản ghi Vi phạm hiện có khỏi Google Sheets + local data.
 * Không đụng Khen thưởng, Điểm danh, Học tập hoặc danh sách học sinh.
 * Tự khóa sau khi xóa thành công toàn bộ bản ghi hiện tại.
 */
(function(){
  'use strict';
  const FLAG='LH_CLEAR_CURRENT_VIOLATIONS_ONCE_20260910';
  if(localStorage.getItem(FLAG)==='done') return;
  let busy=false;
  const clean=v=>String(v==null?'':v).trim();
  async function run(){
    if(busy) return;
    busy=true;
    try{
      const getter=window.getViolationRecords;
      if(typeof getter!=='function'){busy=false;return;}
      const records=Array.isArray(getter())?[...getter()]:[];
      if(!records.length){
        localStorage.setItem(FLAG,'done');
        return;
      }
      const deleter=window.deleteViolation;
      if(typeof deleter!=='function'){busy=false;return;}
      let success=0;
      for(const r of records){
        const id=clean(r&&r.id);
        if(!id) continue;
        try{
          const ok=await deleter(id);
          if(ok) success++;
        }catch(e){console.warn('[CLEAR VIOLATIONS ONCE]',id,e)}
      }
      const remaining=Array.isArray(getter())?getter().length:0;
      if(remaining===0 || success===records.length){
        localStorage.setItem(FLAG,'done');
        try{if(window.__LH_BEHAVIOR_AI_API__)window.__LH_BEHAVIOR_AI_API__.refresh()}catch(_){ }
        try{if(typeof window.renderViolations==='function')window.renderViolations();}catch(_){ }
        try{if(typeof window.renderDashboard==='function')window.renderDashboard();}catch(_){ }
        try{if(typeof window.showToast==='function')window.showToast('Đã xóa toàn bộ bản ghi Vi phạm hiện có.','success');}catch(_){ }
      }
    }catch(e){console.error('[CLEAR VIOLATIONS ONCE]',e)}
    finally{busy=false;}
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>setTimeout(run,1800),{once:true});
  else setTimeout(run,1800);
})();