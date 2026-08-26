/* Khen thưởng — DELETE FIX 1.0
   Chỉ sửa lỗi xóa bản ghi KHEN_THUONG khi ID cục bộ khác ID thực trên Google Sheets.
   Không thay đổi Vi phạm / Điểm danh / dữ liệu gốc.
*/
(function(){
'use strict';
if(window.__LH_REWARD_DELETE_FIX_10__)return;
window.__LH_REWARD_DELETE_FIX_10__=true;
const clean=v=>String(v==null?'':v).trim().replace(/\s+/g,' ');
const normDate=v=>{const s=clean(v);if(!s)return'';let m=s.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);if(m)return m[3]+'-'+String(m[2]).padStart(2,'0')+'-'+String(m[1]).padStart(2,'0');return s.slice(0,10)};
const API=window.GOOGLE_RECORDS_API?.url||'https://script.google.com/macros/s/AKfycbxTPwf-jhrR8JOoKY5ZLuzlsDgcv3nWILtDPTrYNWZCEPpm2rkpXTn-sPAdFaUyy0z_uw/exec';
function jsonp(action,params){return new Promise((resolve,reject)=>{const cb='LH_REWARD_DEL_'+Date.now()+'_'+Math.random().toString(36).slice(2),s=document.createElement('script');let done=false;const end=(e,d)=>{if(done)return;done=true;clearTimeout(t);try{delete window[cb]}catch(_){}s.remove();e?reject(e):resolve(d)};const t=setTimeout(()=>end(Error('Google Sheets không phản hồi')),20000);window[cb]=d=>end(null,d);s.onerror=()=>end(Error('Không truy cập được Google Sheets'));const q=Object.assign({action,callback:cb,_:Date.now()},params||{});s.src=API+'?'+Object.keys(q).map(k=>encodeURIComponent(k)+'='+encodeURIComponent(typeof q[k]==='string'?q[k]:JSON.stringify(q[k]))).join('&');document.head.appendChild(s)})}
function localList(){return Array.isArray(window.rewardRecords)?window.rewardRecords:[]}
function localRecord(id){return localList().find(r=>clean(r&&r.id)===clean(id))||null}
function same(a,b){return clean(a)===clean(b)}
function findRemote(local,list){const id=clean(local&&local.id);let x=list.find(r=>clean(r&&r.id)===id);if(x)return x;
 const date=normDate(local&&local.date),type=clean(local&&local.type),form=clean(local&&local.formType),note=clean(local&&local.note);
 let c=list.filter(r=>normDate(r&&r.date)===date);
 if(type)c=c.filter(r=>same(r&&r.type,type));
 if(form)c=c.filter(r=>same(r&&r.formType,form));
 if(note)c=c.filter(r=>same(r&&r.note,note));
 if(c.length===1)return c[0];
 // Nếu có nhiều bản ghi, ưu tiên bản ghi cùng kiểu + hình thức + ghi chú.
 if(c.length>1){const exact=c.filter(r=>same(r&&r.type,type)&&same(r&&r.formType,form)&&same(r&&r.note,note));if(exact.length===1)return exact[0]}
 return null}
async function deleteRewardFixed(id){const wanted=clean(id);if(!wanted)return false;try{
 const local=localRecord(wanted)||{id:wanted};
 const remote=await jsonp('get_events');
 if(!remote||remote.ok!==true)throw Error(remote&&remote.error||'Không đọc được dữ liệu KHEN_THUONG');
 const list=Array.isArray(remote.KHEN_THUONG)?remote.KHEN_THUONG:[];
 const target=findRemote(local,list);
 if(!target)throw Error('Không tìm thấy đúng bản ghi khen thưởng trên Google Sheets');
 const realId=clean(target.id);if(!realId)throw Error('Bản ghi Google Sheets không có ID');
 const result=await jsonp('delete_event',{sheet:'KHEN_THUONG',id:realId,recordId:realId});
 if(!result||result.ok!==true||result.deleted!==true)throw Error(result&&result.error||'Google Sheets không xác nhận đã xóa');
 const arr=localList();for(let i=arr.length-1;i>=0;i--){if(clean(arr[i]&&arr[i].id)===wanted||clean(arr[i]&&arr[i].id)===realId)arr.splice(i,1)}
 try{if(typeof window.syncAppDataReferences==='function')window.syncAppDataReferences();if(typeof window.renderRewards==='function')window.renderRewards();if(typeof window.renderDashboard==='function')window.renderDashboard();if(window.__LH_EVENT_SUMMARY_API__)window.__LH_EVENT_SUMMARY_API__.refreshAll()}catch(_){}
 if(typeof window.showToast==='function')window.showToast('Đã xóa bản ghi khen thưởng.','success');
 return true;
 }catch(e){if(typeof window.showToast==='function')window.showToast('Không thể xóa khen thưởng — '+e.message,'error');else console.error(e);return false}}
function install(){
 const old=window.deleteReward;
 if(typeof old!=='function')return;
 if(window.__LH_REWARD_DELETE_ORIGINAL__)return;
 window.__LH_REWARD_DELETE_ORIGINAL__=old;
 window.deleteReward=deleteRewardFixed;
}
let n=0;const timer=setInterval(()=>{install();if(window.__LH_REWARD_DELETE_ORIGINAL__||++n>120)clearInterval(timer)},250);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
