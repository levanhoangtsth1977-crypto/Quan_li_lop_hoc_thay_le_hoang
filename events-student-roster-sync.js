/* EVENT STUDENT ROSTER SYNC 1.0
 * Chỉ phụ trách dropdown #evStudent của form Vi phạm/Khen thưởng.
 * Nguồn ưu tiên: getStudentsSafe() -> students[] -> GOOGLE_SHEETS_STUDENTS -> GOOGLE_SHEET_DATA.tabs.HOC_SINH.
 * Không thay đổi dữ liệu sự kiện, router hoặc các select khác.
 */
(function(){
  'use strict';
  if(window.__LH_EVENT_STUDENT_ROSTER_SYNC_10__) return;
  window.__LH_EVENT_STUDENT_ROSTER_SYNC_10__=true;

  const clean=v=>String(v??'').trim().replace(/\s+/g,' ');
  const esc=v=>clean(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');

  function source(){
    const out=[];
    try{
      if(typeof window.getStudentsSafe==='function'){
        const a=window.getStudentsSafe();
        if(Array.isArray(a)) out.push(...a);
      }
    }catch(_){}
    if(Array.isArray(window.students)) out.push(...window.students);
    if(Array.isArray(window.GOOGLE_SHEETS_STUDENTS)) out.push(...window.GOOGLE_SHEETS_STUDENTS);
    const tab=window.GOOGLE_SHEET_DATA?.tabs?.HOC_SINH;
    if(Array.isArray(tab)) out.push(...tab);

    const seen=new Set();
    return out.map((s,i)=>({
      id:clean(s?.id||s?.studentId||s?.studentCode||s?.code),
      name:clean(s?.name||s?.studentName||s?.fullName),
      stt:Number(s?.stt)||i+1
    })).filter(s=>s.id&&s.name&&!seen.has(s.id)&&seen.add(s.id))
      .sort((a,b)=>a.stt-b.stt||a.name.localeCompare(b.name,'vi'));
  }

  function patch(){
    const select=document.getElementById('evStudent');
    if(!select) return;
    const roster=source();
    if(!roster.length) return;

    const selected=clean(select.value);
    const current=Array.from(select.options).filter(o=>clean(o.value));
    const currentIds=new Set(current.map(o=>clean(o.value)));
    const same=current.length===roster.length && roster.every(s=>currentIds.has(s.id));
    if(same) return;

    const frag=document.createDocumentFragment();
    const placeholder=document.createElement('option');
    placeholder.value='';
    placeholder.textContent='Chọn học sinh';
    frag.appendChild(placeholder);
    roster.forEach(s=>{
      const o=document.createElement('option');
      o.value=s.id;
      o.textContent=s.name;
      frag.appendChild(o);
    });
    select.replaceChildren(frag);
    select.value=roster.some(s=>s.id===selected)?selected:'';
    select.dataset.lhRosterCount=String(roster.length);
    select.setAttribute('aria-label','Chọn học sinh');
  }

  let queued=false;
  function schedule(){
    if(queued) return;
    queued=true;
    requestAnimationFrame(()=>{queued=false;patch();});
  }

  function boot(){
    patch();
    window.addEventListener('google-sheets-data-ready',schedule);
    document.addEventListener('click',e=>{
      const b=e.target?.closest?.('#evAdd,[data-action="add-violation"],[data-action="add-reward"],[data-detail]');
      if(b) setTimeout(schedule,0);
    },true);
    const obs=new MutationObserver(muts=>{
      for(const m of muts){
        if(m.type==='childList' && Array.from(m.addedNodes||[]).some(n=>n.nodeType===1)){
          schedule();
          break;
        }
      }
    });
    obs.observe(document.body,{childList:true,subtree:true});
    window.setInterval(()=>{ if(document.getElementById('evStudent')) patch(); },1500);
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();