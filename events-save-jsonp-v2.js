/* EVENTS SAVE JSONP V2.4 — proven save_event contract */
(function(){
  'use strict';
  if(window.__LH_EVENTS_SAVE_JSONP_V24__) return;
  window.__LH_EVENTS_SAVE_JSONP_V24__=true;
  const API='https://script.google.com/macros/s/AKfycbxTPwf-jhrR8JOoKY5ZLuzlsDgcv3nWILtDPTrYNWZCEPpm2rkpXTn-sPAdFaUyy0z_uw/exec';
  const S=v=>String(v??'').trim();
  function jsonp(action,params){
    return new Promise((resolve,reject)=>{
      const cb='__LH_EVT_SAVE24_'+Date.now()+'_'+Math.random().toString(36).slice(2);
      const s=document.createElement('script');let done=false;
      const finish=(err,data)=>{if(done)return;done=true;clearTimeout(timer);try{delete window[cb]}catch(_){window[cb]=undefined}s.remove();err?reject(err):resolve(data)};
      const timer=setTimeout(()=>finish(new Error('Google Apps Script không phản hồi sau 20 giây.')),20000);
      window[cb]=data=>finish(null,data);s.onerror=()=>finish(new Error('Không thể kết nối Google Apps Script.'));
      const q=new URLSearchParams({action,callback:cb,_:String(Date.now())});
      Object.entries(params||{}).forEach(([k,v])=>q.set(k,S(v)));
      s.src=API+'?'+q.toString();document.head.appendChild(s);
    });
  }
  function toast(msg,type){
    if(typeof window.showToast==='function')window.showToast(msg,type||'info');
    else if(typeof window.toast==='function')window.toast(msg,type||'info');
    else console.info(msg);
  }
  async function save(btn,modal){
    const get=id=>modal.querySelector('#'+id);
    const studentEl=get('eStudent');
    const ids=studentEl?.multiple
      ? Array.from(studentEl.selectedOptions||[]).map(o=>S(o.value)).filter(Boolean)
      : [S(studentEl?.value)];
    const checked=Array.from(modal.querySelectorAll?.('.lh-csp-list input[type="checkbox"]:checked')||[]).map(x=>S(x.value)).filter(Boolean);
    const allIds=[...new Set(ids.filter(Boolean).concat(checked))];
    const type=S(get('eType')?.value);
    const date=S(get('eDate')?.value)||new Date().toISOString().slice(0,10);
    const note=S(get('eNote')?.value);
    if(!allIds.length||!type){toast('Vui lòng chọn học sinh và nội dung.','warning');return;}
    const isViolation=!!get('eLevel');
    const base={studentId:'',date,type,note};
    if(isViolation){
      base.level=S(get('eLevel')?.value)||'light';
      base.status=S(get('eStatus')?.value)||'monitoring';
      base.action=S(get('eAction')?.value);
    }else base.formType=S(get('eForm')?.value)||'praise';
    const sheet=isViolation?'VI_PHAM':'KHEN_THUONG';
    const old=btn.innerHTML;btn.disabled=true;btn.innerHTML='Đang lưu...';
    try{
      for(const studentId of allIds){
        const record={...base,studentId};
        const result=await jsonp('save_event',{sheet,record:JSON.stringify(record)});
        if(!result?.ok||!(result.saved===true||result.stored===true))throw new Error(result?.error||`Google Sheets chưa xác nhận lưu cho học sinh ${studentId}.`);
      }
      modal.remove();
      toast(isViolation?`Đã lưu ${allIds.length} học sinh vi phạm thành công.`:`Đã lưu ${allIds.length} học sinh khen thưởng thành công.`,'success');
      try{if(typeof window.syncGoogleSheetsNow==='function')await window.syncGoogleSheetsNow()}catch(_){ }
      try{
        if(typeof window.refreshAll==='function')window.refreshAll();
        if(typeof window.renderViolations==='function')window.renderViolations();
        if(typeof window.renderRewards==='function')window.renderRewards();
      }catch(_){ }
    }catch(err){
      btn.disabled=false;btn.innerHTML=old;
      toast('Lưu thất bại: '+S(err?.message||err),'error');
    }
  }
  document.addEventListener('click',function(event){
    const btn=event.target?.closest?.('.ev-static-modal #eSave');if(!btn)return;
    const modal=btn.closest('.ev-static-modal');if(!modal)return;
    event.preventDefault();event.stopImmediatePropagation();save(btn,modal);
  },true);
})();
