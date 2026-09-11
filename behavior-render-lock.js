/* BEHAVIOR RENDER LOCK 1.0
 * Canonical owner: behavior-ui-canonical-v11.js
 * Prevents legacy renderViolations/renderRewards from leaving duplicate/old columns.
 */
(function(){
  'use strict';
  if(window.__LH_BEHAVIOR_RENDER_LOCK_10__) return;
  window.__LH_BEHAVIOR_RENDER_LOCK_10__=true;

  function refresh(){
    try{ if(window.LH_BEHAVIOR_UI_CANONICAL?.render) window.LH_BEHAVIOR_UI_CANONICAL.render(); }
    catch(e){ console.warn('[BEHAVIOR RENDER LOCK]',e); }
  }
  function wrap(name){
    const marker='__LH_BEHAVIOR_RENDER_LOCKED_'+name;
    if(window[marker]||typeof window[name]!=='function') return;
    const old=window[name];
    window[marker]=true;
    window[name]=function(){
      const result=old.apply(this,arguments);
      requestAnimationFrame(refresh);
      return result;
    };
  }
  function init(){
    wrap('renderViolations');
    wrap('renderRewards');
    refresh();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,0),{once:true});
  else setTimeout(init,0);
  window.addEventListener('google-sheets-data-ready',()=>requestAnimationFrame(refresh));
  window.addEventListener('google-sheets-refresh',()=>requestAnimationFrame(refresh));
  window.addEventListener('google-sheet-record-saved',()=>requestAnimationFrame(refresh));
  window.__LH_BEHAVIOR_RENDER_LOCK_API__={refresh};
})();
