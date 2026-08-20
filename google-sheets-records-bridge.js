/* GOOGLE SHEETS RECORDS BRIDGE 1.0
   Purpose:
   - Keep HOC_SINH untouched: full class roster remains authoritative.
   - Sync DIEM_DANH / VI_PHAM / KHEN_THUONG through the existing Apps Script web app.
   - DIEM_DANH writes only excused/absent records; present is never stored.
   - Pull event records from Sheets and merge them into the local data engine.
   - Never break the existing UI when Google is unavailable.
*/
(function(){
  'use strict';
  if(window.__LH_GOOGLE_RECORDS_BRIDGE_100__)return;
  window.__LH_GOOGLE_RECORDS_BRIDGE_100__=true;

  const API='https://script.google.com/macros/s/AKfycbynklm7SobnkcEZKfAUGdMIBugA4lQ2kA3yOThHVjNoiJzCK7veuwO2vE1tR1QKI-nkIQ/exec';
  const TABS=['DIEM_DANH','VI_PHAM','KHEN_THUONG'];
  let syncing=false;
  let installed=false;

  const clean=v=>String(v??'').trim().replace(/\s+/g,' ');
  const jsonp=action=>new Promise((resolve,reject)=>{
    const cb='LH_REC_'+Date.now()+'_'+Math.random().toString(36).slice(2);
    const s=document.createElement('script');
    const timer=setTimeout(()=>finish(Error('Google Sheets timeout')),15000);
    function finish(err,data){clearTimeout(timer);try{delete window[cb]}catch(_){}s.remove();err?reject(err):resolve(data)}
    window[cb]=d=>finish(null,d);
    s.onerror=()=>finish(Error('Không truy cập được Google Apps Script'));
    s.src=API+'?action='+encodeURIComponent(action)+'&callback='+encodeURIComponent(cb)+'&_='+Date.now();
    document.head.appendChild(s);
  });

  function post(payload){
    return new Promise((resolve,reject)=>{
      const name='LH_REC_POST_'+Date.now();
      const iframe=document.createElement('iframe');
      const form=document.createElement('form');
      iframe.name=name;iframe.style.display='none';
      form.method='POST';form.target=name;form.action=API;form.style.display='none';
      const input=document.createElement('input');
      input.type='hidden';input.name='payload';input.value=JSON.stringify(payload);
      form.appendChild(input);document.body.append(iframe,form);
      let done=false;
      const finish=ok=>{if(done)return;done=true;setTimeout(()=>{iframe.remove();form.remove()},500);ok?resolve({ok:true}):reject(Error('Không gửi được dữ liệu Google Sheets'))};
      iframe.onload=()=>finish(true);
      try{form.submit()}catch(e){finish(false)}
      setTimeout(()=>finish(true),12000);
    });
  }

  function arr(name){try{return Array.isArray(window[name])?window[name]:[]}catch(_){return[]}}
  function idOf(r){return clean(r&&r.id)}
  function mergeById(targetName,incoming){
    const target=arr(targetName),map=new Map(target.map(r=>[idOf(r),r]));
    (Array.isArray(incoming)?incoming:[]).forEach(r=>{
      const id=idOf(r);if(!id)return;
      const old=map.get(id);
      if(old)Object.assign(old,r);else target.push(r);
    });
    return target;
  }

  function snapshot(){
    return {
      DIEM_DANH:arr('attendanceRecords').filter(r=>!/^present$/i.test(clean(r.status))),
      VI_PHAM:arr('violationRecords').filter(r=>clean(r.studentId)),
      KHEN_THUONG:arr('rewardRecords').filter(r=>clean(r.studentId))
    };
  }

  function pullIntoApp(data){
    if(!data||data.ok!==true)return false;
    mergeById('attendanceRecords',data.DIEM_DANH||[]);
    mergeById('violationRecords',data.VI_PHAM||[]);
    mergeById('rewardRecords',data.KHEN_THUONG||[]);
    try{if(typeof window.syncAppDataReferences==='function')window.syncAppDataReferences()}catch(_){}
    try{if(typeof window.renderAttendance==='function')window.renderAttendance()}catch(_){}
    try{if(typeof window.renderViolations==='function')window.renderViolations()}catch(_){}
    try{if(typeof window.renderRewards==='function')window.renderRewards()}catch(_){}
    window.GOOGLE_SHEET_EVENT_DATA={version:'1.0',loadedAt:new Date().toISOString(),tabs:data};
    return true;
  }

  async function pull(){
    try{const data=await jsonp('get_events');pullIntoApp(data);return data}
    catch(e){console.warn('[GOOGLE RECORDS] pull:',e.message);return null}
  }

  async function push(){
    if(syncing)return {ok:false,busy:true};
    syncing=true;
    try{
      const result=await post({action:'sync_events',records:snapshot()});
      window.GOOGLE_SHEET_EVENT_SYNC={ok:true,at:new Date().toISOString(),result};
      return result;
    }catch(e){
      window.GOOGLE_SHEET_EVENT_SYNC={ok:false,at:new Date().toISOString(),error:e.message};
      console.warn('[GOOGLE RECORDS] push:',e.message);
      return {ok:false,error:e.message};
    }finally{syncing=false}
  }

  function wrap(name){
    if(typeof window[name]!=='function'||window[name].__lhWrapped)return;
    const original=window[name];
    function wrapped(){
      const result=original.apply(this,arguments);
      setTimeout(()=>push(),100);
      return result;
    }
    wrapped.__lhWrapped=true;
    wrapped.__lhOriginal=original;
    window[name]=wrapped;
  }

  function installWrappers(){
    if(installed)return;
    ['saveAttendanceRecord','addViolation','deleteViolation','addReward','deleteReward'].forEach(wrap);
    installed=true;
  }

  async function boot(){
    installWrappers();
    await pull();
    installWrappers();
    if(window.__LH_GOOGLE_RECORDS_TIMER__)clearInterval(window.__LH_GOOGLE_RECORDS_TIMER__);
    window.__LH_GOOGLE_RECORDS_TIMER__=setInterval(()=>{installWrappers();},1000);
  }

  window.syncGoogleSheetEvents=push;
  window.pullGoogleSheetEvents=pull;
  window.getGoogleSheetEventData=()=>window.GOOGLE_SHEET_EVENT_DATA||null;

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,1200),{once:true});
  else setTimeout(boot,1200);
})();