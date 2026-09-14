/* CANONICAL BEHAVIOR DELETE — MASTER API
   Vi phạm + Khen thưởng dùng đúng Master API:
   GET  getViolations / getRewards
   POST deleteRecord {sheet,id}
   Không dùng get_events / delete_event.
*/
(function(){
'use strict';
if(window.__LH_BEHAVIOR_DELETE_MASTER__)return;
window.__LH_BEHAVIOR_DELETE_MASTER__=true;

const API=window.GOOGLE_API_CONFIG?.url||'https://script.google.com/macros/s/AKfycbxTPwf-jhrR8JOoKY5ZLuzlsDgcv3nWILtDPTrYNWZCEPpm2rkpXTn-sPAdFaUyy0z_uw/exec';
const S=v=>String(v??'').trim();
function toast(m,t){try{window.showToast?window.showToast(m,t||'info'):console.log(m)}catch(_){console.log(m)}}
function sheetAction(sheet){return sheet==='VI_PHAM'?'getViolations':'getRewards'}
function getRows(sheet){
  return new Promise((resolve,reject)=>{
    const cb='LH_DEL_GET_'+Date.now()+'_'+Math.random().toString(36).slice(2);
    const sc=document.createElement('script');let done=false;
    const finish=(err,data)=>{if(done)return;done=true;clearTimeout(timer);try{delete window[cb]}catch(_){}sc.remove();err?reject(err):resolve(data)};
    const timer=setTimeout(()=>finish(Error('Google Apps Script không phản hồi')),15000);
    window[cb]=data=>finish(null,data);sc.onerror=()=>finish(Error('Không truy cập được Google Apps Script'));
    const q=new URLSearchParams({action:sheetAction(sheet),callback:cb,_:Date.now()});
    sc.src=API+'?'+q.toString();document.head.appendChild(sc);
  }).then(r=>{if(!r?.ok)throw Error(r?.error||'Google trả lỗi');return Array.isArray(r.records)?r.records:[]});
}
function postDelete(sheet,id){
  return new Promise((resolve,reject)=>{
    if(!sheet||!id)return reject(Error('Thiếu sheet hoặc recordId'));
    const iframe=document.createElement('iframe');
    const form=document.createElement('form');
    const target='LH_DELETE_'+Date.now()+'_'+Math.random().toString(36).slice(2);
    iframe.name=target;iframe.style.display='none';
    form.method='POST';form.action=API;form.target=target;form.style.display='none';
    const add=(k,v)=>{const input=document.createElement('input');input.type='hidden';input.name=k;input.value=S(v);form.appendChild(input)};
    add('action','deleteRecord');add('sheet',sheet);add('id',id);add('recordId',id);
    document.body.appendChild(iframe);document.body.appendChild(form);
    let done=false;
    const cleanup=()=>{try{iframe.remove()}catch(_){}try{form.remove()}catch(_){} };
    const timer=setTimeout(()=>{if(done)return;done=true;cleanup();reject(Error('Google không xác nhận được yêu cầu xóa'))},12000);
    iframe.addEventListener('load',()=>{if(done)return;done=true;clearTimeout(timer);cleanup();resolve(true)},{once:true});
    try{form.submit()}catch(e){done=true;clearTimeout(timer);cleanup();reject(e)}
  });
}
async function deleteExact(sheet,id){
  const wanted=S(id);if(!wanted)throw Error('Thiếu recordId');
  await postDelete(sheet,wanted);
  const remaining=(await getRows(sheet)).some(r=>S(r?.id)===wanted);
  if(remaining)throw Error('Google Sheets vẫn còn bản ghi có ID '+wanted);
  return true;
}
function removeLocal(sheet,id){
  const name=sheet==='VI_PHAM'?'violationRecords':'rewardRecords';
  const arr=window[name];if(!Array.isArray(arr))return;
  for(let i=arr.length-1;i>=0;i--)if(S(arr[i]?.id)===S(id))arr.splice(i,1);
  try{window.syncAppDataReferences?.()}catch(_){}
}
function rerender(sheet){
  try{sheet==='VI_PHAM'?window.renderViolations?.():window.renderRewards?.()}catch(_){}
  try{window.renderDashboard?.();window.updateBadges?.()}catch(_){}
  try{window.dispatchEvent(new Event('google-sheets-refresh'))}catch(_){}
}
async function deleteOne(sheet,id){
  const label=sheet==='VI_PHAM'?'Vi phạm':'Khen thưởng';
  try{
    await deleteExact(sheet,id);removeLocal(sheet,id);rerender(sheet);toast('Đã xóa bản ghi '+label.toLowerCase()+'.','success');return true;
  }catch(e){toast('Không thể xóa '+label.toLowerCase()+': '+S(e?.message||e),'error');return false}
}
async function deleteAll(sheet,button){
  let rows;
  try{rows=await getRows(sheet)}catch(e){toast('Không đọc được dữ liệu '+(sheet==='VI_PHAM'?'Vi phạm':'Khen thưởng')+': '+e.message,'error');return}
  rows=rows.filter(r=>S(r?.id));
  const label=sheet==='VI_PHAM'?'VI PHẠM':'KHEN THƯỞNG';
  if(!rows.length){toast('Google Sheets hiện không có bản ghi '+label+'.','info');return}
  if(!confirm('XÓA TOÀN BỘ '+label+'?\n\nSố bản ghi trên Google Sheets: '+rows.length+'\n\nChỉ xóa sheet '+sheet+'.'))return;
  const old=button?.innerHTML||'Xóa tất cả';if(button){button.disabled=true;button.innerHTML='⏳ Đang xóa...'}
  let ok=0;
  try{
    for(const row of rows){try{await deleteExact(sheet,S(row.id));ok++}catch(e){console.warn('[LH DELETE MASTER]',sheet,row.id,e)}}
    const remain=await getRows(sheet);
    const remainCount=remain.filter(r=>S(r?.id)).length;
    if(remainCount===0){
      const name=sheet==='VI_PHAM'?'violationRecords':'rewardRecords';
      if(Array.isArray(window[name]))window[name].splice(0);
      rerender(sheet);
      toast('Đã xóa sạch '+label+'.','success');
    }else{
      toast('Đã xóa '+ok+'/'+rows.length+' bản ghi; Google Sheets còn '+remainCount+' bản ghi.','warning');
      removeLocal(sheet,'__never_match__');rerender(sheet);
    }
  }catch(e){toast('Xóa '+label+' thất bại: '+S(e?.message||e),'error')}
  finally{if(button){button.disabled=false;button.innerHTML=old}}
}
function pageOf(el){return el?.closest?.('#page-violations,#page-rewards,[data-page-section="violations"],[data-page-section="rewards"]')}
function sheetOf(el){const p=pageOf(el);if(p?.id==='page-rewards'||p?.dataset.pageSection==='rewards')return'KHEN_THUONG';if(p?.id==='page-violations'||p?.dataset.pageSection==='violations')return'VI_PHAM';return''}
function isAll(el){if(!el?.matches?.('button,[role="button"],a'))return false;const t=S(el.textContent).toLowerCase();return t.includes('xóa tất cả')||t.includes('xoá tất cả')||el.dataset.deleteAll==='true'||el.id==='lhDeleteAllViolations'||el.id==='lhDeleteAllRewards'}
function clickHandler(e){const b=e.target.closest?.('button,[role="button"],a');if(!isAll(b))return;const sheet=b.dataset.lhDeleteAllSheet||sheetOf(b);if(!sheet)return;e.preventDefault();e.stopPropagation();if(b.dataset.lhDeleteAllBusy==='1')return;b.dataset.lhDeleteAllBusy='1';deleteAll(sheet,b).finally(()=>b.removeAttribute('data-lh-delete-all-busy'))}
function cleanAndTag(){['#page-violations','#page-rewards'].forEach(sel=>{const p=document.querySelector(sel);if(!p)return;const all=[...p.querySelectorAll('button,[role="button"],a')].filter(isAll);if(!all.length)return;all.slice(1).forEach(x=>x.remove());const b=all[0];b.dataset.lhDeleteAllSheet=sheetOf(b);b.dataset.lhDeleteAllMaster='1';b.removeAttribute('onclick')})}
function install(){cleanAndTag()}
document.addEventListener('click',clickHandler,true);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
new MutationObserver(install).observe(document.documentElement,{childList:true,subtree:true});
[100,300,700,1500,3000].forEach(x=>setTimeout(install,x));
window.LE_HOANG_DELETE_ALL_EVENTS_V5=deleteAll;
window.LE_HOANG_DELETE_RECORD_MASTER=deleteOne;
})();
