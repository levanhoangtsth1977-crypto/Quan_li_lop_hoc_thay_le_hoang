/* VI PHẠM + KHEN THƯỞNG — NÚT XÓA THEO TỪNG BẢN GHI
   Chỉ tác động hai menu #violations và #rewards.
   ID bản ghi lấy trực tiếp từ dữ liệu cục bộ của ứng dụng, sau đó xóa thật qua /api/google.
*/
(function(){
'use strict';
if(window.__LH_EVENT_DELETE_MENU_PATCH_1__)return;
window.__LH_EVENT_DELETE_MENU_PATCH_1__=true;

const KEY='LH_CANONICAL_2026_2027';
const CONFIG={
  violations:{sheet:'VI_PHAM',label:'vi phạm',field:'violations'},
  rewards:{sheet:'KHEN_THUONG',label:'khen thưởng',field:'rewards'}
};
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function readData(){
  try{return JSON.parse(localStorage.getItem(KEY)||'null')}catch(_){return null}
}
function writeData(data){
  localStorage.setItem(KEY,JSON.stringify(data));
}
function route(){return (location.hash||'#home').slice(1).split('?')[0]||'home'}
function toast(msg,type){
  if(typeof window.showToast==='function')window.showToast(msg,type||'error');
  else window.alert(msg);
}
function realRows(tbody){
  return [...tbody.querySelectorAll(':scope > tr')].filter(tr=>!tr.querySelector('.empty') && tr.children.length>1);
}

function addDeleteColumn(){
  const r=route();
  const cfg=CONFIG[r];
  if(!cfg)return;
  const table=$('.content .table');
  if(!table)return;
  const thead=table.tHead;
  const tbody=table.tBodies?.[0];
  if(!thead||!tbody)return;

  const headerRow=thead.rows?.[0];
  if(!headerRow)return;
  if(!headerRow.querySelector('[data-lh-menu-delete-head]')){
    const th=document.createElement('th');
    th.setAttribute('data-lh-menu-delete-head','1');
    th.textContent='Thao tác';
    headerRow.appendChild(th);
  }

  const rows=realRows(tbody);
  const data=readData();
  const list=Array.isArray(data?.[cfg.field])?data[cfg.field]:[];
  const total=list.length;

  rows.forEach((tr,uiIndex)=>{
    if(tr.querySelector('[data-lh-menu-delete]'))return;
    const recordIndex=total-1-uiIndex;
    const record=list[recordIndex];
    const td=document.createElement('td');
    td.setAttribute('data-lh-menu-delete-cell','1');
    const btn=document.createElement('button');
    btn.type='button';
    btn.className='mini';
    btn.setAttribute('data-lh-menu-delete','1');
    btn.setAttribute('data-lh-menu-index',String(uiIndex));
    btn.title='Xóa bản ghi này';
    btn.textContent='🗑️ Xóa';
    td.appendChild(btn);
    tr.appendChild(td);
  });
}

async function deleteRecord(button){
  const r=route();
  const cfg=CONFIG[r];
  if(!cfg)return;

  const index=Number(button.dataset.lhMenuIndex);
  const data=readData();
  const list=Array.isArray(data?.[cfg.field])?data[cfg.field]:[];
  const record=list[list.length-1-index];
  if(!record){toast('Không xác định được bản ghi cần xóa.','error');return}

  const student=String(record.studentName||record.studentId||'').trim();
  const content=String(record.type||record.content||'').trim();
  const date=String(record.date||'').trim();
  const detail=[date,student,content].filter(Boolean).join(' · ');
  if(!window.confirm(`Xóa ${cfg.label} này?\n${detail||'Bản ghi đã chọn'}\n\nBản ghi sẽ được xóa cả trên Google Sheets.`))return;

  button.disabled=true;
  button.textContent='⏳ Đang xóa...';
  try{
    const id=String(record.id||'').trim();
    if(!id)throw new Error('Bản ghi không có ID.');
    const q=new URLSearchParams({action:'delete_event',sheet:cfg.sheet,id,recordId:id,eventId:id,_:String(Date.now())});
    const res=await fetch('/api/google?'+q.toString(),{cache:'no-store',credentials:'same-origin'});
    const out=await res.json().catch(()=>null);
    if(!res.ok||!out?.ok||out.deleted!==true||Number(out.deletedCount||0)<1){
      throw new Error(out?.error||'Google Sheets không xác nhận đã xóa.');
    }

    const fresh=readData();
    const freshList=Array.isArray(fresh?.[cfg.field])?fresh[cfg.field]:[];
    const pos=freshList.findIndex(x=>String(x?.id||'').trim()===id);
    if(pos>=0)freshList.splice(pos,1);
    writeData(fresh);

    toast(`Đã xóa 1 lượt ${cfg.label}.`,'success');
    location.reload();
  }catch(err){
    button.disabled=false;
    button.textContent='🗑️ Xóa';
    toast('Không thể xóa — '+(err?.message||err),'error');
  }
}

document.addEventListener('click',e=>{
  const button=e.target.closest?.('[data-lh-menu-delete]');
  if(!button)return;
  e.preventDefault();
  e.stopPropagation();
  void deleteRecord(button);
},true);

let scheduled=false;
function schedule(){
  if(scheduled)return;
  scheduled=true;
  requestAnimationFrame(()=>{scheduled=false;try{addDeleteColumn()}catch(err){console.warn('[event-delete-menu]',err)}});
}
new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true});
window.addEventListener('hashchange',()=>setTimeout(schedule,0));
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(schedule,0),{once:true});
else schedule();
})();
