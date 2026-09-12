/* RESET VI PHAM ONCE 1.0
 * Mục đích: làm sạch dữ liệu VI_PHAM để kiểm thử lại từ đầu.
 * Chỉ chạy một lần trên trình duyệt hiện tại sau khi xác nhận Google Sheets.
 * Không xóa học sinh, điểm danh, khen thưởng, học tập hay SMAS.
 */
(function(){
  'use strict';
  const FLAG='QL_LE_HOANG_RESET_VI_PHAM_ONCE_20260912';
  if(localStorage.getItem(FLAG)==='done') return;

  const API='https://script.google.com/macros/s/AKfycbxTPwf-jhrR8JOoKY5ZLuzlsDgcv3nWILtDPTrYNWZCEPpm2rkpXTn-sPAdFaUyy0z_uw/exec';

  function jsonp(action,params){
    return new Promise((resolve,reject)=>{
      const cb='LH_RESET_'+Date.now()+'_'+Math.random().toString(36).slice(2);
      const s=document.createElement('script');
      let done=false;
      const finish=(err,data)=>{if(done)return;done=true;clearTimeout(timer);try{delete window[cb]}catch(_){}s.remove();err?reject(err):resolve(data)};
      const timer=setTimeout(()=>finish(new Error('Google Sheets không phản hồi sau 20 giây')),20000);
      window[cb]=data=>finish(null,data);
      s.onerror=()=>finish(new Error('Không truy cập được Google Sheets'));
      const q=Object.assign({action,callback:cb,_:Date.now()},params||{});
      s.src=API+'?'+Object.keys(q).map(k=>encodeURIComponent(k)+'='+encodeURIComponent(typeof q[k]==='string'?q[k]:JSON.stringify(q[k]))).join('&');
      document.head.appendChild(s);
    });
  }

  function toast(msg,type){try{if(typeof window.showToast==='function')window.showToast(msg,type);else console.log('[RESET VI PHAM]',msg)}catch(_){} }

  async function run(){
    try{
      const before=await jsonp('get_events');
      if(!before || before.ok!==true) throw new Error(before&&before.error||'Không đọc được dữ liệu Google Sheets');
      const records=Array.isArray(before.VI_PHAM)?before.VI_PHAM.slice():[];
      for(const r of records){
        const id=String(r&&r.id||'').trim();
        if(!id) continue;
        const result=await jsonp('delete_event',{sheet:'VI_PHAM',id,recordId:id});
        if(!result || result.ok!==true || result.deleted!==true) throw new Error(result&&result.error||('Không xóa được bản ghi '+id));
      }
      const after=await jsonp('get_events');
      const remaining=after&&after.ok===true&&Array.isArray(after.VI_PHAM)?after.VI_PHAM.length:-1;
      if(remaining!==0) throw new Error('Xác minh sau xóa thất bại: còn '+remaining+' bản ghi Vi phạm.');

      try{
        if(Array.isArray(window.violationRecords)) window.violationRecords.splice(0);
        if(typeof window.syncAppDataReferences==='function') window.syncAppDataReferences();
        const key='QL_LOP_HOC_LE_HOANG_2026_2027';
        const raw=localStorage.getItem(key);
        if(raw){
          const data=JSON.parse(raw);
          if(data&&typeof data==='object'){
            data.violations=[];
            localStorage.setItem(key,JSON.stringify(data));
          }
        }
      }catch(e){console.warn('[RESET VI PHAM] local cleanup',e)}

      localStorage.setItem(FLAG,'done');
      toast('Đã làm sạch toàn bộ Vi phạm. Có thể bắt đầu ghi nhận lại từ đầu.','success');
      ['renderViolations','renderDashboard'].forEach(fn=>{try{if(typeof window[fn]==='function')window[fn]()}catch(_){} });
      if(window.__LH_BEHAVIOR_AI_API__&&typeof window.__LH_BEHAVIOR_AI_API__.refresh==='function')window.__LH_BEHAVIOR_AI_API__.refresh();
    }catch(err){
      console.error('[RESET VI PHAM]',err);
      toast('Chưa thể làm sạch Vi phạm: '+err.message,'error');
    }
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(run,1200),{once:true});
  else setTimeout(run,1200);
})();
