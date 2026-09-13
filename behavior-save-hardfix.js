/* BEHAVIOR SAVE HARD FIX 1.1 — authoritative save handler */
(function(){
  'use strict';
  if(window.__LH_BEHAVIOR_SAVE_HARDFIX_11__) return;
  window.__LH_BEHAVIOR_SAVE_HARDFIX_11__=true;

  const API='https://script.google.com/macros/s/AKfycbxTPwf-jhrR8JOoKY5ZLuzlsDgcv3nWILtDPTrYNWZCEPpm2rkpXTn-sPAdFaUyy0z_uw/exec';
  const S=v=>String(v??'').trim();
  const Q=(root,id)=>root?.querySelector?.('#'+id)||document.getElementById(id);
  function toast(msg,type){
    if(typeof window.showToast==='function') window.showToast(msg,type||'info');
    else if(typeof window.toast==='function') window.toast(msg,type||'info');
    else window.alert(msg);
  }
  function jsonp(action,params){
    return new Promise((resolve,reject)=>{
      const cb='__LH_BHV_SAVE11_'+Date.now()+'_'+Math.random().toString(36).slice(2);
      const s=document.createElement('script');let done=false;
      const finish=(err,data)=>{if(done)return;done=true;clearTimeout(timer);try{delete window[cb]}catch(_){window[cb]=undefined}s.remove();err?reject(err):resolve(data)};
      const timer=setTimeout(()=>finish(new Error('Google Apps Script không phản hồi sau 20 giây.')),20000);
      window[cb]=d=>finish(null,d);s.onerror=()=>finish(new Error('Không thể kết nối Google Apps Script.'));
      const q=new URLSearchParams({action,callback:cb,_:String(Date.now())});
      Object.entries(params||{}).forEach(([k,v])=>q.set(k,S(v)));
      s.src=API+'?'+q.toString();document.head.appendChild(s);
    });
  }
  function rootsFor(btn){
    const a=btn.closest?.('.ev-static-modal,#violationForm,#rewardForm,.event-modal,.modal,[role="dialog"],form');
    return a||document;
  }
  function selectedIds(root){
    const sel=Q(root,'eStudent')||Q(root,'violationStudent')||Q(root,'rewardStudent');
    if(sel?.multiple){
      const ids=Array.from(sel.selectedOptions||[]).map(o=>S(o.value)).filter(Boolean);
      if(ids.length)return [...new Set(ids)];
    }
    const one=S(sel?.value);if(one)return [one];
    const boxes=Array.from((root.querySelectorAll?.('.lh-csp-list input[type="checkbox"]:checked')||document.querySelectorAll('.lh-csp-list input[type="checkbox"]:checked'))).map(x=>S(x.value)).filter(Boolean);
    return [...new Set(boxes)];
  }
  async function save(btn,root){
    if(btn.dataset.lhSaving==='1')return;
    const ids=selectedIds(root);
    const type=S(Q(root,'eType')?.value||Q(root,'violationType')?.value||Q(root,'rewardType')?.value);
    const date=S(Q(root,'eDate')?.value||Q(root,'violationDate')?.value||Q(root,'rewardDate')?.value)||new Date().toISOString().slice(0,10);
    const note=S(Q(root,'eNote')?.value||Q(root,'violationNote')?.value||Q(root,'rewardNote')?.value);
    if(!ids.length){toast('Vui lòng chọn ít nhất một học sinh.','warning');return;}
    if(!type){toast('Vui lòng chọn nội dung.','warning');return;}
    const isV=!!Q(root,'eLevel')||!!Q(root,'violationLevel');
    const base={studentId:'',date,type,note};
    if(isV){base.level=S(Q(root,'eLevel')?.value||Q(root,'violationLevel')?.value)||'light';base.status=S(Q(root,'eStatus')?.value||Q(root,'violationStatus')?.value)||'monitoring';base.action=S(Q(root,'eAction')?.value||Q(root,'violationAction')?.value)}
    else base.formType=S(Q(root,'eForm')?.value||Q(root,'rewardForm')?.value)||'praise';
    const sheet=isV?'VI_PHAM':'KHEN_THUONG';const old=btn.innerHTML;btn.dataset.lhSaving='1';btn.disabled=true;btn.innerHTML='Đang lưu...';
    try{
      for(const studentId of ids){
        const r=await jsonp('save_event',{payload:JSON.stringify({sheet,record:{...base,studentId}})});
        if(!r?.ok||!(r.saved===true||r.stored===true))throw new Error(r?.error||`Google Sheets chưa xác nhận lưu cho ${studentId}.`);
      }
      if(root!==document&&typeof root.remove==='function')root.remove();
      toast(isV?`Đã lưu ${ids.length} học sinh vi phạm thành công.`:`Đã lưu ${ids.length} học sinh khen thưởng thành công.`,'success');
      try{if(typeof window.syncGoogleSheetsNow==='function')await window.syncGoogleSheetsNow()}catch(_){ }
      try{if(typeof window.refreshAll==='function')window.refreshAll()}catch(_){ }
      try{if(typeof window.renderViolations==='function')window.renderViolations()}catch(_){ }
      try{if(typeof window.renderRewards==='function')window.renderRewards()}catch(_){ }
    }catch(e){btn.disabled=false;btn.dataset.lhSaving='';btn.innerHTML=old;toast('Lưu thất bại: '+S(e?.message||e),'error')}
  }
  function isSave(el){
    if(!el||!(el instanceof Element))return false;
    if(el.id==='eSave')return true;
    if(el.matches('[data-action="save-violation"],[data-action="save-reward"],#saveViolation,#saveReward'))return true;
    const tx=S(el.textContent).replace(/\s+/g,' ').trim();
    return (el.tagName==='BUTTON'||el.tagName==='INPUT')&&tx==='Lưu'&&!!el.closest('#violationForm,#rewardForm,.ev-static-modal,.event-modal,.modal,[role="dialog"],form');
  }
  window.addEventListener('click',e=>{
    const el=e.target?.closest?.('button,input');if(!isSave(el))return;
    e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();save(el,rootsFor(el));
  },true);
})();
