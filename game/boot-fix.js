/* TRIỆU PHÚ HỌC ĐƯỜNG — BOOT/ROSTER FIX 1.5 */
(function(){'use strict';
function loadScript(src,key){if(document.querySelector('script['+key+']'))return;var s=document.createElement('script');s.src=src;s.async=false;s.setAttribute(key,'1');document.head.appendChild(s)}
function refreshRosterUI(){var sel=document.getElementById('student'),list=window.GameData&&window.GameData.getStudents?window.GameData.getStudents():[];if(!sel)return;if(!list.length){sel.innerHTML='<option value="">⏳ Đang tải học sinh...</option>';return;}var current=sel.value;sel.innerHTML='';list.forEach(function(s){var id=String(s.id||s.studentCode||s.studentId||s.name||s.studentName||''),name=s.name||s.studentName||id,o=document.createElement('option');o.value=id;o.textContent=name;sel.appendChild(o)});if(current&&Array.prototype.some.call(sel.options,function(o){return o.value===current}))sel.value=current}
window.addEventListener('gameRosterReady',refreshRosterUI);window.addEventListener('gameRosterError',refreshRosterUI);
function boot(){
  refreshRosterUI();
  setTimeout(refreshRosterUI,100);
  loadScript('question-bank-recovery.js?v=1.0.0&fresh='+Date.now(),'data-lh-qb-recovery');
  loadScript('question-bank-recovery-v2.js?v=2.0.0&fresh='+Date.now(),'data-lh-qb-recovery-v2');
  loadScript('curriculum-display-fix.js?v=1.0.0&fresh='+Date.now(),'data-lh-curriculum-final');
  loadScript('curriculum-authoritative-final.js?v=2.0.0&fresh='+Date.now(),'data-lh-curriculum-authoritative');
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
var n=0,t=setInterval(function(){refreshRosterUI();if(++n>=30)clearInterval(t)},500);
})();
