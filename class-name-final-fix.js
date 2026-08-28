/* CLASS NAME FINAL FIX — display only. Preserve legacy data IDs/values. */
(function(){'use strict';
if(window.__LH_CLASS_NAME_FINAL__)return;window.__LH_CLASS_NAME_FINAL__=true;
var NAME='Lớp 5A3';window.LH_CLASS_NAME='5A3';document.documentElement.dataset.lhClass='5A3';
function fix(){document.querySelectorAll('#classSelect option').forEach(function(o){if(/^Lớp\s*5C$/i.test(o.textContent.trim()))o.textContent=NAME});var hc=document.getElementById('heroClass');if(hc)hc.textContent=NAME;var walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);var n;while(n=walker.nextNode()){if(n.nodeValue.indexOf('Lớp 5C')>=0)n.nodeValue=n.nodeValue.replace(/Lớp 5C/g,NAME)}}
function boot(){[0,100,300,800,1500,3000].forEach(function(ms){setTimeout(fix,ms)})}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();})();
