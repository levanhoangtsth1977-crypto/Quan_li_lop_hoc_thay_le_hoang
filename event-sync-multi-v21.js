/* RUNTIME FINAL 23.0
   Legacy event sync remains disabled. Only loads safe display/attendance fixes.
*/
(function(){'use strict';window.__LH_EVENT_SYNC_DISABLED__=true;
function load(src,key){if(document.querySelector('script['+key+']'))return;var s=document.createElement('script');s.src=src;s.async=false;s.setAttribute(key,'1');document.head.appendChild(s)}
function boot(){load('attendance-status-final-v2.js?v=2.0.0&fresh='+Date.now(),'data-lh-att-final');load('class-name-final-fix.js?v=1.0.0&fresh='+Date.now(),'data-lh-class-final')}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();})();
