/* LE HOANG EVENT UI V21.4 — compact multi-student dropdown + stable quick selects */
(function(){
'use strict';
if(window.__LH_EVENT_UI_V214__)return;
window.__LH_EVENT_UI_V214__=true;
const clean=v=>String(v??'').trim().replace(/\s+/g,' ');
const ids=['violationStudent','rewardStudent'];
const state=new Map();
function roster(){
 const a=Array.isArray(window.GOOGLE_SHEETS_STUDENTS)?window.GOOGLE_SHEETS_STUDENTS:[];
 if(a.length)return a;
 return Array.isArray(window.students)?window.students:[];
}
function selected(select){return select?Array.from(select.options||[]).filter(o=>o.selected&&clean(o.value)).map(o=>clean(o.value)):[]}
function ensurePanel(select){
 if(!select||select.dataset.v214Ready==='1')return;
 const id=select.id;
 const wrap=document.createElement('div');
 wrap.className='lh-v214-multiselect';
 wrap.style.position='relative';
 const button=document.createElement('button');
 button.type='button';button.className='lh-v214-trigger';
 button.style.cssText='width:100%;min-height:40px;text-align:left;padding:9px 12px;border:1px solid #d1d5db;border-radius:8px;background:#fff;cursor:pointer;display:flex;align-items:center;justify-content:space-between;gap:8px;';
 const label=document.createElement('span');const arrow=document.createElement('span');arrow.textContent='▾';
 button.append(label,arrow);
 const panel=document.createElement('div');
 panel.className='lh-v214-panel';
 panel.hidden=true;
 panel.style.cssText='position:absolute;z-index:3000;left:0;right:0;top:calc(100% + 4px);max-height:320px;overflow:auto;background:#fff;border:1px solid #d1d5db;border-radius:8px;box-shadow:0 10px 24px rgba(0,0,0,.14);padding:6px;';
 select.style.display='none';
 select.parentNode.insertBefore(wrap,select);
 wrap.appendChild(button);wrap.appendChild(panel);wrap.appendChild(select);
 state.set(id,{select,wrap,button,label,panel});select.dataset.v214Ready='1';
 function refresh(){
  const vals=new Set(selected(select));
  label.textContent=vals.size?`Đã chọn ${vals.size} học sinh`:'Chọn học sinh';
  panel.innerHTML='';
  roster().forEach(s=>{
   const sid=clean(s?.id),name=clean(s?.name);
   if(!sid||!name)return;
   const row=document.createElement('label');row.style.cssText='display:flex;align-items:center;gap:8px;padding:7px 8px;border-radius:6px;cursor:pointer;';
   const cb=document.createElement('input');cb.type='checkbox';cb.value=sid;cb.checked=vals.has(sid);
   const text=document.createElement('span');text.textContent=name;
   row.append(cb,text);panel.appendChild(row);
   cb.addEventListener('change',e=>{
    const opt=Array.from(select.options).find(o=>clean(o.value)===sid);
    if(opt)opt.selected=cb.checked;
    select.dispatchEvent(new Event('input',{bubbles:true}));
    updateLabelOnly();
   });
  });
 }
 function updateLabelOnly(){const n=selected(select).length;label.textContent=n?`Đã chọn ${n} học sinh`:'Chọn học sinh'}
 button.addEventListener('click',e=>{e.preventDefault();panel.hidden=!panel.hidden;arrow.textContent=panel.hidden?'▾':'▴';if(!panel.hidden)refresh()});
 document.addEventListener('click',e=>{if(!wrap.contains(e.target)){panel.hidden=true;arrow.textContent='▾'}});
 select.__v214Refresh=refresh;refresh();
}
function install(){ids.forEach(id=>ensurePanel(document.getElementById(id)));document.querySelectorAll('#violationModal select,#rewardModal select').forEach(sel=>{if(sel.dataset.v214Protect==='1')return;sel.dataset.v214Protect='1';sel.addEventListener('change',e=>{e.stopImmediatePropagation();},true);sel.addEventListener('input',e=>{e.stopImmediatePropagation();},true)});}
function watch(){install();const mo=new MutationObserver(()=>install());mo.observe(document.body,{childList:true,subtree:true});window.addEventListener('google-sheets-data-ready',()=>{ids.forEach(id=>state.get(id)?.select.__v214Refresh?.())});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',watch,{once:true});else watch();
})();
