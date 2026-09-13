/* DELETE ALL — V5
   Vi phạm: always read the live VI_PHAM sheet before deleting.
   This avoids stale window.violationRecords causing "0 bản ghi" while rows are visible.
   Khen thưởng keeps the existing V4 flow.
   Does not intercept unrelated menus.
*/
(function(){
'use strict';
if(window.__LH_DELETE_ALL_V5__)return;
window.__LH_DELETE_ALL_V5__=true;

const API='https://script.google.com/macros/s/AKfycbxTPwf-jhrR8JOoKY5ZLuzlsDgcv3nWILtDPTrNWY5DCEPpm2rkpXTn-sPAdFaUyy0z_uw/exec';
const S=v=>String(v??'').trim();

function pageOf(el){
  return el?.closest?.('#page-violations,#page-rewards,[data-page-section="violations"],[data-page-section="rewards"]');
}
function sheetOf(el){
  const p=pageOf(el);
  if(p?.id==='page-rewards'||p?.dataset.pageSection==='rewards')return'KHEN_THUONG';
  if(p?.id==='page-violations'||p?.dataset.pageSection==='violations')return'VI_PHAM';
  return'';
}
function isAll(el){
  if(!el?.matches?.('button,[role="button"],a'))return false;
  const t=S(el.textContent).toLowerCase();
  return t.includes('xóa tất cả')||t.includes('xoá tất cả')||el.dataset.deleteAll==='true'||el.id==='lhDeleteAllViolations'||el.id==='lhDeleteAllRewards';
}
function toast(m,t){
  if(typeof window.showToast==='function')window.showToast(m,t||'info');
  else alert(m);
}

async function api(action,params={}){
  const q=new URLSearchParams({action,...params});
  const r=await fetch(API+'?'+q.toString(),{cache:'no-store'});
  if(!r.ok)throw new Error('Máy chủ trả HTTP '+r.status);
  const j=await r.json();
  if(!j?.ok)throw new Error(j?.error||'Máy chủ trả lỗi');
  return j;
}

function liveRows(sheet){
  return api('get_events').then(j=>Array.isArray(j?.[sheet])?j[sheet]:[]);
}
function stableId(r){return S(r?.id||r?.eventId||r?.recordId);}
function isRealViolation(r){
  return !!(stableId(r)&&S(r?.studentId)&&S(r?.type||r?.content||r?.noiDung));
}

async function verifyCleared(sheet){
  const j=await api('get_events');
  const rows=Array.isArray(j?.[sheet])?j[sheet]:[];
  return rows.filter(sheet==='VI_PHAM'?isRealViolation:()=>true);
}

async function deleteOneLive(sheet,id){
  if(!id)return;
  await api('delete_event',{sheet,id,eventId:id,recordId:id});
}

async function runViolation(b){
  let rows=[];
  try{
    rows=(await liveRows('VI_PHAM')).filter(isRealViolation);
  }catch(e){
    toast('Không đọc được dữ liệu Vi phạm từ Google Sheets: '+e.message,'error');
    return;
  }
  if(!rows.length){
    try{
      if(typeof window.renderViolations==='function')window.renderViolations();
      if(typeof window.updateBadges==='function')window.updateBadges();
    }catch(_){ }
    toast('Google Sheets hiện không có bản ghi Vi phạm để xóa.','info');
    return;
  }
  if(!confirm('XÓA TOÀN BỘ VI PHẠM?\n\nSố bản ghi thực tế trên Google Sheets: '+rows.length+'\n\nChỉ xóa sheet VI_PHAM. Không xóa menu khác.'))return;

  const old=b.innerHTML;
  b.disabled=true;
  b.dataset.lhDeleteAllBusy='1';
  b.innerHTML='⏳ Đang xóa '+rows.length+' bản ghi...';

  let ok=0;
  const fail=[];
  try{
    for(const row of rows){
      const id=stableId(row);
      if(!id)continue;
      try{
        await deleteOneLive('VI_PHAM',id);
        ok++;
      }catch(e){
        fail.push(id+': '+S(e.message));
      }
    }

    const remaining=await verifyCleared('VI_PHAM');
    if(remaining.length){
      toast('Đã xóa '+ok+' bản ghi nhưng Google Sheets còn '+remaining.length+' bản ghi Vi phạm. Con không làm thay đổi menu khác.','warning');
      console.warn('[LH DELETE ALL V5] remaining',remaining);
    }else{
      toast('Đã xóa sạch toàn bộ danh sách Vi phạm. Có thể ghi nhận mới từ đầu.','success');
    }

    try{
      if(Array.isArray(window.violationRecords))window.violationRecords.splice(0);
      if(typeof window.renderViolations==='function')window.renderViolations();
      if(typeof window.updateBadges==='function')window.updateBadges();
      window.dispatchEvent(new Event('google-sheets-refresh'));
    }catch(_){ }
  }catch(e){
    toast('Xóa tất cả Vi phạm thất bại: '+e.message,'error');
  }finally{
    b.disabled=false;
    b.removeAttribute('data-lh-delete-all-busy');
    b.innerHTML=old;
  }
}

async function runRewardV4(b){
  const rows=Array.isArray(window.rewardRecords)?window.rewardRecords.filter(r=>S(r?.id)):[];
  if(!rows.length){toast('Không có dữ liệu khen thưởng để xóa.','info');return;}
  if(!confirm('XÓA TOÀN BỘ LƯỢT KHEN THƯỞNG?\n\nSố lượt sẽ xóa: '+rows.length+'\nChỉ xóa dữ liệu của mục này.'))return;
  const old=b.innerHTML;b.disabled=true;b.dataset.lhDeleteAllBusy='1';b.innerHTML='⏳ Đang xóa...';
  let ok=0;const fail=[];
  try{
    for(const row of rows){
      const id=S(row.id);if(!id)continue;
      try{const j=await api('delete_event',{sheet:'KHEN_THUONG',id,recordId:id,eventId:id});if(j?.ok)ok++;}catch(e){fail.push(id+': '+S(e.message));}
    }
    if(Array.isArray(window.rewardRecords))window.rewardRecords.splice(0);
    try{if(typeof window.renderRewards==='function')window.renderRewards();if(typeof window.updateBadges==='function')window.updateBadges();}catch(_){ }
    if(fail.length)toast('Đã xóa '+ok+' lượt; còn '+fail.length+' lượt chưa xóa.','warning');
    else toast('Đã xóa toàn bộ lượt khen thưởng.','success');
  }finally{
    b.disabled=false;b.removeAttribute('data-lh-delete-all-busy');b.innerHTML=old;
  }
}

function clickHandler(e){
  const b=e.target.closest?.('button,[role="button"],a');
  if(!isAll(b))return;
  const sheet=b.dataset.lhDeleteAllSheet||sheetOf(b);
  if(!sheet)return;
  e.preventDefault();
  e.stopPropagation();
  if(b.dataset.lhDeleteAllBusy==='1')return;
  if(sheet==='VI_PHAM')runViolation(b);
  else runRewardV4(b);
}

document.addEventListener('click',clickHandler,true);

function cleanAndTag(){
  ['#page-violations','#page-rewards'].forEach(sel=>{
    const p=document.querySelector(sel);if(!p)return;
    const all=[...p.querySelectorAll('button,[role="button"],a')].filter(isAll);
    if(!all.length)return;
    all.slice(1).forEach(x=>x.remove());
    const b=all[0];
    b.dataset.lhDeleteAllSheet=sheetOf(b);
    b.dataset.lhDeleteAllV5='1';
    b.removeAttribute('onclick');
  });
}

function install(){cleanAndTag();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
new MutationObserver(install).observe(document.documentElement,{childList:true,subtree:true});
[100,300,700,1500,3000].forEach(x=>setTimeout(install,x));
window.LE_HOANG_DELETE_ALL_EVENTS_V5=runViolation;
})();