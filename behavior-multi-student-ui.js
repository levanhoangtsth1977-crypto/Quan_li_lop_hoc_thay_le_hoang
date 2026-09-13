/* BEHAVIOR MULTI-STUDENT UI — SINGLE SELECT REPAIR */
(function(){
  'use strict';
  if(window.__LH_BEHAVIOR_SINGLE_STUDENT_REPAIR_20__)return;
  window.__LH_BEHAVIOR_SINGLE_STUDENT_REPAIR_20__=true;

  function repair(){
    document.querySelectorAll('#violationForm #violationStudent, #rewardForm #rewardStudent, .ev-static-modal #eStudent').forEach(function(el){
      if(!el)return;
      el.multiple=false;
      el.removeAttribute('multiple');
      el.size=1;
      el.removeAttribute('size');
      var label=el.closest('label');
      if(label)label.querySelectorAll('.lh-multi-hint').forEach(function(x){x.remove();});
    });
  }

  function start(){
    repair();
    new MutationObserver(repair).observe(document.body,{childList:true,subtree:true});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
