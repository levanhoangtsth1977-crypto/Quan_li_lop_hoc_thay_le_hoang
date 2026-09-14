/* BEHAVIOR SAVE HARD FIX 1.5 — CANONICAL SAVE OWNER
 * Vi phạm/Khen thưởng: chỉ còn MỘT đường lưu.
 * - Window-capture submit/click chạy trước các legacy handler ở document.
 * - Chuẩn payload: {sheet,record} trong tham số payload.
 * - Chọn nhiều học sinh: lấy ID từ select canonical, hợp nhất với picker canonical.
 * - Dọn các picker legacy để không còn 2/3 bộ chọn chồng nhau.
 */
(function(){
  'use strict';
  if(window.__LH_BEHAVIOR_SAVE_HARDFIX_15__) return;
  window.__LH_BEHAVIOR_SAVE_HARDFIX_15__=true;

  const API='https://script.google.com/macros/s/AKfycbxTPwf-jhrR8JOoKY5ZLuzlsDgcv3nWILtDPTrYNWZCEPpm2rkpXTn-sPAdFaUyy0z_uw/exec';
  const S=v=>String(v??'').trim();
  const $=(root,sel)=>root?.querySelector?.(sel)||document.querySelector(sel);

  function toast(msg,type){
    if(typeof window.showToast==='function')window.showToast(msg,type||'info');
    else if(typeof window.toast==='function')window.toast(msg,type||'info');
    else window.alert(msg);
  }

  function jsonp(action,params){
    return new Promise((resolve,reject)=>{
      const cb='__LH_BHV_SAVE15_'+Date.now()+'_'+Math.random().toString(36).slice(2);
      const s=document.createElement('script');
      let done=false;
      const finish=(err,data)=>{if(done)return;done=true;clearTimeout(timer);try{delete window[cb]}catch(_){window[cb]=undefined}s.remove();err?reject(err):resolve(data)};
      const timer=setTimeout(()=>finish(new Error('Google Apps Script không phản hồi sau 20 giây.')),20000);
      window[cb]=d=>finish(null,d);
      s.onerror=()=>finish(new Error('Không thể kết nối Google Apps Script.'));
      const q=new URLSearchParams({action,callback:cb,_:String(Date.now())});
      Object.entries(params||{}).forEach(([k,v])=>q.set(k,S(v)));
      s.src=API+'?'+q.toString();
      document.head.appendChild(s);
    });
  }

  function savePayload(sheet,record){
    return jsonp('save_event',{payload:JSON.stringify({sheet,record})});
  }

  function idsFromSelect(sel){
    if(!sel)return [];
    const values=sel.multiple
      ? Array.from(sel.selectedOptions||[]).map(o=>S(o.value)).filter(Boolean)
      : [S(sel.value)].filter(Boolean);
    return [...new Set(values)];
  }

  function idsFromPicker(form){
    return [...new Set(Array.from(form.querySelectorAll('.lh-csp-list input[type="checkbox"]:checked')).map(x=>S(x.value)).filter(Boolean))];
  }

  function studentIds(form,kind){
    const sel=form.querySelector(kind==='V'?'#violationStudent':'#rewardStudent');
    const a=idsFromSelect(sel);
    const b=idsFromPicker(form);
    return [...new Set(a.concat(b))];
  }

  function setBusy(btn,busy){
    if(!btn)return;
    if(busy){
      if(btn.dataset.lhOldHtml==null)btn.dataset.lhOldHtml=btn.innerHTML;
      btn.disabled=true;
      btn.innerHTML='Đang lưu...';
    }else{
      btn.disabled=false;
      if(btn.dataset.lhOldHtml!=null){btn.innerHTML=btn.dataset.lhOldHtml;delete btn.dataset.lhOldHtml;}
    }
  }

  async function saveForm(form,kind,button){
    if(!form||form.dataset.lhSaving==='1')return;
    const ids=studentIds(form,kind);
    const date=S($(form,kind==='V'?'#violationDate':'#rewardDate')?.value)||new Date().toISOString().slice(0,10);
    const type=S($(form,kind==='V'?'#violationType':'#rewardType')?.value);
    if(!ids.length){toast('Vui lòng chọn ít nhất một học sinh.','warning');return;}
    if(!type){toast('Vui lòng chọn nội dung.','warning');return;}

    const base={
      studentId:'',
      date,
      type,
      note:S($(form,kind==='V'?'#violationNote':'#rewardNote')?.value)
    };
    if(kind==='V'){
      base.level=S($(form,'#violationLevel')?.value)||'light';
      base.status=S($(form,'#violationStatus')?.value)||'monitoring';
      base.action=S($(form,'#violationAction')?.value);
    }else{
      base.formType=S($(form,'#rewardFormType')?.value)||'praise';
    }

    const sheet=kind==='V'?'VI_PHAM':'KHEN_THUONG';
    form.dataset.lhSaving='1';
    setBusy(button,true);
    try{
      for(const studentId of ids){
        const record={...base,studentId};
        const r=await savePayload(sheet,record);
        if(!r?.ok||!(r.saved===true||r.stored===true)){
          throw new Error(r?.error||`Google Sheets chưa xác nhận lưu cho ${studentId}.`);
        }
      }

      try{form.closest('.modal')?.setAttribute('hidden','true');}catch(_){ }
      toast(kind==='V'?`Đã lưu ${ids.length} học sinh vi phạm thành công.`:`Đã lưu ${ids.length} học sinh khen thưởng thành công.`,'success');
      try{if(typeof window.syncGoogleSheetsNow==='function')await window.syncGoogleSheetsNow()}catch(_){ }
      try{if(typeof window.refreshAll==='function')window.refreshAll()}catch(_){ }
      try{if(typeof window.renderViolations==='function')window.renderViolations()}catch(_){ }
      try{if(typeof window.renderRewards==='function')window.renderRewards()}catch(_){ }
      setBusy(button,false);
    }catch(e){
      toast('Lưu thất bại: '+S(e?.message||e),'error');
      setBusy(button,false);
    }finally{
      form.dataset.lhSaving='';
    }
  }

  function cleanupLegacyPickers(){
    document.querySelectorAll('#violationForm .lh-violation-student-picker, #violationForm .lh-csp-v3, #rewardForm .lh-csp-v3, .ev-static-modal .lh-csp-v3, .ev-static-modal .lh-violation-student-picker').forEach(x=>x.remove());
  }

  function cleanupSoon(){
    cleanupLegacyPickers();
    [50,200,500,1000,2000].forEach(ms=>setTimeout(cleanupLegacyPickers,ms));
  }

  // Window capture is intentionally used so stale document-level legacy handlers
  // cannot call stopImmediatePropagation before this canonical owner.
  window.addEventListener('submit',function(e){
    const form=e.target instanceof HTMLFormElement?e.target:null;
    if(!form || (form.id!=='violationForm' && form.id!=='rewardForm'))return;
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    const kind=form.id==='violationForm'?'V':'R';
    saveForm(form,kind,form.querySelector('button[type="submit"]'));
  },true);

  window.addEventListener('click',function(e){
    const btn=e.target?.closest?.('#violationForm button[type="submit"],#rewardForm button[type="submit"],.ev-static-modal #eSave');
    if(!btn)return;
    const form=btn.closest?.('#violationForm,#rewardForm,.ev-static-modal');
    if(!form)return;

    if(form.id==='violationForm'||form.id==='rewardForm'){
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      saveForm(form,form.id==='violationForm'?'V':'R',btn);
      return;
    }

    if(btn.id==='eSave'){
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      const root=form;
      const sel=root.querySelector('#eStudent');
      const unique=[...new Set(idsFromSelect(sel).concat(idsFromPicker(root)))];
      const type=S(root.querySelector('#eType')?.value);
      const isV=!!root.querySelector('#eLevel');
      if(!unique.length||!type){toast('Vui lòng chọn học sinh và nội dung.','warning');return;}
      const base={studentId:'',date:S(root.querySelector('#eDate')?.value)||new Date().toISOString().slice(0,10),type,note:S(root.querySelector('#eNote')?.value)};
      if(isV){base.level=S(root.querySelector('#eLevel')?.value)||'light';base.status=S(root.querySelector('#eStatus')?.value)||'monitoring';base.action=S(root.querySelector('#eAction')?.value)}else base.formType=S(root.querySelector('#eForm')?.value)||'praise';
      setBusy(btn,true);
      (async()=>{
        try{
          for(const studentId of unique){
            const r=await savePayload(isV?'VI_PHAM':'KHEN_THUONG',{...base,studentId});
            if(!r?.ok||!(r.saved===true||r.stored===true))throw new Error(r?.error||'Google Sheets chưa xác nhận lưu.');
          }
          root.remove();
          toast(isV?`Đã lưu ${unique.length} học sinh vi phạm thành công.`:`Đã lưu ${unique.length} học sinh khen thưởng thành công.`,'success');
          try{if(typeof window.syncGoogleSheetsNow==='function')await window.syncGoogleSheetsNow()}catch(_){ }
          try{if(typeof window.refreshAll==='function')window.refreshAll()}catch(_){ }
        }catch(err){
          setBusy(btn,false);
          toast('Lưu thất bại: '+S(err?.message||err),'error');
        }
      })();
    }
  },true);

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',cleanupSoon,{once:true});
  else cleanupSoon();
})();
