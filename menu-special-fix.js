/* MENU SPECIAL — remove Lucky Wheel only. Does not touch any other menu. */
(function(){'use strict';
function removeLuckyWheel(){
  document.querySelectorAll('[data-page="lucky-wheel"],#lhLuckyWheelStatic').forEach(function(el){el.remove();});
  var section=document.getElementById('page-lucky-wheel');
  if(section) section.remove();
}
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',removeLuckyWheel,{once:true}); else removeLuckyWheel();
})();
