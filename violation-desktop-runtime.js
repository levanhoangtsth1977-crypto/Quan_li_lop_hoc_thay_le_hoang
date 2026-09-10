/* VI PHẠM DESKTOP RUNTIME LOADER 1.0
 * Chỉ nạp CSS desktop cho #page-violations.
 * Không thay đổi router, dữ liệu hoặc giao diện mobile.
 */
(function(){
  'use strict';
  if(window.__LH_VIOLATION_DESKTOP_RUNTIME_10__) return;
  window.__LH_VIOLATION_DESKTOP_RUNTIME_10__=true;
  function load(){
    if(window.innerWidth<1024) return;
    if(document.querySelector('link[data-lh-violation-desktop-ui]')) return;
    var link=document.createElement('link');
    link.rel='stylesheet';
    link.href='violation-desktop-ui.css?v=1.0.0';
    link.setAttribute('data-lh-violation-desktop-ui','1');
    document.head.appendChild(link);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',load,{once:true});else load();
  window.addEventListener('resize',load,{passive:true});
})();