/* EVENTS SAVE JSONP V2.2 — isolated save bridge
 * Vi phạm/Khen thưởng: hỗ trợ 1 hoặc nhiều học sinh trong cùng một lần ghi nhận.
 * Chỉ xử lý modal ev-static-modal; không chạm router/menu khác.
 */
(function(){
  'use strict';
  if(window.__LH_EVENTS_SAVE_JSONP_V22__) return;
  window.__LH_EVENTS_SAVE_JSONP_V22__=true;

  const API='https://script.google.com/macros/s/AKfycbxTPwf-jhrR8JOoKY5ZLuzlsDgcv3nWILtDPTrYNWZCEPpm2rkpXTn-sPAdFaUyy0z_uw/exec';
  const S=v=>String(v??'').trim();

  function jsonp(action,params){
    return new Promise((resolve,reject)=>{
      const cb='__LH_EVT_SAVE22_'+Date.now()+'_'+Math.random().toString(36).slice(2);
      const s=document.createElement('script');
      let done=false;
      const finish=(err,data)=>{
        if(done)return;
        done=true;clearTimeout(timer);
        try{delete window[cb]}catch(_){window[cb]=undefined}
        s.remove();err?reject(err):resolve(data);
      };
      const timer=setTimeout(()=>finish(new Error('Google Apps Script không phản hồi sau 20 giây.')),20000);
      window[cb]=data=>finish(null,data);
      s.onerror=()=>finish(new Error('Không thể kết nối Google Apps Script.'));
      const q=new URLSearchParams();
      q.set('action',action);q.set('callback',cb);q.set('_',String(Date.now()));
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
    const type=S(get('eType')?.value);
    const date=S(get('eDate')?.value)||new Date().toISOString().slice(0,10);
    const note=S(get('eNote')?.value);
    if(!ids.length||!type){toast('Vui lòng chọn học sinh và nội dung.','warning');return;}

    const isViolation=!!get('eLevel');
    const base={studentId:'',date,type,note};
    if(isViolation){
      base.level=S(get('eLevel')?.value)||'light';
      base.status=S(get('eStatus')?.value)||'monitoring';
      base.action=S(get('eAction')?.value);
    }else base.formType=S(get('eForm')?.value)||'praise';

    const old=btn.innerHTML;btn.disabled=true;btn.innerHTML='Đang lưu...';
    try{
      const sheet=isViolation?'VI_PHAM':'KHEN_THUONG';
      for(const studentId of ids){
        const record={...base,studentId};
        const result=await jsonp('save_event',{payload:JSON.stringify({sheet,record})});
        if(!result?.ok||!result?.saved)throw new Error(result?.error||`Google Sheets chưa xác nhận lưu cho học sinh ${studentId}.`);
      }
      modal.remove();
      toast(isViolation?`Đã lưu ${ids.length} học sinh vi phạm thành công.`:`Đã lưu ${ids.length} học sinh khen thưởng thành công.`,'success');
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
    const btn=event.target?.closest?.('.ev-static-modal #eSave');
    if(!btn)return;
    const modal=btn.closest('.ev-static-modal');if(!modal)return;
    event.preventDefault();event.stopImmediatePropagation();save(btn,modal);
  },true);
})();
