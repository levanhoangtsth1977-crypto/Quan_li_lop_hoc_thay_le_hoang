/* TRIỆU PHÚ HỌC ĐƯỜNG — CHAPTER FILTER FIX 5.0
   Khóa lọc = Môn + Cxx. Tên chủ đề chỉ để hiển thị.
*/
(function(){'use strict';
if(window.__LH_CHAPTER_FIX_50__)return;window.__LH_CHAPTER_FIX_50__=true;
function refresh(){if(window.LHTopicCanonical&&typeof window.LHTopicCanonical.render==='function'){window.LHTopicCanonical.render();return}var sel=document.getElementById('chapter'),sub=document.getElementById('subject'),mode=document.getElementById('gameMode');if(!sel||!sub)return;var m=mode?mode.value:'bySubject';if(m==='mixed'){sel.disabled=true;sel.innerHTML='<option value="">🌐 Tổng hợp 4 môn — không chia chủ đề</option>';return}sel.disabled=true;sel.innerHTML='<option value="">⏳ Đang tải chủ đề...</option>'}
window.refreshChapterFilter=refresh;window.LHGameSubject=function(v,id){return window.LHTopicCanonical&&window.LHTopicCanonical.subject?window.LHTopicCanonical.subject(v,id):''};window.LHGameChapterValue=function(q){return String(q&&q.topic||q&&q.chapter||q&&q.topicCode||'').trim()};
function boot(){refresh();var s=document.getElementById('subject'),m=document.getElementById('gameMode');if(s)s.addEventListener('change',refresh);if(m)m.addEventListener('change',refresh);window.addEventListener('questionBankReady',refresh)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();