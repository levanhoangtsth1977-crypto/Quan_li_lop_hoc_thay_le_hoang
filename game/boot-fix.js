/* TRIỆU PHÚ HỌC ĐƯỜNG — BOOT/ROSTER FIX 1.0 */
(function(){'use strict';
function refreshRosterUI(){
  var sel=document.getElementById('student');
  var list=window.GameData&&window.GameData.getStudents?window.GameData.getStudents():[];
  if(!sel||!list.length)return;
  sel.innerHTML='';
  list.forEach(function(s){
    var id=String(s.id||s.studentCode||s.studentId||s.name||s.studentName||'');
    var name=s.name||s.studentName||id;
    var o=document.createElement('option');o.value=id;o.textContent=name;sel.appendChild(o);
  });
}
window.addEventListener('gameRosterReady',refreshRosterUI);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){setTimeout(refreshRosterUI,50);});else setTimeout(refreshRosterUI,50);
})();
