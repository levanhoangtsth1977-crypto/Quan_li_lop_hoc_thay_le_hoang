/* LE HOANG EVENT UI V21.5 — stable compact student dropdowns; NEVER block form change events */
(function(){
'use strict';
if(window.__LH_EVENT_UI_V215__)return;
window.__LH_EVENT_UI_V215__=true;
const IDS=['attendanceStudent','violationStudent','rewardStudent'];
const clean=v=>String(v??'').trim().replace(/\s+/g,' ');
const states=new Map();
function roster(){const a=Array.isArray(window.GOOGLE_SHEETS_STUDENTS)?window.GOOGLE_SHEETS_STUDENTS:[];if(a.length)return a;return Array.isArray(window.students)?window.students:[]}
function selected(el){return Array.from(el?.options||[]).filter(o=>o.selected&&clean(o.value)).map(o=>clean(o.value))}
function build(id){
 const sel=document.getElementById(id); if(!sel||states.has(id))return;
 const wrap=document.createElement('div');wrap.className='lh-v215-select';wrap.style.cssText='position:relative;width:100%';
 const trigger=document.createElement('button');trigger.type='button';trigger.className='lh-v215-trigger';trigger.style.cssText='width:100%;min-height:42px;padding:9px 12px;border:1px solid #d1d5db;border-radius:8px;background:#fff;display:flex;align-items:center;justify-content:space-between;gap:8px;text-align:left;cursor:pointer;font:inherit';
 const label=document.createElement('span');label.textContent='Chọn học sinh';const arrow=document.createElement('span');arrow.textContent='▾';trigger.append(label,arrow);
 const panel=document.createElement('div');panel.hidden=true;panel.className='lh-v215-panel';panel.style.cssText='position:absolute;left:0;right:0;top:calc(100% + 4px);z-index:5000;max-height:300px;overflow:auto;background:#fff;border:1px solid #d1d5db;border-radius:8px;box-shadow:0 10px 25px rgba(0,0,0,.15);padding:6px';
 sel.style.display='none';sel.multiple=true;sel.removeAttribute('size');
 sel.parentNode.insertBefore(wrap,sel);wrap.append(trigger,panel,sel);
 states.set(id,{sel,wrap,trigger,label,arrow,panel,signature:''});
 function refresh(){
  const chosen=new Set(selected(sel));const list=roster();const sig=list.map(s=>clean(s?.id)+'|'+clean(s?.name)).join('||');
  if(sig===states.get(id).signature&&!panel.hidden)return;
  states.get(id).signature=sig;panel.innerHTML='';
  list.forEach(s=>{const sid=clean(s?.id),name=clean(s?.name);if(!sid||!name)return;const row=document.createElement('label');row.style.cssText='display:flex;align-items:center;gap:9px;padding:8px;border-radius:6px;cursor:pointer';const cb=document.createElement('input');cb.type='checkbox';cb.value=sid;cb.checked=chosen.has(sid);const tx=document.createElement('span');tx.textContent=name;row.append(cb,tx);panel.appendChild(row);cb.addEventListener('change',()=>{const opt=Array.from(sel.options).find(o=>clean(o.value)===sid);if(opt)opt.selected=cb.checked;sel.dispatchEvent(new Event('change',{bubbles:true}));updateLabel()})});updateLabel()}
 function updateLabel(){const n=selected(sel).length;label.textContent=n?`Đã chọn ${n} học sinh`:'Chọn học sinh'}
 trigger.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();panel.hidden=!panel.hidden;arrow.textContent=panel.hidden?'▾':'▴';if(!panel.hidden)refresh()});
 panel.addEventListener('click',e=>e.stopPropagation());
 document.addEventListener('click',()=>{panel.hidden=true;arrow.textContent='▾'},{passive:true});
 sel.__lhV215Refresh=()=>{states.get(id).signature='';if(!panel.hidden)refresh();else updateLabel()};
 updateLabel();
}
function install(){IDS.forEach(build)}
function start(){install();window.addEventListener('google-sheets-data-ready',install);const mo=new MutationObserver(()=>{if(IDS.some(id=>document.getElementById(id)&&!states.has(id)))install()});mo.observe(document.body,{childList:true,subtree:true})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
