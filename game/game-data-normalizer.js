/* TRIỆU PHÚ HỌC ĐƯỜNG — DATA NORMALIZER 2.0 */
(function(){
'use strict';
if(window.__LH_GAME_DATA_NORMALIZER_20__) return;
window.__LH_GAME_DATA_NORMALIZER_20__=true;
function text(v){return String(v==null?'':v).replace(/^\uFEFF/,'').trim().replace(/\s+/g,' ')}
function norm(v){return text(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/Đ/g,'D').replace(/đ/g,'d').replace(/[\s_\-&/.:]+/g,'').toUpperCase()}
function subjectKey(mon,id){
 var s=norm(mon),r=text(id).toUpperCase();
 if(/^(TOAN|MATH|MATHEMATICS|MATHEMATICS5)$/.test(s)||/(^|[-_])(TOAN|MATH)([-_]|$)/.test(r)||r.indexOf('TOAN')>=0)return'math';
 if(/^(TV|TIENGVIET|VIETNAMESE|VIETNAMESE5)$/.test(s)||/(^|[-_])(TV|TIENGVIET|VIETNAMESE)([-_]|$)/.test(r)||r.indexOf('TIENGVIET')>=0||r.indexOf('VIETNAMESE')>=0)return'vietnamese';
 if(/^(KH|KHOAHOC|KHOAHOC5|SCIENCE|NATURALSCIENCE|NATURALSCIENCE5)$/.test(s)||/(^|[-_])(KH|KHOAHOC|SCIENCE)([-_]|$)/.test(r)||r.indexOf('KHOAHOC')>=0||r.indexOf('KHOA_HOC')>=0||r.indexOf('KHOA-HOC')>=0)return'science';
 if(/^(LSDL|LSDIALI|LSDIALI5|LICHSUDIALI|LICHSUVADIALI|HISTORY|HISTORYGEOGRAPHY|HISTORYANDGEOGRAPHY)$/.test(s)||/(^|[-_])LS[-_]?DL([-_]|$)/.test(r)||/(^|[-_])LSDIALI([-_]|$)/.test(r)||r.indexOf('LICHSUDIALI')>=0||r.indexOf('HISTORYGEOGRAPHY')>=0)return'history';
 return '';
}
function topicCode(id,chapter){
 var r=text(id).toUpperCase(),m=r.match(/(?:^|[-_])C(\d{1,2})(?:[-_]|$)/);
 if(m)return'C'+String(Number(m[1])).padStart(2,'0');
 var t=norm(chapter).match(/CHUDE(\d{1,2})/);return t?'C'+String(Number(t[1])).padStart(2,'0'):'';
}
function normalize(){
 var qs=Array.isArray(window.GAME_QUESTIONS)?window.GAME_QUESTIONS:[],names={};
 qs.forEach(function(q){if(!q)return;var id=q.id||q.ID||'',mon=q.Mon||q.mon||q.subject||'',sk=subjectKey(mon,id),tc=topicCode(id,q.Chuong||q.topicName||q.topic||q.chapter||'');if(sk&&tc&&!names[sk+'|'+tc])names[sk+'|'+tc]=text(q.Chuong||q.topicName||q.topic||q.chapter||'')||('Chủ đề '+Number(tc.slice(1)));});
 qs.forEach(function(q){if(!q)return;var id=q.id||q.ID||'',mon=q.Mon||q.mon||'',sk=subjectKey(mon,id)||subjectKey(q.subjectKey||q.subject,id),tc=topicCode(id,q.Chuong||q.topicName||q.topic||q.chapter||'');q.subject=sk||q.subject||'';q.subjectKey=sk||q.subjectKey||'';q.topicCode=tc;q.topicKey=(sk||q.subjectKey||'')+'|'+tc;if(tc){var nm=names[(sk||q.subjectKey||'')+'|'+tc]||('Chủ đề '+Number(tc.slice(1)));q.chapter=nm;q.Chuong=nm;q.topic=nm;q.topicName=nm;}q.status='ACTIVE';});
}
function render(){
 var sel=document.getElementById('chapter'),sub=document.getElementById('subject'),mode=document.getElementById('gameMode');if(!sel||!sub)return;if(mode&&mode.value==='mixed'){sel.disabled=true;sel.innerHTML='<option value="">🌐 Tổng hợp 4 môn — không chia chương</option>';return;}normalize();var target=subjectKey(sub.value,''),qs=Array.isArray(window.GAME_QUESTIONS)?window.GAME_QUESTIONS:[],map={};qs.forEach(function(q){if(q&&q.subject===target&&q.topicCode){if(!map[q.topicCode])map[q.topicCode]={name:q.chapter,count:0};map[q.topicCode].count++;}});var keys=Object.keys(map).sort(function(a,b){return Number(a.slice(1))-Number(b.slice(1));}),old=sel.value,sig=target+'|'+keys.map(function(k){return k+'='+map[k].name+'#'+map[k].count}).join('|');if(sel.dataset.lhFinal===sig&&sel.options.length)return;sel.dataset.lhFinal=sig;sel.innerHTML='';if(!keys.length){sel.disabled=true;sel.innerHTML='<option value="">⚠️ Môn này chưa có chủ đề</option>';return;}var first=document.createElement('option');first.value='';first.textContent='📚 Chọn chủ đề / chương';sel.appendChild(first);keys.forEach(function(code){var o=document.createElement('option');o.value=code;o.textContent='📘 '+map[code].name+' ('+map[code].count+' câu)';o.dataset.topicCode=code;o.dataset.topicCount=String(map[code].count);sel.appendChild(o);});sel.disabled=false;if(old&&Array.prototype.some.call(sel.options,function(o){return o.value===old||o.dataset.topicCode===old}))sel.value=old;}
window.LHGameDataNormalizer={normalize:normalize,render:render,subjectKey:subjectKey,topicCode:topicCode};
window.addEventListener('questionBankReady',function(){setTimeout(function(){normalize();render();},0)});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){setTimeout(function(){normalize();render();},0)},{once:true});else setTimeout(function(){normalize();render();},0);
})();
