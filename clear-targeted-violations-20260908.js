/* TARGETED VIOLATION CLEANUP — 2026-09-08
 * Chỉ xóa các bản ghi VI_PHAM khớp đúng ngày + nội dung + học sinh được chỉ định.
 * KHÔNG đụng DIEM_DANH, KHEN_THUONG, HOC_TAP, danh sách học sinh hay menu khác.
 * Chạy một lần trên trình duyệt sau khi dữ liệu Google Sheets sẵn sàng.
 */
(function(){
  'use strict';
  const FLAG='LH_TARGETED_VIOLATION_CLEANUP_20260908_DONE';
  if(localStorage.getItem(FLAG)==='done') return;

  const NOTE='Chơi trượt nước trên hành lang trường lúc trời mưa rất nguy hiểm';
  const TARGET_NAMES=new Set([
    'Huỳnh Hữu Nam',
    'Ngô Sinh Khởi',
    'Nguyễn Đăng Trường',
    'Phạm Minh Đức',
    'Huỳnh Đặng Quốc Hoàng',
    'Đinh Nguyễn Anh Phong',
    'Tạ Trí Khang'
  ]);
  const clean=v=>String(v==null?'':v).trim().replace(/\s+/g,' ');
  const normDate=v=>{
    const s=clean(v);
    if(/^2026-09-08$/.test(s)) return s;
    const m=s.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);
    if(m) return m[3]+'-'+String(m[2]).padStart(2,'0')+'-'+String(m[1]).padStart(2,'0');
    return s;
  };
  const getName=r=>{
    const sid=clean(r&&r.studentId);
    const direct=clean(r&&r.studentName||r&&r.name);
    if(direct) return direct;
    try{
      const list=Array.isArray(window.students)?window.students:[];
      const s=list.find(x=>clean(x&&x.id)===sid);
      return clean(s&&s.name);
    }catch(e){ return ''; }
  };

  async function run(){
    const getter=window.getViolationRecords;
    const deleter=window.deleteViolation;
    if(typeof getter!=='function' || typeof deleter!=='function') return false;

    const records=Array.isArray(getter())?[...getter()]:[];
    const targets=records.filter(r=>
      normDate(r&&r.date)==='2026-09-08' &&
      clean(r&&r.note)===NOTE &&
      TARGET_NAMES.has(getName(r))
    );
    if(!targets.length){
      localStorage.setItem(FLAG,'done');
      return true;
    }

    let success=0;
    for(const r of targets){
      const id=clean(r&&r.id);
      if(!id) continue;
      try{
        if(await deleter(id)) success++;
      }catch(e){
        console.warn('[TARGETED VIOLATION CLEANUP]',id,e);
      }
    }

    const remaining=(Array.isArray(getter())?getter():[]).filter(r=>
      normDate(r&&r.date)==='2026-09-08' &&
      clean(r&&r.note)===NOTE &&
      TARGET_NAMES.has(getName(r))
    );
    if(remaining.length===0){
      localStorage.setItem(FLAG,'done');
      try{ if(typeof window.renderViolations==='function') window.renderViolations(); }catch(e){}
      try{ if(typeof window.renderDashboard==='function') window.renderDashboard(); }catch(e){}
      try{ if(typeof window.showToast==='function') window.showToast('Đã dọn sạch các bản ghi Vi phạm ngày 08/09/2026 được chỉ định.','success'); }catch(e){}
      return true;
    }
    return false;
  }

  function schedule(){
    setTimeout(async()=>{
      try{ await run(); }catch(e){ console.error('[TARGETED VIOLATION CLEANUP]',e); }
    },1200);
  }

  window.addEventListener('google-sheets-data-ready',schedule,{once:true});
  window.addEventListener('google-sheets-refresh',schedule,{once:true});
  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',()=>setTimeout(run,5000),{once:true});
  }else{
    setTimeout(run,5000);
  }
})();
