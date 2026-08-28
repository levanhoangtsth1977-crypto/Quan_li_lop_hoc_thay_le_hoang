/* Compatibility loader: the authoritative attendance fix is attendance-status-final-v2.js. */
(function(){
'use strict';
function load(){
  if(window.__LH_ATTENDANCE_STATUS_FINAL_V2__)return;
  if(document.querySelector('script[data-lh-att-final-loader]'))return;
  var s=document.createElement('script');
  s.src='attendance-status-final-v2.js?v=2.0.0&fresh='+Date.now();
  s.async=false;
  s.setAttribute('data-lh-att-final-loader','1');
  document.head.appendChild(s);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',load,{once:true});else load();
})();
