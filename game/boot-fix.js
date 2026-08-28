/* TRIỆU PHÚ HỌC ĐƯỜNG — BOOT FIX 2.0 */
(function(){'use strict';
if(window.__LH_GAME_BOOT_20__)return;window.__LH_GAME_BOOT_20__=true;
function refreshRoster(){var sel=document.getElementById('student'),list=window.GameData&&window.GameData.getStudents?window.GameData.getStudents():[];if(!sel||!Array.isArray(list)||!list.length)return;var old=sel.value;sel.innerHTML='';list.forEach(function(s){var id=String(s.id||s.studentId||s.studentCode||s.name||s.studentName||'').trim(),name=String(s.name||s.studentName||id).trim();if(!id)return;var o=document.createElement('option');o.value=id;o.textContent=name;sel.appendChild(o)});if(old&&Array.from(sel.options).some(function(o){return o.value===old}))sel.value=old}
function loadFinal(){if(document.querySelector('script[data-lh-authoritative-game]'))return;var s=document.createElement('script');s.src='curriculum-authoritative-final.js?v=3.0.0&fresh='+Date.now();s.async=false;s.setAttribute('data-lh-authoritative-game','1');document.head.appendChild(s)}
function boot(){refreshRoster();loadFinal();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
window.addEventListener('gameRosterReady',refreshRoster);
})();