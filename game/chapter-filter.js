/* TRIỆU PHÚ HỌC ĐƯỜNG — CHAPTER FILTER 6.1 — SUBJECT SAFE
   Một bộ lọc duy nhất cho Chủ đề/Chương.
   Phân loại Môn bằng Mon/subject + ID.
   Phân loại Chủ đề bằng mã Cxx trong ID.
   Tên Chuong chỉ là nhãn hiển thị.
*/
(function(){'use strict';
if(window.__LH_CHAPTER_FILTER_61__)return;
window.__LH_CHAPTER_FILTER_61__=true;
function text(v){return String(v==null?'':v).replace(/^\uFEFF/,'').trim().replace(/\s+/g,' ')}
function norm(v){return text(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/Đ/g,'D').replace(/đ/g,'d').replace(/[\s_\-&/.:]+/g,'').toUpperCase()}
function subject(v,id){var s=norm(v),r=String(id||'').toUpperCase();if(/^(TOAN|MATH|MATHEMATICS)$/.test(s)||/(^|[-_])TOAN([_-]|$)/.test(r))return'math';if(/^(TV|TIENGVIET|VIETNAMESE)$/.test(s)||/(^|[-_])TV([_-]|$)/.test(r)||r.indexOf('TIENGVIET')>=0)return'vietnamese';if(/^(KH|KHOAHOC|KHOAHOC5|SCIENCE|NATURALSCIENCE)$/.test(s)||/(^|[-_])KHOA[_-]?HOC([_-]|$)/.test(r))return'science';if(/^(LSDL|LSDIALI|LSDIALI5|LICHSUDIALI|LICHSUVADIALI|HISTORY|HISTORYGEOGRAPHY|HISTORYANDGEOGRAPHY)$/.test(s)||/(^|[-_])LS[_-]?DL([_-]|$)/.test(r)||r.indexOf('LSDIALI')>=0)return'history';return s.toLowerCase()}
function codeOf(id){var r=String(id||'').trim().toUpperCase(),m=r.match(/(?:^|[-_])C(\d{1,2})(?:[-_]|$)/);return m?'C'+String(Number(m[1])).padStart(2,'0'):''}
function chapterName(q,code){var a=[q&&q.Chuong,q&&q.topicName,q&&q.topic,q&&q.chapter,q&&q.ChuDe,q&&q.chude];for(var i=0;i<a.length;i++){var v=text(a[i]);if(v&&!/^C\d{2}$/.test(v))return v}return code?'Chủ đề '+Number(code.slice(1)):''}
function canonicalizeForGame(qs){var names={};qs.forEach(function(q){if(!q)return;var c=codeOf(q.id||q.ID||'');if(!c)return;var s=subject(q.subject||q.Mon,q.id||q.ID);var key=s+'|'+c;if(!names[key])names[key]=chapterName(q,c)});qs.forEach(function(q){if(!q)return;var c=codeOf(q.id||q.ID||'');if(!c)return;var s=subject(q.subject||q.Mon,q.id||q.ID);var name=names[s+'|'+c];if(name){q.chapter=name;q.topic=name;q.topicName=name;q.Chuong=name}})}
function render(){var sel=document.getElementById('chapter'),subSel=document.getElementById('subject'),mode=document.getElementById('gameMode');if(!sel||!subSel)return;if(mode&&mode.value==='mixed'){sel.disabled=true;sel.innerHTML='<option value="">🌐 Tổng hợp 4 môn — không chia chủ đề</option>';sel.dataset.lh61='mixed';return}
var qs=Array.isArray(window.GAME_QUESTIONS)?window.GAME_QUESTIONS:[];if(!qs.length){sel.disabled=true;sel.innerHTML='<option value="">⏳ Đang tải chủ đề...</option>';sel.dataset.lh61='loading';return}
canonicalizeForGame(qs);var target=subject(subSel.value,''),map={};qs.forEach(function(q){if(subject(q&& (q.subject||q.Mon),q&& (q.id||q.ID))!==target)return;var c=codeOf(q&& (q.id||q.ID));if(!c)return;var name=chapterName(q,c);if(!map[c])map[c]=name;});var keys=Object.keys(map).sort(function(a,b){return Number(a.slice(1))-Number(b.slice(1))});var sig=target+'|'+keys.map(function(k){return k+'='+map[k]}).join('||');if(sel.dataset.lh61===sig&&sel.options.length)return;var old=sel.value;sel.innerHTML='';if(!keys.length){sel.disabled=true;sel.innerHTML='<option value="">⚠️ Chưa có chủ đề cho môn này</option>';sel.dataset.lh61=sig;return}var first=document.createElement('option');first.value='';first.textContent='📚 Chọn chủ đề / chương';sel.appendChild(first);keys.forEach(function(c){var o=document.createElement('option');o.value=map[c];o.textContent='📘 '+map[c];o.dataset.topicCode=c;o.dataset.subject=target;sel.appendChild(o)});sel.disabled=false;sel.dataset.lh61=sig;if(old&&keys.indexOf(old)>=0)sel.value=old}
window.LHChapterFilter={render:render,subject:subject,codeOf:codeOf};
function hook(){var s=document.getElementById('subject'),m=document.getElementById('gameMode');if(s)s.addEventListener('change',function(){setTimeout(render,0)});if(m)m.addEventListener('change',function(){setTimeout(render,0)});window.addEventListener('questionBankReady',function(){setTimeout(render,0)});render();var n=0,t=setInterval(function(){render();if(++n>=12)clearInterval(t)},500)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',hook,{once:true});else hook();
})();
