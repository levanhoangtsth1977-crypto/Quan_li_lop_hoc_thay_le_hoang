/* BEHAVIOR RECORDS DEDUPE 1.0
 * Chống trùng Vi phạm/Khen thưởng ở lớp dữ liệu và giao diện.
 * Không tự xóa Google Sheets; chỉ giữ một bản đại diện trong bộ nhớ và khi render.
 */
(function(){
  'use strict';
  if(window.__LH_BEHAVIOR_RECORDS_DEDUPE_10__) return;
  window.__LH_BEHAVIOR_RECORDS_DEDUPE_10__=true;

  const S=v=>String(v??'').trim().replace(/\s+/g,' ');
  const N=v=>S(v).toLocaleLowerCase('vi');
  const student=id=>{
    try{
      const list=Array.isArray(window.students)?window.students:[];
      const x=list.find(s=>S(s.id)===S(id));
      return x?S(x.name):S(id);
    }catch{return S(id)}
  };
  const key=(kind,r)=>{
    if(!r) return '';
    const base=[student(r.studentId),S(r.date),S(r.type),S(r.formType),S(r.level),S(r.status),S(r.action),S(r.note)];
    return kind+':'+base.map(N).join('|');
  };
  function dedupe(kind,list){
    const seen=new Set(),out=[];
    for(const r of Array.isArray(list)?list:[]){
      const k=key(kind,r);
      if(k && seen.has(k)) continue;
      if(k) seen.add(k);
      out.push(r);
    }
    return out;
  }
  function cleanLocal(){
    if(Array.isArray(window.violationRecords)){
      const clean=dedupe('violation',window.violationRecords);
      window.violationRecords.splice(0,window.violationRecords.length,...clean);
    }
    if(Array.isArray(window.rewardRecords)){
      const clean=dedupe('reward',window.rewardRecords);
      window.rewardRecords.splice(0,window.rewardRecords.length,...clean);
    }
    try{if(typeof window.syncAppDataReferences==='function')window.syncAppDataReferences()}catch{}
  }
  function beforeAdd(kind,studentId,date,type,extra){
    const list=kind==='violation'?window.violationRecords:window.rewardRecords;
    if(!Array.isArray(list)) return null;
    const probe=kind==='violation'
      ? {studentId,date,type,level:extra?.level,status:extra?.status,action:extra?.action,note:extra?.note}
      : {studentId,date,type,formType:extra?.formType,note:extra?.note};
    const k=key(kind,probe);
    return list.find(r=>key(kind,r)===k)||null;
  }
  function wrapAdd(name,kind){
    const marker='__LH_DEDUPE_WRAP_'+name;
    if(window[marker]||typeof window[name]!=='function') return;
    const old=window[name];
    window[marker]=true;
    window[name]=function(data){
      const d=data&&typeof data==='object'?data:{};
      const existing=beforeAdd(kind,d.studentId,d.date||'',d.type||'',d);
      if(existing){
        return {success:true,duplicate:true,record:existing,message:'Bản ghi trùng đã tồn tại; không tạo thêm bản ghi mới.'};
      }
      const result=old.apply(this,arguments);
      cleanLocal();
      return result;
    };
  }
  function refresh(){
    cleanLocal();
    try{
      if(typeof window.renderViolations==='function')window.renderViolations();
      if(typeof window.renderRewards==='function')window.renderRewards();
      if(window.__LH_BEHAVIOR_AI_API__?.refresh)window.__LH_BEHAVIOR_AI_API__.refresh();
    }catch{}
  }
  function init(){
    wrapAdd('addViolation','violation');
    wrapAdd('addReward','reward');
    refresh();
  }
  ['google-sheets-data-ready','google-sheets-refresh','data-changed','records-updated','google-sheet-record-saved'].forEach(ev=>window.addEventListener(ev,refresh));
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,0),{once:true});
  else setTimeout(init,0);
  window.__LH_BEHAVIOR_DEDUPE_API__={refresh,cleanLocal,dedupe,key};
})();
