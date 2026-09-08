/* EVENT SAVE JSONP FIX
 * Bypass cross-origin fetch failures in events-new-final.js.
 * Only intercepts the Save button in the violation/reward modal.
 */
(function(){
  'use strict';
  if(window.__LH_EVENT_SAVE_JSONP_FIX__) return;
  window.__LH_EVENT_SAVE_JSONP_FIX__=true;

  const API='https://script.google.com/macros/s/AKfycbxTPwf-jhrR8JOoKY5ZLuzlsDgcv3nWILtDPTrYNWZCEPpm2rkpXTn-sPAdFaUyy0z_uw/exec';
  const S=v=>String(v??'').trim();

  function jsonp(action,params){
    return new Promise((resolve,reject)=>{
      const cb='__LH_EVENT_SAVE_'+Date.now()+'_'+Math.random().toString(36).slice(2);
      const s=document.createElement('script');
      let done=false;
      const finish=(err,data)=>{
        if(done)return;
        done=true;
        clearTimeout(timer);
        try{delete window[cb]}catch(_){window[cb]=undefined}
        s.remove();
        err?reject(err):resolve(data);
      };
      const timer=setTimeout(()=>finish(new Error('Google Apps Script không phản hồi.')),20000);
      window[cb]=data=>finish(null,data);
      s.onerror=()=>finish(new Error('Không thể kết nối Google Apps Script.'));
      const q=new URLSearchParams({action,callback:cb,_:Date.now(),...params});
      s.src=API+'?'+q.toString();
      document.head.appendChild(s);
    });
  }

  function esc(v){return S(v).replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}

  async function save(btn){
    const m=document.getElementById('evModal');
    if(!m) return;
    const studentId=S(m.querySelector('#evStudent')?.value);
    const type=S(m.querySelector('#evType')?.value);
    const date=S(m.querySelector('#evDate')?.value);
    const note=S(m.querySelector('#evNote')?.value);
    if(!studentId||!type){alert('Vui lòng chọn học sinh và nội dung.');return;}
    const isViolation=!!m.querySelector('#evLevel');
    const record={
      id:'',
      studentId,
      date:date||new Date().toISOString().slice(0,10),
      type,
      note
    };
    if(isViolation){
      record.level=S(m.querySelector('#evLevel')?.value);
      record.status=S(m.querySelector('#evStatus')?.value);
      record.action=S(m.querySelector('#evAction')?.value);
    }else{
      record.formType=S(m.querySelector('#evFormType')?.value);
    }
    btn.disabled=true;
    const old=btn.innerHTML;
    btn.innerHTML='Đang lưu...';
    try{
      const result=await jsonp('save_event',{payload:JSON.stringify({sheet:isViolation?'VI_PHAM':'KHEN_THUONG',record})});
      if(!result?.ok) throw new Error(result?.error||'Google Apps Script từ chối lưu.');
      m.remove();
      alert(isViolation?'Đã lưu vi phạm.':'Đã lưu khen thưởng.');
      location.reload();
    }catch(e){
      btn.disabled=false;
      btn.innerHTML=old;
      alert('Lưu thất bại: '+S(e?.message||e));
    }
  }

  document.addEventListener('click',function(e){
    const btn=e.target?.closest?.('#evSave');
    if(!btn) return;
    const modal=btn.closest('#evModal');
    if(!modal) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    save(btn);
  },true);
})();
