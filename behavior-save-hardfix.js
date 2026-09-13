/* BEHAVIOR SAVE HARD FIX 1.0 — single authoritative save handler
 * Vi phạm/Khen thưởng: bắt trực tiếp nút Lưu ở tầng window-capture.
 * Hỗ trợ chọn 1 hoặc nhiều học sinh.
 * Không phụ thuộc onclick cũ và không chạm router/menu khác.
 */
(function(){
  'use strict';
  if(window.__LH_BEHAVIOR_SAVE_HARDFIX_10__) return;
  window.__LH_BEHAVIOR_SAVE_HARDFIX_10__=true;

  const API='https://script.google.com/macros/s/AKfycbxTPwf-jhrR8JOoKY5ZLuzlsDgcv3nWILtDPTrYNWZCEPpm2rkpXTn-sPAdFaUyy0z_uw/exec';
  const S=v=>String(v??'').trim();

  function toast(msg,type){
    if(typeof window.showToast==='function') window.showToast(msg,type||'info');
    else if(typeof window.toast==='function') window.toast(msg,type||'info');
    else window.alert(msg);
  }

  function jsonp(action,params){
    return new Promise((resolve,reject)=>{
      const cb='__LH_BHV_SAVE_'+Date.now()+'_'+Math.random().toString(36).slice(2);
      const script=document.createElement('script');
      let done=false;
      const finish=(err,data)=>{
        if(done)return;
        done=true;
        clearTimeout(timer);
        try{delete window[cb]}catch(_){window[cb]=undefined}
        script.remove();
        err?reject(err):resolve(data);
      };
      const timer=setTimeout(()=>finish(new Error('Google Apps Script không phản hồi sau 20 giây.')),20000);
      window[cb]=data=>finish(null,data);
      script.onerror=()=>finish(new Error('Không thể kết nối Google Apps Script.'));
      const q=new URLSearchParams();
      q.set('action',action); q.set('callback',cb); q.set('_',String(Date.now()));
      Object.entries(params||{}).forEach(([k,v])=>q.set(k,S(v)));
      script.src=API+'?'+q.toString();
      document.head.appendChild(script);
    });
  }

  function field(modal,id){return modal.querySelector('#'+id);}
  function selectedStudentIds(modal){
    const sel=field(modal,'eStudent')||field(modal,'violationStudent')||field(modal,'rewardStudent');
    if(!sel) return [];
    if(sel.multiple){
      const ids=Array.from(sel.selectedOptions||[]).map(o=>S(o.value)).filter(Boolean);
      if(ids.length)return [...new Set(ids)];
    }
    const one=S(sel.value);
    if(one)return [one];
    const checked=Array.from(modal.querySelectorAll('.lh-csp-list input[type="checkbox"]:checked'))
      .map(x=>S(x.value)).filter(Boolean);
    return [...new Set(checked)];
  }

  async function doSave(btn,modal){
    if(btn.dataset.lhSaving==='1') return;
    const ids=selectedStudentIds(modal);
    const type=S(field(modal,'eType')?.value || field(modal,'violationType')?.value || field(modal,'rewardType')?.value);
    const date=S(field(modal,'eDate')?.value || field(modal,'violationDate')?.value || field(modal,'rewardDate')?.value) || new Date().toISOString().slice(0,10);
    const note=S(field(modal,'eNote')?.value || field(modal,'violationNote')?.value || field(modal,'rewardNote')?.value);
    if(!ids.length){toast('Vui lòng chọn ít nhất một học sinh.','warning');return;}
    if(!type){toast('Vui lòng chọn nội dung.','warning');return;}

    const isViolation=!!field(modal,'eLevel') || !!field(modal,'violationLevel');
    const base={studentId:'',date,type,note};
    if(isViolation){
      base.level=S(field(modal,'eLevel')?.value || field(modal,'violationLevel')?.value)||'light';
      base.status=S(field(modal,'eStatus')?.value || field(modal,'violationStatus')?.value)||'monitoring';
      base.action=S(field(modal,'eAction')?.value || field(modal,'violationAction')?.value);
    }else{
      base.formType=S(field(modal,'eForm')?.value || field(modal,'rewardForm')?.value)||'praise';
    }

    const sheet=isViolation?'VI_PHAM':'KHEN_THUONG';
    const old=btn.innerHTML;
    btn.dataset.lhSaving='1'; btn.disabled=true; btn.innerHTML='Đang lưu...';
    try{
      for(const studentId of ids){
        const record={...base,studentId};
        const result=await jsonp('save_event',{payload:JSON.stringify({sheet,record})});
        if(!result?.ok || !result?.saved){
          throw new Error(result?.error || `Google Sheets chưa xác nhận lưu cho ${studentId}.`);
        }
      }
      modal.remove();
      toast(isViolation?`Đã lưu ${ids.length} học sinh vi phạm thành công.`:`Đã lưu ${ids.length} học sinh khen thưởng thành công.`,'success');
      try{ if(typeof window.syncGoogleSheetsNow==='function') await window.syncGoogleSheetsNow(); }catch(_){ }
      try{ if(typeof window.refreshAll==='function') window.refreshAll(); }catch(_){ }
      try{ if(typeof window.renderViolations==='function') window.renderViolations(); }catch(_){ }
      try{ if(typeof window.renderRewards==='function') window.renderRewards(); }catch(_){ }
    }catch(err){
      btn.disabled=false; btn.dataset.lhSaving=''; btn.innerHTML=old;
      toast('Lưu thất bại: '+S(err?.message||err),'error');
    }
  }

  function isSaveButton(el){
    if(!el || !(el instanceof Element)) return false;
    if(el.id==='eSave') return true;
    if(el.matches('[data-action="save-violation"],[data-action="save-reward"],#saveViolation,#saveReward')) return true;
    const text=S(el.textContent).replace(/\s+/g,' ').trim();
    return (el.tagName==='BUTTON' || el.tagName==='INPUT') && text==='Lưu' && !!el.closest('#violationForm,#rewardForm,.ev-static-modal,.event-modal,.modal');
  }

  window.addEventListener('click',function(event){
    const btn=event.target?.closest?.('button,input');
    if(!isSaveButton(btn)) return;
    const modal=btn.closest('.ev-static-modal,#violationForm,#rewardForm,.event-modal,.modal') || btn.parentElement?.closest('.ev-static-modal,#violationForm,#rewardForm,.event-modal,.modal');
    if(!modal) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    doSave(btn,modal);
  },true);
})();
