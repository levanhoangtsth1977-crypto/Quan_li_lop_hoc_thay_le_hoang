/* VIOLATION RESET SYNC 1.0
 * Xóa TOÀN BỘ bản ghi VI_PHAM trên Google Sheets + LocalStorage/runtime.
 * Không đụng DIEM_DANH / KHEN_THUONG / HOC_TAP / học sinh.
 * Chỉ hoạt động khi giáo viên xác nhận.
 */
(function(){
  'use strict';
  if(window.__LH_VIOLATION_RESET_SYNC_10__) return;
  window.__LH_VIOLATION_RESET_SYNC_10__=true;

  const API='https://script.google.com/macros/s/AKfycbxTPwf-jhrR8JOoKY5ZLuzlsDgcv3nWILtDPTrYNWZCEPpm2rkpXTn-sPAdFaUyy0z_uw/exec';
  const MAP='violationRecords';

  const clean=v=>String(v??'').trim();
  const jsonp=(action,params={})=>new Promise((resolve,reject)=>{
    const cb='LHVRST_'+Date.now()+'_'+Math.random().toString(36).slice(2);
    const s=document.createElement('script');
    let done=false;
    const end=(err,data)=>{if(done)return;done=true;clearTimeout(timer);try{delete window[cb]}catch(_){}s.remove();err?reject(err):resolve(data)};
    const timer=setTimeout(()=>end(Error('Google Sheets không phản hồi sau 20 giây')),20000);
    window[cb]=data=>end(null,data);
    s.onerror=()=>end(Error('Không truy cập được Google Apps Script'));
    const q=Object.assign({action,callback:cb,_:Date.now()},params);
    s.src=API+'?'+Object.keys(q).map(k=>encodeURIComponent(k)+'='+encodeURIComponent(typeof q[k]==='string'?q[k]:JSON.stringify(q[k]))).join('&');
    document.head.appendChild(s);
  });

  async function getRemote(){
    const r=await jsonp('get_events');
    if(!r||r.ok!==true) throw Error(r&&r.error||'Không đọc được dữ liệu Google Sheets');
    return Array.isArray(r.VI_PHAM)?r.VI_PHAM:[];
  }

  async function deleteOne(id){
    const r=await jsonp('delete_event',{sheet:'VI_PHAM',id,recordId:id});
    if(!r||r.ok!==true||r.deleted!==true) throw Error(r&&r.error||('Không xóa được bản ghi '+id));
  }

  function clearLocal(){
    try{
      if(Array.isArray(window.violationRecords)) window.violationRecords.splice(0);
      if(typeof window.saveClassData==='function') window.saveClassData();
      if(typeof window.renderViolations==='function') window.renderViolations();
      if(typeof window.renderDashboard==='function') window.renderDashboard();
      if(typeof window.updateMenuBadges==='function') window.updateMenuBadges();
      if(window.__LH_BEHAVIOR_AI_API__?.refresh) window.__LH_BEHAVIOR_AI_API__.refresh();
    }catch(e){console.warn('[VIOLATION RESET LOCAL]',e)}
  }

  function toast(msg,type){try{if(typeof window.showToast==='function')window.showToast(msg,type);else alert(msg)}catch(_) {}}

  async function resetAll(){
    const remote=await getRemote();
    const local=Array.isArray(window.violationRecords)?window.violationRecords.length:0;
    if(remote.length===0 && local===0){toast('Dữ liệu Vi phạm đã sạch. Không có bản ghi để xóa.','info');return;}
    const ok=window.confirm('XÓA TOÀN BỘ VI PHẠM?\n\n• Google Sheets: '+remote.length+' bản ghi\n• Thiết bị hiện tại: '+local+' bản ghi\n\nThao tác này CHỈ xóa VI_PHAM. Khen thưởng, Điểm danh, Học tập và danh sách học sinh không bị ảnh hưởng.\n\nTiếp tục?');
    if(!ok)return;
    const failed=[];
    for(const r of remote){const id=clean(r&&r.id);if(!id)continue;try{await deleteOne(id)}catch(e){failed.push(id)}}
    const remaining=await getRemote();
    if(failed.length||remaining.length){
      toast('Chưa thể xóa sạch. Còn '+remaining.length+' bản ghi trên Google Sheets. Con không xóa dữ liệu local để tránh lệch dữ liệu.','error');
      return;
    }
    clearLocal();
    toast('Đã xóa sạch VI_PHAM trên Google Sheets và thiết bị. Có thể ghi lại từ đầu.','success');
  }

  function findResetButton(){
    const page=document.getElementById('page-violations');
    if(!page)return null;
    return [...page.querySelectorAll('button')].find(b=>/xóa tất cả/i.test(clean(b.textContent||''))||b.id==='clearViolations');
  }

  function bind(){
    const btn=findResetButton();
    if(!btn||btn.__LH_VIOLATION_RESET__)return;
    btn.__LH_VIOLATION_RESET__=true;
    btn.dataset.resetLabel=clean(btn.textContent)||'Xóa tất cả';
    btn.textContent='Xóa sạch Vi phạm';
    btn.title='Xóa toàn bộ Vi phạm trên Google Sheets và thiết bị để ghi lại từ đầu';
    btn.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();resetAll().catch(err=>{console.error('[VIOLATION RESET]',err);toast('Không thể xóa sạch Vi phạm: '+err.message,'error')})},true);
  }

  function init(){bind();setTimeout(bind,500);setTimeout(bind,1500)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
  document.addEventListener('click',e=>{if(e.target.closest?.('[data-page="violations"]'))setTimeout(bind,50)},true);
})();
