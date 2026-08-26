/* MENU BADGE SYNC FIX — only resets stale Vi phạm/Khen thưởng badges */
(function(){'use strict';
if(window.__LH_MENU_BADGE_SYNC_FIX__)return;window.__LH_MENU_BADGE_SYNC_FIX__=true;
const text=v=>String(v??'').trim();
const records=(name)=>Array.isArray(window[name])?window[name]:((window.GOOGLE_SHEET_DATA?.tabs&&Array.isArray(window.GOOGLE_SHEET_DATA.tabs[name]))?window.GOOGLE_SHEET_DATA.tabs[name]:[]);
const countValid=(name)=>records(name).length;
function clean(){
  const targets=[['VI_PHAM','Vi phạm'],['KHEN_THUONG','Khen thưởng']];
  document.querySelectorAll('a,button,[role="button"]').forEach(el=>{
    const label=text(el.textContent);
    targets.forEach(([key,title])=>{
      if(!label.startsWith(title))return;
      const n=countValid(key);
      if(n>0)return;
      el.querySelectorAll('span,.badge,.count,.menu-badge,.nav-badge,[class*="badge"],[class*="count"]').forEach(x=>{if(/\d+/.test(text(x.textContent)))x.textContent='';});
      const m=el.childNodes;
      for(let i=m.length-1;i>=0;i--){const node=m[i];if(node.nodeType===3&&/\d+\s*$/.test(node.nodeValue)){node.nodeValue=node.nodeValue.replace(/\d+\s*$/,'');}}
    });
  });
}
function run(){clean();setTimeout(clean,300);setTimeout(clean,1200)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});else run();
window.addEventListener('google-sheets-data-ready',run);
window.addEventListener('google-sheet-record-deleted',run);
window.addEventListener('google-sheet-record-saved',run);
window.addEventListener('storage',run);
})();