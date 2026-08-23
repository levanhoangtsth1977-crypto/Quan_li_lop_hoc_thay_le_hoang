/* DELETE-ALL UI compatibility layer.
   The final buttons are owned by violations-menu-fix.js.
   This file only removes legacy duplicate buttons.
*/
(function(){
  'use strict';
  function cleanup(){
    ['btnDeleteAllViolations','btnDeleteAllRewards','lhDeleteAllViolations'].forEach(function(id){
      var el=document.getElementById(id);
      if(el) el.remove();
    });
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',cleanup,{once:true}); else cleanup();
  new MutationObserver(cleanup).observe(document.documentElement,{childList:true,subtree:true});
})();
