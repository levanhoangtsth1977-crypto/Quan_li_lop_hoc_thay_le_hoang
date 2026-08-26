/* LE HOANG UI V21.7 — stable student picker for Điểm danh / Vi phạm / Khen thưởng */
(function(){
'use strict';
if(window.__LH_EVENT_UI_V217__) return;
window.__LH_EVENT_UI_V217__=true;
const IDS=['attendanceStudent','violationStudent','rewardStudent'];
const clean=v=>String(v??'').trim().replace(/\s+/g,' ');
const states=new Map();
let rosterSig='';
function roster(){
  const g=Array.isArray(window.GOOGLE_SHEETS_STUDENTS)?window.GOOGLE_SHEETS_STUDENTS:[];
  const s=Array.isArray(window.students)?window.students:[];
  const a=g.length>=42?g:(s.length>=42?s:g.length?s:[]);
  return a.map(x=>({id:clean(x?.id),name:clean(x?.name||x?.studentName)})).filter(x=>x.id&&x.name);
}
function signature(){return roster().map(x=>x.id+'|'+x.name).join('§')}
function values(sel){return Array.from(sel?.options||[]).filter(o=>o.selected&&clean(o.value)).map(o=>clean(o.value))}
function emitChange(sel){sel.dispatchEvent(new Event('change',{bubbles:true}))}
function syncOptions(st,keep){
  const sel=st.sel, list=roster(), chosen=new Set(keep||values(sel));
  sel.multiple=true;
  const frag=document.createDocumentFragment();
  list.forEach(x=>{const o=document.createElement('option');o.value=x.id;o.textContent=x.name;o.selected=chosen.has(x.id);frag.appendChild(o)});
  sel.replaceChildren(frag);
  sel.hidden=true;sel.style.display='none';sel.setAttribute('aria-hidden','true');
}
function updateLabel(st){
  const n=values(st.sel).length;
  st.label.textContent=n?`Đã chọn ${n} học sinh`:'Chọn học sinh';
  st.arrow.textContent=st.panel.hidden?'▾':'▴';
}
function render(st){
  const keep=values(st.sel); syncOptions(st,keep);
  const chosen=new Set(values(st.sel));
  st.panel.replaceChildren();
  roster().forEach(x=>{
    const row=document.createElement('label');
    row.style.cssText='display:flex;align-items:center;gap:9px;padding:8px 9px;cursor:pointer;border-radius:6px';
    const cb=document.createElement('input');cb.type='checkbox';cb.value=x.id;cb.checked=chosen.has(x.id);
    const tx=document.createElement('span');tx.textContent=x.name;row.append(cb,tx);st.panel.appendChild(row);
    cb.addEventListener('change',()=>{
      const opt=Array.from(st.sel.options).find(o=>clean(o.value)===x.id);
      if(opt)opt.selected=cb.checked;
      updateLabel(st);
      emitChange(st.sel);
      /* Chọn xong thì thu gọn; mở lại để chọn thêm học sinh. */
      st.panel.hidden=true;updateLabel(st);
    });
  });
  updateLabel(st);
}
function build(id){
  const sel=document.getElementById(id);
  if(!sel) return;
  const old=states.get(id);
  if(old && old.sel===sel) return;
  if(old && old.wrap?.isConnected) old.wrap.remove();
  states.delete(id);
  const wrap=document.createElement('div');wrap.className='lh-v217-select';wrap.style.cssText='position:relative;width:100%;margin:0';
  const trigger=document.createElement('button');trigger.type='button';trigger.className='lh-v217-trigger';trigger.style.cssText='box-sizing:border-box;width:100%;min-height:40px;padding:8px 12px;border:1px solid #d1d5db;border-radius:8px;background:#fff;display:flex;align-items:center;justify-content:space-between;gap:8px;text-align:left;cursor:pointer;font:inherit;color:#111827';
  const label=document.createElement('span'),arrow=document.createElement('span');trigger.append(label,arrow);
  const panel=document.createElement('div');panel.hidden=true;panel.className='lh-v217-panel';panel.style.cssText='position:absolute;left:0;right:0;top:calc(100% + 4px);z-index:9999;max-height:280px;overflow:auto;background:#fff;border:1px solid #d1d5db;border-radius:8px;box-shadow:0 10px 25px rgba(0,0,0,.15);padding:4px';
  sel.parentNode.insertBefore(wrap,sel);wrap.append(trigger,panel,sel);sel.hidden=true;sel.style.display='none';sel.setAttribute('aria-hidden','true');
  const st={sel,wrap,trigger,label,arrow,panel};states.set(id,st);
  trigger.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();panel.hidden=!panel.hidden;if(!panel.hidden)render(st);else updateLabel(st)});
  panel.addEventListener('click',e=>e.stopPropagation());
  document.addEventListener('click',e=>{if(!wrap.contains(e.target)){panel.hidden=true;updateLabel(st)}});
  updateLabel(st);syncOptions(st,[]);updateLabel(st);
}
function install(){
  IDS.forEach(build);
  const sig=signature();
  if(sig!==rosterSig){rosterSig=sig;states.forEach(st=>{if(st.sel.isConnected){const keep=values(st.sel);syncOptions(st,keep);updateLabel(st)}})}
}
function patchRefresh(){
  if(window.__LH_REFRESH_V217__) return;
  const original=window.refreshAll;
  if(typeof original!=='function') return;
  let queued=false;
  window.refreshAll=function(){
    const a=document.activeElement;
    const form=a?.closest?.('#attendanceForm,#violationForm,#rewardForm');
    if(form){queued=true;return Promise.resolve();}
    return original.apply(this,arguments);
  };
  window.__LH_REFRESH_V217__=true;
  window.addEventListener('blur',()=>{if(queued){queued=false;setTimeout(()=>original(),0)}});
}
function start(){
  install();patchRefresh();
  window.addEventListener('google-sheets-data-ready',()=>setTimeout(install,0));
  const mo=new MutationObserver(()=>{
    let need=false;IDS.forEach(id=>{const st=states.get(id);const el=document.getElementById(id);if(el&&!st)need=true;if(st&&!st.sel.isConnected)need=true});
    if(need) requestAnimationFrame(install);
  });
  mo.observe(document.body,{childList:true,subtree:true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
