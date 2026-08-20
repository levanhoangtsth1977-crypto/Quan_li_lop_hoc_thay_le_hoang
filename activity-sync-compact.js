/* ============================================================
   ACTIVITY SYNC COMPACT 1.0
   - DIEM_DANH: Google Sheets chỉ lưu Có phép / Vắng.
   - VI_PHAM: chỉ lưu bản ghi vi phạm thực tế.
   - KHEN_THUONG: chỉ lưu bản ghi khen thưởng thực tế.
   - Không đụng HOC_SINH và không thay đổi menu/UI.
   ============================================================ */
(function(){
  'use strict';
  if(window.__LH_ACTIVITY_SYNC_COMPACT_100__) return;
  window.__LH_ACTIVITY_SYNC_COMPACT_100__=true;

  const API='https://script.google.com/macros/s/AKfycbynklm7SobnkcEZKfAUGdMIBugA4lQ2kA3yOThHVjNoiJzCK7veuwO2vE1tR1QKI-nkIQ/exec';
  const clean=v=>String(v??'').trim();

  function records(name){
    try{
      if(typeof window[name]==='function'){
        const r=window[name]();
        if(Array.isArray(r)) return r.slice();
      }
    }catch(_){ }
    const r=window[name];
    return Array.isArray(r)?r.slice():[];
  }

  function post(payload){
    return new Promise((resolve,reject)=>{
      const frame=document.createElement('iframe');
      const form=document.createElement('form');
      const name='LH_ACTIVITY_'+Date.now()+'_'+Math.random().toString(36).slice(2);
      frame.name=name;frame.style.display='none';
      form.method='POST';form.action=API;form.target=name;form.style.display='none';
      const input=document.createElement('input');
      input.type='hidden';input.name='payload';input.value=JSON.stringify(payload);
      form.appendChild(input);document.body.append(frame,form);
      let done=false;
      const finish=ok=>{if(done)return;done=true;setTimeout(()=>{frame.remove();form.remove()},700);ok?resolve({ok:true}):reject(new Error('Không gửi được dữ liệu nghiệp vụ tới Google Apps Script.'))};
      frame.onload=()=>finish(true);
      try{form.submit()}catch(e){finish(false)}
      setTimeout(()=>finish(true),12000);
    });
  }

  function compactAttendance(list){
    return list.filter(r=>r&&clean(r.studentId)&&clean(r.date)&&clean(r.id)&&clean(r.status)!=='present');
  }

  async function syncTab(tab,list){
    const recordsToSend=tab==='DIEM_DANH'?list.filter(r=>r&&clean(r.studentId)&&clean(r.date)&&clean(r.id)):list.filter(r=>r&&clean(r.studentId)&&clean(r.date)&&clean(r.id));
    return post({action:'sync_activity',tab,records:recordsToSend});
  }

  async function syncAll(){
    const attendance=records('getAttendanceRecords');
    const violations=records('getViolationRecords');
    const rewards=records('getRewardRecords');
    const out={attendance:compactAttendance(attendance).length,violations:violations.length,rewards:rewards.length};
    await syncTab('DIEM_DANH',attendance);
    await syncTab('VI_PHAM',violations);
    await syncTab('KHEN_THUONG',rewards);
    window.__LH_ACTIVITY_SYNC_LAST__={...out,at:new Date().toISOString()};
    return {ok:true,...out};
  }

  async function deleteRecord(tab,id){
    if(!clean(id)) return {ok:false};
    return post({action:'delete_activity',tab,id});
  }

  window.syncActivityToGoogleSheets=syncAll;
  window.syncCompactActivityToGoogleSheets=syncAll;

  function wrap(name,after){
    if(typeof window[name]!=='function'||window[name].__LH_ACTIVITY_WRAPPED__) return false;
    return true;
  }

  function install(){
    if(window.__LH_ACTIVITY_WRAPPERS_INSTALLED__) return;
    const needed=['saveAttendance','handleViolationFormSubmit','handleRewardFormSubmit','handleRecordDelete'];
    if(needed.some(n=>typeof window[n]!=='function')) return false;

    const originalAttendance=window.saveAttendance;
    window.saveAttendance=function(){
      const result=originalAttendance.apply(this,arguments);
      setTimeout(()=>syncAll().catch(e=>console.warn('[ACTIVITY SYNC]',e)),150);
      return result;
    };
    window.saveAttendance.__LH_ACTIVITY_WRAPPED__=true;

    const originalViolation=window.handleViolationFormSubmit;
    window.handleViolationFormSubmit=function(event){
      const result=originalViolation.apply(this,arguments);
      setTimeout(()=>syncTab('VI_PHAM',records('getViolationRecords')).catch(e=>console.warn('[ACTIVITY SYNC]',e)),150);
      return result;
    };
    window.handleViolationFormSubmit.__LH_ACTIVITY_WRAPPED__=true;

    const originalReward=window.handleRewardFormSubmit;
    window.handleRewardFormSubmit=function(event){
      const result=originalReward.apply(this,arguments);
      setTimeout(()=>syncTab('KHEN_THUONG',records('getRewardRecords')).catch(e=>console.warn('[ACTIVITY SYNC]',e)),150);
      return result;
    };
    window.handleRewardFormSubmit.__LH_ACTIVITY_WRAPPED__=true;

    const originalDelete=window.handleRecordDelete;
    window.handleRecordDelete=function(event){
      const violation=event&&event.target&&event.target.closest?event.target.closest('[data-violation-delete]'):null;
      const reward=event&&event.target&&event.target.closest?event.target.closest('[data-reward-delete]'):null;
      const tab=violation?'VI_PHAM':reward?'KHEN_THUONG':'';
      const id=violation?.dataset?.violationDelete||reward?.dataset?.rewardDelete||'';
      const result=originalDelete.apply(this,arguments);
      if(tab&&id){
        setTimeout(()=>deleteRecord(tab,id).catch(e=>console.warn('[ACTIVITY SYNC]',e)),150);
      }
      return result;
    };
    window.handleRecordDelete.__LH_ACTIVITY_WRAPPED__=true;

    window.__LH_ACTIVITY_WRAPPERS_INSTALLED__=true;
    return true;
  }

  let tries=0;
  const timer=setInterval(()=>{tries++;if(install()||tries>240)clearInterval(timer)},50);
  window.__LH_ACTIVITY_SYNC_STATUS__={version:'1.0',policy:'COMPACT_ACTIVITY',attendance:'ABSENT_EXCUSED_ONLY',violations:'EVENT_ONLY',rewards:'EVENT_ONLY',at:new Date().toISOString()};
})();
