/* ATTENDANCE STATUS STICKY 1.0
   Persist the user's selected attendance status by student + date.
   Restores it after any table rerender without touching the data engine.
*/
(function(){
  'use strict';
  if(window.__LH_ATTENDANCE_STATUS_STICKY_10__) return;
  window.__LH_ATTENDANCE_STATUS_STICKY_10__=true;

  const STATUS=[['present','Có mặt'],['excused','Có phép'],['absent','Không phép']];
  const VALID=new Set(STATUS.map(x=>x[0]));
  const STORE='LH_ATTENDANCE_STATUS_STICKY_10';
  const txt=v=>String(v==null?'':v).trim();
  const norm=v=>VALID.has(txt(v))?txt(v):'';
  const getDate=()=>txt(document.getElementById('attendanceDate')?.value);
  const isSelect=el=>!!(el&&el.matches&&el.matches('#attendanceTableBody select.attendance-status'));
  const sid=el=>txt(el?.dataset?.studentId||el?.closest?.('tr')?.dataset?.studentId);
  const key=(id,date)=>`${date}::${id}`;

  const sticky=new Map();
  try{
    const raw=sessionStorage.getItem(STORE);
    if(raw){
      const data=JSON.parse(raw);
      Object.keys(data||{}).forEach(k=>{
        const v=norm(data[k]);
        if(v) sticky.set(k,v);
      });
    }
  }catch(_){ }

  function persist(){
    try{
      const data={};
      sticky.forEach((v,k)=>{data[k]=v;});
      sessionStorage.setItem(STORE,JSON.stringify(data));
    }catch(_){ }
  }

  function remember(id,date,status){
    const v=norm(status);
    if(!id||!date||!v)return;
    sticky.set(key(id,date),v);
    persist();
  }

  function recalled(id,date){
    return sticky.get(key(id,date))||'';
  }

  function ensureOptions(select,desired){
    if(!isSelect(select))return;
    const values=[...select.options].map(o=>txt(o.value));
    const valid=values.length===3 && values.join('|')==='present|excused|absent';
    const keep=norm(desired)||norm(select.value)||'present';
    if(!valid){
      select.replaceChildren();
      STATUS.forEach(([v,l])=>{
        const o=document.createElement('option');
        o.value=v;
        o.textContent=l;
        select.appendChild(o);
      });
    }
    select.value=keep;
  }

  function restoreAll(){
    const date=getDate();
    if(!date)return;
    document.querySelectorAll('#attendanceTableBody select.attendance-status').forEach(s=>{
      const id=sid(s);
      const saved=recalled(id,date);
      const pending=norm(s.dataset.lhPendingStatus);
      const desired=saved||pending||norm(s.value)||'present';
      ensureOptions(s,desired);
      if(id) remember(id,date,desired);
    });
  }

  function scheduleRestore(){
    restoreAll();
    if(typeof queueMicrotask==='function') queueMicrotask(restoreAll);
    if(typeof requestAnimationFrame==='function') requestAnimationFrame(restoreAll);
    [0,20,80,180,350].forEach(ms=>setTimeout(restoreAll,ms));
  }

  function captureChange(select){
    if(!isSelect(select))return;
    const d=getDate();
    const id=sid(select);
    const v=norm(select.value);
    if(id&&d&&v)remember(id,d,v);
    select.dataset.lhPendingStatus=v||'present';
    select.dataset.lhStatusDate=d;
  }

  function bind(){
    document.addEventListener('change',e=>{
      if(isSelect(e.target)){
        captureChange(e.target);
        scheduleRestore();
        return;
      }
      if(e.target?.matches?.('#attendanceDate')) setTimeout(scheduleRestore,0);
    },true);

    document.addEventListener('pointerdown',e=>{
      const s=e.target?.closest?.('#attendanceTableBody select.attendance-status');
      if(s){
        const d=getDate();
        const id=sid(s);
        ensureOptions(s,recalled(id,d)||norm(s.value)||'present');
      }
    },true);

    document.addEventListener('click',e=>{
      if(e.target?.closest?.('#saveAttendance')){
        document.querySelectorAll('#attendanceTableBody select.attendance-status').forEach(captureChange);
      }
    },true);

    const hookBody=()=>{
      const body=document.getElementById('attendanceTableBody');
      if(!body||body.dataset.lhStickyBound==='1')return;
      body.dataset.lhStickyBound='1';
      new MutationObserver(()=>scheduleRestore()).observe(body,{childList:true,subtree:true});
    };
    hookBody();
    new MutationObserver(hookBody).observe(document.getElementById('page-attendance')||document.body,{childList:true,subtree:true});
  }

  function boot(){bind();scheduleRestore();}
  window.LHAttendanceSticky={restoreAll,scheduleRestore,captureChange,remember};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
