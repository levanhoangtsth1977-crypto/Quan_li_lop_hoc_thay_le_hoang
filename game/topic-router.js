/* TRIỆU PHÚ HỌC ĐƯỜNG — TOPIC ROUTER 1.0
   SINGLE SOURCE OF TRUTH for Môn + Chủ đề.
   Không sửa GAME_QUESTIONS. Không dùng Học kỳ/Trạng thái.
   Select value = tên Chuong gốc để tương thích game.js.
*/
(function(){'use strict';
if(window.__LH_TOPIC_ROUTER_10__)return;window.__LH_TOPIC_ROUTER_10__=true;
function text(v){return String(v==null?'':v).replace(/^\uFEFF/,'').trim().replace(/\s+/g,' ')}
function norm(v){return text(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/Đ/g,'D').replace(/đ/g,'d').replace(/[\s_\-&/.:]+/g,'').toUpperCase()}
function subject(v,id){var s=norm(v),r=String(id||'').toUpperCase();if(/^(TOAN|MATH|MATHEMATICS)$/.test(s)||/(^|[-_])TOAN([_-]|$)/.test(r))return'math';if(/^(TV|TIENGVIET|VIETNAMESE)$/.test(s)||/(^|[-_])TV([_-]|$)/.test(r)||r.indexOf('TIENGVIET')>=0)return'vietnamese';if(/^(KH|KHOAHOC|KHOAHOC5|SCIENCE|NATURALSCIENCE)$/.test(s)||/(^|[-_])KHOA[_-]?HOC([_-]|$)/.test(r)||r.indexOf('KHOAHOC')>=0)return'science';if(/^(LSDL|LSDIALI|LSDIALI5|LICHSUDIALI|LICHSUVADIALI|HISTORY|HISTORYGEOGRAPHY|HISTORYANDGEOGRAPHY)$/.test(s)||/(^|[-_])LS[_-]?DL([_-]|$)/.test(r)||r.indexOf('LSDIALI')>=0)return'history';return s.toLowerCase()}
function code(id,topic){var r=String(id||'').trim().toUpperCase(),m=r.match(/(?:^|[-_])C(\d{1,2})(?:[-_]|$)/);if(m)return'C'+String(Number(m[1])).padStart(2,'0');var t=text(topic).normalize('NFC').match(/(?:^|\s)Ch(?:u|ủ)\s*đề\s*([0-9]{1,2})/i);return t?'C'+String(Number(t[1])).padStart(2,'0'):''}
function topicText(q){return text(q&& (q.Chuong||q.topicName||q.topic||q.chapter||q.ChuDe||q.chude||''))}
function render(){var sel=document.getElementById('chapter'),sEl=document.getElementById('subject'),mEl=document.getElementById('gameMode');if(!sel||!sEl)return;if(mEl&&mEl.value==='mixed'){sel.disabled=true;sel.innerHTML='<option value="">🌐 Tổng hợp 4 môn — không chia chủ đề</option>';return}
var qs=Array.isArray(window.GAME_QUESTIONS)?window.GAME_QUESTIONS:[],target=subject(sEl.value,''),map={};
qs.forEach(function(q){var sid=q&& (q.id||q.ID||'');if(subject(q&& (q.Mon||q.subject),sid)!==target)return;var c=code(sid,topicText(q));if(!c)return;var name=topicText(q)||('Chủ đề '+Number(c.slice(1)));if(!map[c])map[c]={name:name,count:0};map[c].count++;if(name.length>map[c].name.length)map[c].name=name;});
var keys=Object.keys(map).sort(function(a,b){return Number(a.slice(1))-Number(b.slice(1))});var old=String(sel.value||'');var sig=target+'|'+keys.map(function(k){return k+'='+map[k].name+'#'+map[k].count}).join('|');if(sel.dataset.topicRouterSig===sig&&sel.options.length)return;sel.innerHTML='';sel.dataset.topicRouterSig=sig;if(!keys.length){sel.disabled=true;sel.innerHTML='<option value="">⚠️ Chưa có chủ đề cho môn này</option>';return}var first=document.createElement('option');first.value='';first.textContent='📚 Chọn chủ đề / chương';sel.appendChild(first);keys.forEach(function(k){var o=document.createElement('option');o.value=map[k].name;o.textContent='📘 '+map[k].name;o.dataset.topicCode=k;o.dataset.questionCount=map[k].count;sel.appendChild(o)});sel.disabled=false;if(old&&Array.prototype.some.call(sel.options,function(o){return o.value===old}))sel.value=old;}
function hook(){var s=document.getElementById('subject'),m=document.getElementById('gameMode');if(s)s.onchange=function(){render()};if(m)m.onchange=function(){render()};window.addEventListener('questionBankReady',function(){render()});window.addEventListener('pageshow',function(){render()});render();}
window.LHTopicRouter={render:render,subject:subject,code:code};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',hook,{once:true});else hook();
})();
