/* TRIỆU PHÚ HỌC ĐƯỜNG — CHAPTER FILTER 6.0 — SINGLE SOURCE
   Chỉ làm nhiệm vụ hiển thị danh sách Chủ đề/Chương.
   KHÔNG sửa GAME_QUESTIONS.
   Khóa hiển thị = Môn + mã Cxx lấy từ ID; tên hiển thị lấy từ Chuong/topic.
*/
(function(){'use strict';
if(window.__LH_CHAPTER_FILTER_60__)return;
window.__LH_CHAPTER_FILTER_60__=true;
function text(v){return String(v==null?'':v).replace(/^\uFEFF/,'').trim().replace(/\s+/g,' ')}
function norm(v){return text(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/Đ/g,'D').replace(/đ/g,'d').replace(/[\s_\-&/.:]+/g,'').toUpperCase()}
function subject(v,id){var s=norm(v),r=String(id||'').toUpperCase();if(/^(TOAN|MATH|MATHEMATICS)$/.test(s)||/(^|[-_])TOAN([_-]|$)/.test(r))return'math';if(/^(TV|TIENGVIET|VIETNAMESE)$/.test(s)||/(^|[-_])TV([_-]|$)/.test(r)||r.indexOf('TIENGVIET')>=0)return'vietnamese';if(/^(KH|KHOAHOC|KHOAHOC5|SCIENCE|NATURALSCIENCE)$/.test(s)||/(^|[-_])KHOA[_-]?HOC([_-]|$)/.test(r))return'science';if(/^(LSDL|LSDIALI|LSDIALI5|LICHSUDIALI|LICHSUVADIALI|HISTORY|HISTORYGEOGRAPHY|HISTORYANDGEOGRAPHY)$/.test(s)||/(^|[-_])LS[_-]?DL([_-]|$)/.test(r)||r.indexOf('LSDIALI')>=0)return'history';return s.toLowerCase()}
function code(id,topic){var r=String(id||'').toUpperCase();var m=r.match(/(?:^|[-_])C(\d{1,2})(?:[-_]|$)/);if(m)return'C'+String(Number(m[1])).padStart(2,'0');var t=text(topic).toUpperCase().match(/(?:^|\s)C?(?:HỦ|HU|CHU)?\s*ĐỀ\s*(\d{1,2})/);return t?'C'+String(Number(t[1])).padStart(2,'0'):''}
function topicName(q,c){var a=[q&&q.Chuong,q&&q.topicName,q&&q.topic,q&&q.chapter,q&&q.ChuDe,q&&q.chude];for(var i=0;i<a.length;i++){var v=text(a[i]);if(v&&v!==c&&!/^C\d{2}$/.test(v))return v}return c?'Chủ đề '+Number(c.slice(1)):'Chủ đề chưa xác định'}
function render(){var sel=document.getElementById('chapter'),subSel=document.getElementById('subject'),mode=document.getElementById('gameMode');if(!sel||!subSel)return; if(mode&&mode.value==='mixed'){if(sel.dataset.lh60==='mixed')return;sel.innerHTML='<option value="">🌐 Tổng hợp 4 môn — không chia chủ đề</option>';sel.disabled=true;sel.dataset.lh60='mixed';return}
var qs=Array.isArray(window.GAME_QUESTIONS)?window.GAME_QUESTIONS:[];if(!qs.length){sel.disabled=true;sel.innerHTML='<option value="">⏳ Đang tải chủ đề...</option>';sel.dataset.lh60='loading';return}
var target=subject(subSel.value,''),map={};qs.forEach(function(q){if(subject(q&& (q.subject||q.Mon),q&& (q.id||q.ID))!==target)return;var c=code(q&& (q.id||q.ID),q&& (q.Chuong||q.chapter||q.topic||q.topicName));if(!c)return;var name=topicName(q,c);if(!map[c])map[c]=name;});
var keys=Object.keys(map).sort(function(a,b){return Number(a.slice(1))-Number(b.slice(1))});var oldCode=sel.options.length?String(sel.value||''):'';var sig=target+'|'+keys.map(function(k){return k+'='+map[k]}).join('||');if(sel.dataset.lh60===sig)return;sel.dataset.lh60=sig;sel.innerHTML='';if(!keys.length){sel.disabled=true;sel.innerHTML='<option value="">⚠️ Chưa có chủ đề cho môn này</option>';return}
var first=document.createElement('option');first.value='';first.textContent='📚 Chọn chủ đề / chương';sel.appendChild(first);keys.forEach(function(c){var o=document.createElement('option');o.value=c;o.textContent='📘 '+map[c];o.dataset.topicCode=c;sel.appendChild(o)});sel.disabled=false;if(oldCode&&keys.indexOf(oldCode)>=0)sel.value=oldCode;
}
window.LHChapterFilter={render:render};
function hook(){var s=document.getElementById('subject'),m=document.getElementById('gameMode');if(s)s.addEventListener('change',function(){setTimeout(render,0)});if(m)m.addEventListener('change',function(){setTimeout(render,0)});window.addEventListener('questionBankReady',function(){setTimeout(render,0)});render();var n=0,t=setInterval(function(){render();if(++n>=12)clearInterval(t)},500)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',hook,{once:true});else hook();
})();
