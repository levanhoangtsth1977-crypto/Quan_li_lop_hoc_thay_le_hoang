/* BEHAVIOR SAVE HARD FIX 1.7 — CANONICAL SAVE OWNER */
(function(){
  'use strict';
  if(window.__LH_BEHAVIOR_SAVE_HARDFIX_17__) return;
  window.__LH_BEHAVIOR_SAVE_HARDFIX_17__=true;
  const API='https://script.google.com/macros/s/AKfycbxTPwf-jhrR8JOoKY5ZLuzlsDgcv3nWILtDPTrYNWZCEPpm2rkpXTn-sPAdFaUyy0z_uw/exec';
  const S=v=>String(v??'').trim();
  const $=(root,sel)=>root?.querySelector?.(sel)||document.querySelector(sel);
  function toast(msg,type){if(typeof window.showToast==='function')window.showToast(msg,type||'info');else if(typeof window.toast==='function')window.toast(msg,type||'info');else window.alert(msg)}
  function jsonp(action,params){return new Promise((resolve,reject)=>{const cb='__LH_BHV_SAVE17_'+Date.now()+'_'+Math.random().toString(36).slice(2);const script=document.createElement('script');let done=false;const finish=(err,data)=>{if(done)return;done=true;clearTimeout(timer);try{delete window[cb]}catch(_){window[cb]=undefined}script.remove();err?reject(err):resolve(data)};const timer=setTimeout(()=>finish(new Error('Google Apps Script không phản hồi sau 20 giây.')),20000);window[cb]=data=>finish(null,data);script.onerror=()=>finish(new Error('Không thể kết nối Google Apps Script.'));const q=new URLSearchParams({action,callback:cb,_:String(Date.now())});Object.entries(params||{}).forEach(([k,v])=>q.set(k,S(v)));script.src=API+'?'+q.toString();document.head.appendChild(script)})}
  function idsFromSelect(sel){if(!sel)return[];const values=sel.multiple?Array.from(sel.options||[]).filter(o=>o.selected&&S(o.value)).map(o=>S(o.value)):[S(sel.value)].filter(Boolean);return[...new Set(values)]}
  function idsFromPicker(form){return[...new Set(Array.from(form.querySelectorAll('.lh-csp-list input[type="checkbox"]:checked')).map(x=>S(x.value)).filter(Boolean))]}
  function studentIds(form,kind){const sel=form.querySelector(kind==='V'?'#violationStudent':'#rewardStudent');const picker=idsFromPicker(form);return picker.length?picker:idsFromSelect(sel)}
  function setBusy(btn,busy){if(!btn)return;if(busy){if(btn.dataset.lhOldHtml==null)btn.dataset.lhOldHtml=btn.innerHTML;btn.disabled=true;btn.innerHTML='Đang lưu...'}else{btn.disabled=false;if(btn.dataset.lhOldHtml!=null){btn.innerHTML=btn.dataset.lhOldHtml;delete btn.dataset.lhOldHtml}}}
  function rowMatches(r,record){const text=v=>S(v).toLowerCase();return S(r?.studentId)===S(record.studentId)&&S(r?.date).slice(0,10)===S(record.date).slice(0,10)&&text(r?.type||r?.content||r?.noiDung)===text(record.type)&&text(r?.note||r?.description)===text(record.note)}
  async function verifySaved(sheet,record){const data=await jsonp('get_events',{});if(!data?.ok)throw new Error(data?.error||'Không đọc lại được Google Sheets để xác minh.');const rows=Array.isArray(data?.[sheet])?data[sheet]:[];return {data,rows,found:rows.some(r=>rowMatches(r,record))}}
  async function saveOne(sheet,record){
    const wrapper=JSON.stringify({sheet,record});
    const variants=[
      {payload:wrapper},
      {payload:wrapper,sheet,record:JSON.stringify(record)},
      {sheet,record:JSON.stringify(record)},
      {sheet,record:wrapper}
    ];
    let last='Google Apps Script từ chối lưu.';
    for(let i=0;i<variants.length;i++){
      let response;
      try{response=await jsonp('save_event',variants[i]);last=S(response?.error||last)}catch(e){last=S(e?.message||e);continue}
      try{const check=await verifySaved(sheet,record);if(check.found)return check.data;}catch(e){last=S(e?.message||e)}
      if(response?.ok===true){last=S(response?.message||response?.error||last)}
    }
    throw new Error(last);
  }
  async function saveForm(form,kind,button){
    if(!form||form.dataset.lhSaving==='1')return;
    cleanupLegacyPickers();
    const ids=studentIds(form,kind);
    const date=S($(form,kind==='V'?'#violationDate':'#rewardDate')?.value)||new Date().toISOString().slice(0,10);
    const type=S($(form,kind==='V'?'#violationType':'#rewardType')?.value);
    if(!ids.length){toast('Vui lòng chọn ít nhất một học sinh.','warning');return}
    if(!type){toast('Vui lòng chọn nội dung.','warning');return}
    const base={studentId:'',date,type,note:S($(form,kind==='V'?'#violationNote':'#rewardNote')?.value)};
    if(kind==='V'){base.level=S($(form,'#violationLevel')?.value)||'light';base.status=S($(form,'#violationStatus')?.value)||'monitoring';base.action=S($(form,'#violationAction')?.value)}else base.formType=S($(form,'#rewardFormType')?.value)||'praise';
    const sheet=kind==='V'?'VI_PHAM':'KHEN_THUONG';
    form.dataset.lhSaving='1';setBusy(button,true);
    try{
      for(const studentId of ids)await saveOne(sheet,{...base,studentId});
      try{form.reset()}catch(_){}
      const d=$(form,kind==='V'?'#violationDate':'#rewardDate');if(d)d.value=new Date().toISOString().slice(0,10);
      try{form.closest('.modal')?.setAttribute('hidden','true')}catch(_){ }
      toast(kind==='V'?`Đã lưu ${ids.length} học sinh vi phạm thành công.`:`Đã lưu ${ids.length} học sinh khen thưởng thành công.`,'success');
      try{if(typeof window.syncGoogleSheetsNow==='function')await window.syncGoogleSheetsNow()}catch(_){ }
      try{if(typeof window.refreshAll==='function')window.refreshAll()}catch(_){ }
      try{if(typeof window.renderViolations==='function')window.renderViolations()}catch(_){ }
      try{if(typeof window.renderRewards==='function')window.renderRewards()}catch(_){ }
    }catch(e){toast('Lưu thất bại: '+S(e?.message||e),'error');setBusy(button,false)}finally{form.dataset.lhSaving=''}
  }
  function cleanupLegacyPickers(){document.querySelectorAll('#violationForm .lh-violation-student-picker,#violationForm .lh-csp-v3,#rewardForm .lh-csp-v3,.ev-static-modal .lh-csp-v3,.ev-static-modal .lh-violation-student-picker').forEach(x=>x.remove())}
  function cleanupSoon(){cleanupLegacyPickers();[50,200,500,1000,2000].forEach(ms=>setTimeout(cleanupLegacyPickers,ms))}
  window.addEventListener('submit',function(e){const form=e.target instanceof HTMLFormElement?e.target:null;if(!form||(form.id!=='violationForm'&&form.id!=='rewardForm'))return;e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();saveForm(form,form.id==='violationForm'?'V':'R',form.querySelector('button[type="submit"]'))},true);
  window.addEventListener('click',function(e){const btn=e.target?.closest?.('#violationForm button[type="submit"],#rewardForm button[type="submit"]');if(!btn)return;const form=btn.closest?.('#violationForm,#rewardForm');if(!form)return;e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();saveForm(form,form.id==='violationForm'?'V':'R',btn)},true);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',cleanupSoon,{once:true});else cleanupSoon();
})();
