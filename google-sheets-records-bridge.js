/* GOOGLE SHEETS RECORDS BRIDGE 2.0 — AUTHORITATIVE EVENT REPLACE
   - HOC_SINH remains the full authoritative roster and is untouched.
   - DIEM_DANH on the Web contains ONLY records returned from Google Sheets that are not PRESENT.
   - VI_PHAM on the Web contains ONLY actual violation records returned from Google Sheets.
   - KHEN_THUONG on the Web contains ONLY actual reward records returned from Google Sheets.
   - Google Sheets is authoritative for the three event arrays.
   - Pull REPLACES event arrays; it never merges stale browser records into them.
   - Existing menus/functions are not modified; only the Google event bridge is patched.
*/
(function(){
  'use strict';
  if(window.__LH_GOOGLE_RECORDS_BRIDGE_200__)return;
  window.__LH_GOOGLE_RECORDS_BRIDGE_200__=true;

  const API='https://script.google.com/macros/s/AKfycbynklm7SobnkcEZKfAUGdMIBugA4lQ2kA3yOThHVjNoiJzCK7veuwO2vE1tR1QKI-nkIQ/exec';
  let syncing=false;
  let installed=false;
  const clean=v=>String(v??'').trim().replace(/\s+/g,' ');

  function records(name){
    try{
      if(name==='attendanceRecords'&&Array.isArray(attendanceRecords))return attendanceRecords;
      if(name==='violationRecords'&&Array.isArray(violationRecords))return violationRecords;
      if(name==='rewardRecords'&&Array.isArray(rewardRecords))return rewardRecords;
    }catch(_){}
    try{return Array.isArray(window[name])?window[name]:[]}catch(_){return[]}
  }

  function replaceArray(name,incoming){
    const target=records(name);
    const source=Array.isArray(incoming)?incoming:[];
    target.splice(0,target.length,...source);
    return target;
  }

  const jsonp=action=>new Promise((resolve,reject)=>{
    const cb='LH_REC_'+Date.now()+'_'+Math.random().toString(36).slice(2),s=document.createElement('script');
    const timer=setTimeout(()=>finish(Error('Google Sheets timeout')),15000);
    function finish(err,data){clearTimeout(timer);try{delete window[cb]}catch(_){}s.remove();err?reject(err):resolve(data)}
    window[cb]=d=>finish(null,d);s.onerror=()=>finish(Error('Không truy cập được Google Apps Script'));
    s.src=API+'?action='+encodeURIComponent(action)+'&callback='+encodeURIComponent(cb)+'&_='+Date.now();document.head.appendChild(s);
  });

  function post(payload){
    return new Promise((resolve,reject)=>{
      const name='LH_REC_POST_'+Date.now(),iframe=document.createElement('iframe'),form=document.createElement('form');
      iframe.name=name;iframe.style.display='none';form.method='POST';form.target=name;form.action=API;form.style.display='none';
      const input=document.createElement('input');input.type='hidden';input.name='payload';input.value=JSON.stringify(payload);form.appendChild(input);document.body.append(iframe,form);
      let done=false;
      const finish=ok=>{if(done)return;done=true;setTimeout(()=>{iframe.remove();form.remove()},500);ok?resolve({ok:true}):reject(Error('Không gửi được dữ liệu Google Sheets'))};
      iframe.onload=()=>finish(true);
      try{form.submit()}catch(e){finish(false)}
      setTimeout(()=>finish(true),12000);
    });
  }

  function snapshot(){
    return {
      DIEM_DANH:records('attendanceRecords').filter(r=>!/^present$/i.test(clean(r.status))&&clean(r.studentId)),
      VI_PHAM:records('violationRecords').filter(r=>clean(r.studentId)),
      KHEN_THUONG:records('rewardRecords').filter(r=>clean(r.studentId))
    };
  }

  function pullIntoApp(data){
    if(!data||data.ok!==true)return false;

    /* GOOGLE SHEETS IS AUTHORITATIVE FOR EVENT ARRAYS.
       REPLACE — NEVER MERGE — TO PREVENT STALE 42-STUDENT DATA. */
    replaceArray(
      'attendanceRecords',
      (data.DIEM_DANH||[]).filter(r=>!/^present$/i.test(clean(r.status))&&clean(r.studentId))
    );

    replaceArray(
      'violationRecords',
      (data.VI_PHAM||[]).filter(r=>clean(r.studentId))
    );

    replaceArray(
      'rewardRecords',
      (data.KHEN_THUONG||[]).filter(r=>clean(r.studentId))
    );

    try{if(typeof syncAppDataReferences==='function')syncAppDataReferences()}catch(_){}
    try{if(typeof renderAttendance==='function')renderAttendance()}catch(_){}
    try{if(typeof renderViolations==='function')renderViolations()}catch(_){}
    try{if(typeof renderRewards==='function')renderRewards()}catch(_){}

    window.GOOGLE_SHEET_EVENT_DATA={
      version:'2.0',
      mode:'REPLACE',
      loadedAt:new Date().toISOString(),
      tabs:data
    };
    return true;
  }

  async function pull(){
    try{
      const data=await jsonp('get_events');
      pullIntoApp(data);
      return data;
    }catch(e){
      console.warn('[GOOGLE RECORDS] pull:',e.message);
      return null;
    }
  }

  async function push(){
    if(syncing)return{ok:false,busy:true};
    syncing=true;
    try{
      const result=await post({action:'sync_events',records:snapshot()});
      window.GOOGLE_SHEET_EVENT_SYNC={ok:true,at:new Date().toISOString(),result};
      return result;
    }catch(e){
      window.GOOGLE_SHEET_EVENT_SYNC={ok:false,at:new Date().toISOString(),error:e.message};
      console.warn('[GOOGLE RECORDS] push:',e.message);
      return{ok:false,error:e.message};
    }finally{
      syncing=false;
    }
  }

  function wrap(name){
    if(typeof window[name]!=='function'||window[name].__lhWrapped)return;
    const original=window[name];
    function wrapped(){
      const result=original.apply(this,arguments);
      setTimeout(async()=>{
        await push();
        await pull();
      },100);
      return result;
    }
    wrapped.__lhWrapped=true;
    wrapped.__lhOriginal=original;
    window[name]=wrapped;
  }

  function installWrappers(){
    ['saveAttendanceRecord','addViolation','deleteViolation','addReward','deleteReward'].forEach(wrap);
    installed=true;
  }

  async function boot(){
    installWrappers();
    await pull();
    installWrappers();
    if(window.__LH_GOOGLE_RECORDS_TIMER__)clearInterval(window.__LH_GOOGLE_RECORDS_TIMER__);
    window.__LH_GOOGLE_RECORDS_TIMER__=setInterval(installWrappers,1000);
  }

  window.syncGoogleSheetEvents=push;
  window.pullGoogleSheetEvents=pull;
  window.getGoogleSheetEventData=()=>window.GOOGLE_SHEET_EVENT_DATA||null;

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,1200),{once:true});
  }else{
    setTimeout(boot,1200);
  }
})();