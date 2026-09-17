/* VI PHẠM + KHEN THƯỞNG — NÚT XÓA THEO TỪNG BẢN GHI
   Chỉ tác động hai menu #violations và #rewards.
   ID bản ghi lấy trực tiếp từ dữ liệu cục bộ của ứng dụng, sau đó xóa thật qua /api/google.
   PATCH 2 — kích hoạt tích hợp canonical.
*/
(function(){
'use strict';
if(window.__LH_EVENT_DELETE_MENU_PATCH_2__)return;
window.__LH_EVENT_DELETE_MENU_PATCH_2__=true;

const KEY='LH_CANONICAL_2026_2027';
const CONFIG={violations:{sheet:'VI_PHAM',label:'vi phạm',field:'violations'},rewards:{sheet:'KHEN_THUONG',label:'khen thưởng',field:'rewards'}};
const $=s=>document.querySelector(s);
function readData(){try{return JSON.parse(localStorage.getItem(KEY)||'null')}catch(_){return null}}
function writeData(d){localStorage.setItem(KEY,JSON.stringify(d))}
function route(){return(location.hash||'#home').slice(1).split('?')[0]||'home'}
function toast(msg,type){if(typeof window.showToast==='function')window.showToast(msg,type||'error');else window.alert(msg)}
function realRows(tbody){return[...tbody.querySelectorAll(':scope > tr')].filter(tr=>!tr.querySelector('.empty')&&tr.children.length>1)}
function addDeleteColumn(){const r=route(),cfg=CONFIG[r];if(!cfg)return;const table=$('.content .table');if(!table)return;const thead=table.tHead,tbody=table.tBodies?.[0];if(!thead||!tbody)return;const hr=thead.rows?.[0];if(!hr)return;if(!hr.querySelector('[data-lh-menu-delete-head]')){const th=document.createElement('th');th.dataset.lhMenuDeleteHead='1';th.textContent='Thao tác';hr.appendChild(th)}const rows=realRows(tbody),data=readData(),list=Array.isArray(data?.[cfg.field])?data[cfg.field]:[];rows.forEach((tr,i)=>{if(tr.querySelector('[data-lh-menu-delete]'))return;const td=document.createElement('td');td.dataset.lhMenuDeleteCell='1';const b=document.createElement('button');b.type='button';b.className='mini';b.dataset.lhMenuDelete='1';b.dataset.lhMenuIndex=String(i);b.title='Xóa bản ghi này';b.textContent='🗑️ Xóa';td.appendChild(b);tr.appendChild(td)})}
async function deleteRecord(button){const r=route(),cfg=CONFIG[r];if(!cfg)return;const index=Number(button.dataset.lhMenuIndex),data=readData(),list=Array.isArray(data?.[cfg.field])?data[cfg.field]:[],record=list[list.length-1-index];if(!record){toast('Không xác định được bản ghi cần xóa.','error');return}const detail=[record.date,record.studentName||record.studentId,record.type||record.content].filter(Boolean).join(' · ');if(!window.confirm(`Xóa ${cfg.label} này?\n${detail||'Bản ghi đã chọn'}\n\nBản ghi sẽ được xóa cả trên Google Sheets.`))return;button.disabled=true;button.textContent='⏳ Đang xóa...';try{const id=String(record.id||'').trim();if(!id)throw Error('Bản ghi không có ID.');const q=new URLSearchParams({action:'delete_event',sheet:cfg.sheet,id,recordId:id,eventId:id,_:String(Date.now())});const res=await fetch('/api/google?'+q.toString(),{cache:'no-store',credentials:'same-origin'}),out=await res.json().catch(()=>null);if(!res.ok||!out?.ok||out.deleted!==true||Number(out.deletedCount||0)<1)throw Error(out?.error||'Google Sheets không xác nhận đã xóa.');const fresh=readData(),freshList=Array.isArray(fresh?.[cfg.field])?fresh[cfg.field]:[],pos=freshList.findIndex(x=>String(x?.id||'').trim()===id);if(pos>=0)freshList.splice(pos,1);writeData(fresh);toast(`Đã xóa 1 lượt ${cfg.label}.`,'success');location.reload()}catch(err){button.disabled=false;button.textContent='🗑️ Xóa';toast('Không thể xóa — '+(err?.message||err),'error')}}
document.addEventListener('click',e=>{const b=e.target.closest?.('[data-lh-menu-delete]');if(!b)return;e.preventDefault();e.stopPropagation();void deleteRecord(b)},true);
let scheduled=false;function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;try{addDeleteColumn()}catch(e){console.warn('[event-delete-menu]',e)}})}
new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true});window.addEventListener('hashchange',()=>setTimeout(schedule,0));if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(schedule,0),{once:true});else schedule();
})();
