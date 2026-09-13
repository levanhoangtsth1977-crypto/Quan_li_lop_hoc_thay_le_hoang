/* EVENTS SAVE JSONP V2 — isolated save bridge
 * Chỉ bắt nút Lưu của modal ev-static-modal do events-fixed-static.js tạo.
 * Không chạm router/menu khác, không thay đổi dữ liệu ngoài VI_PHAM/KHEN_THUONG.
 * Dùng JSONP để tránh lỗi CORS khi lưu qua Google Apps Script.
 */
(function(){
  'use strict';
  if(window.__LH_EVENTS_SAVE_JSONP_V2__) return;
  window.__LH_EVENTS_SAVE_JSONP_V2__=true;

  const API='https://script.google.com/macros/s/AKfycbxTPwf-jhrR8JOoKY5ZLuzlsDgcv3nWILtDPTrYNWZCEPpm2rkpXTn-sPAdFaUyy0z_uw/exec';
  const S=v=>String(v??'').trim();

  function jsonp(action,params){
    return new Promise((resolve,reject)=>{
      const cb='__LH_EVT_SAVE2_'+Date.now()+'_'+Math.random().toString(36).slice(2);
      const s=document.createElement('script');
      let done=false;
      const finish=(err,data)=>{
        if(done) return;
        done=true;
        clearTimeout(timer);
        try{delete window[cb]}catch(_){window[cb]=undefined}
        s.remove();
        err?reject(err):resolve(data);
      };
      const timer=setTimeout(()=>finish(new Error('Google Apps Script không phản hồi sau 20 giây.')),20000);
      window[cb]=data=>finish(null,data);
      s.onerror=()=>finish(new Error('Không thể kết nối Google Apps Script.'));
      const q=new URLSearchParams();
      q.set('action',action); q.set('callback',cb); q.set('_',String(Date.now()));
      Object.entries(params||{}).forEach(([k,v])=>q.set(k,S(v)));
      s.src=API+'?'+q.toString();
      document.head.appendChild(s);
    });
  }

  function toast(msg,type){
    if(typeof window.showToast==='function') window.showToast(msg,type||'info');
    else if(typeof window.toast==='function') window.toast(msg,type||'info');
    else console.info(msg);
  }

  async function save(btn,modal){
    const get=id=>modal.querySelector('#'+id)?.value;
    const studentId=S(get('eStudent'));
    const type=S(get('eType'));
    const date=S(get('eDate')) || new Date().toISOString().slice(0,10);
    const note=S(get('eNote'));
    if(!studentId||!type){toast('Vui lòng chọn học sinh và nội dung.','warning');return;}

    const isViolation=!!modal.querySelector('#eLevel');
    const record={
      id:'',studentId,date,type,note
    };
    if(isViolation){
      record.level=S(get('eLevel')) || 'light';
      record.status=S(get('eStatus')) || 'monitoring';
      record.action=S(get('eAction'));
    }else{
      record.formType=S(get('eForm')) || 'praise';
    }

    const old=btn.innerHTML;
    btn.disabled=true;
    btn.innerHTML='Đang lưu...';
    try{
      const sheet=isViolation?'VI_PHAM':'KHEN_THUONG';
      const result=await jsonp('save_event',{payload:JSON.stringify({sheet,record})});
      if(!result?.ok || !result?.saved) throw new Error(result?.error||'Google Sheets chưa xác nhận lưu.');

      modal.remove();
      toast(isViolation?'Đã lưu vi phạm thành công.':'Đã lưu khen thưởng thành công.','success');

      /* Đồng bộ lại từ nguồn Google Sheets, sau đó render nếu có API. */
      try{
        if(typeof window.syncGoogleSheetsNow==='function') await window.syncGoogleSheetsNow();
      }catch(_){ }
      try{
        if(typeof window.refreshAll==='function') window.refreshAll();
        if(typeof window.renderViolations==='function') window.renderViolations();
        if(typeof window.renderRewards==='function') window.renderRewards();
      }catch(_){ }
    }catch(err){
      btn.disabled=false;
      btn.innerHTML=old;
      toast('Lưu thất bại: '+S(err?.message||err),'error');
    }
  }

  document.addEventListener('click',function(event){
    const btn=event.target?.closest?.('.ev-static-modal #eSave');
    if(!btn) return;
    const modal=btn.closest('.ev-static-modal');
    if(!modal) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    save(btn,modal);
  },true);
})();