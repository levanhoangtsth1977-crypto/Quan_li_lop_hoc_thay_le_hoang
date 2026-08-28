/* TRIỆU PHÚ HỌC ĐƯỜNG — FINAL UI ROUTER 1.0
   Chạy sau game.js. Không thay dữ liệu câu hỏi; chỉ điều khiển ô Môn/Chủ đề.
*/
(function(){'use strict';if(window.__LH_FINAL_GAME_UI_10__)return;window.__LH_FINAL_GAME_UI_10__=true;
function render(){try{if(window.LHFinalQuestionBank&&typeof window.LHFinalQuestionBank.build==='function'){window.LHFinalQuestionBank.build();return true}if(window.LHGameDataNormalizer&&typeof window.LHGameDataNormalizer.render==='function'){window.LHGameDataNormalizer.render();return true}}catch(e){}return false}
function boot(){render();var s=document.getElementById('subject'),m=document.getElementById('gameMode');document.addEventListener('change',function(e){if(e.target===s||e.target===m)setTimeout(render,0)},true);window.addEventListener('questionBankReady',function(){setTimeout(render,0)});window.addEventListener('gamePoolReady',function(){setTimeout(render,0)});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();})();
