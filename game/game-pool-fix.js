/* TRIỆU PHÚ HỌC ĐƯỜNG — GAME POOL 1.0
   Quy tắc: MÔN → CHỦ ĐỀ/CHƯƠNG → pool tối đa 100 câu.
   Giữ toàn bộ ngân hàng ở window.LH_ALL_GAME_QUESTIONS;
   GAME_QUESTIONS chỉ là pool dùng cho game.
*/
(function(){
'use strict';
if(window.__LH_GAME_POOL_FIX_10__) return;
window.__LH_GAME_POOL_FIX_10__=true;

function text(v){return String(v==null?'':v).replace(/^\uFEFF/,'').trim().replace(/\s+/g,' ')}
function norm(v){return text(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/Đ/g,'D').replace(/đ/g,'d').replace(/[\s_\-&/.:]+/g,'').toUpperCase()}
function subjectKey(mon,id){
 var s=norm(mon),r=text(id).toUpperCase();
 if(/^(TOAN|MATH|MATHEMATICS|MATHEMATICS5)$/.test(s)||/(^|[-_])(TOAN|MATH)([-_]|$)/.test(r)||r.indexOf('TOAN')>=0)return'math';
 if(/^(TV|TIENGVIET|VIETNAMESE|VIETNAMESE5)$/.test(s)||/(^|[-_])(TV|TIENGVIET|VIETNAMESE)([-_]|$)/.test(r)||r.indexOf('TIENGVIET')>=0||r.indexOf('VIETNAMESE')>=0)return'vietnamese';
 if(/^(KH|KHOAHOC|KHOAHOC5|SCIENCE|NATURALSCIENCE|NATURALSCIENCE5)$/.test(s)||/(^|[-_])(KH|KHOAHOC|SCIENCE)([-_]|$)/.test(r)||r.indexOf('KHOAHOC')>=0||r.indexOf('KHOA_HOC')>=0||r.indexOf('KHOA-HOC')>=0)return'science';
 if(/^(LSDL|LSDIALI|LSDIALI5|LICHSUDIALI|LICHSUVADIALI|HISTORY|HISTORYGEOGRAPHY|HISTORYANDGEOGRAPHY)$/.test(s)||/(^|[-_])LS[-_]?DL([-_]|$)/.test(r)||/(^|[-_])LSDIALI([-_]|$)/.test(r)||r.indexOf('LICHSUDIALI')>=0||r.indexOf('HISTORYGEOGRAPHY')>=0)return'history';
 return'';
}
function topicCode(id,chapter){
 var r=text(id).toUpperCase(),m=r.match(/(?:^|[-_])C(\d{1,2})(?:[-_]|$)/);
 if(m)return'C'+String(Number(m[1])).padStart(2,'0');
 var t=norm(chapter).match(/CHUDE(\d{1,2})/);return t?'C'+String(Number(t[1])).padStart(2,'0'):'';
}
function shuffle(a){for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=a[i];a[i]=a[j];a[j]=t;}return a}
function build(){
 var src=Array.isArray(window.GAME_QUESTIONS)?window.GAME_QUESTIONS:[];
 if(!src.length)return false;
 var all=src.slice();
 window.LH_ALL_GAME_QUESTIONS=all.slice();
 var groups={},names={};
 all.forEach(function(q){
   if(!q)return;
   var id=q.id||q.ID||'',sk=subjectKey(q.Mon||q.mon||q.subject||'',id),tc=topicCode(id,q.Chuong||q.topicName||q.topic||q.chapter||'');
   if(!sk||!tc)return;
   var key=sk+'|'+tc;
   if(!groups[key])groups[key]=[];
   if(!names[key])names[key]=text(q.Chuong||q.topicName||q.topic||q.chapter||'')||('Chủ đề '+Number(tc.slice(1)));
   q.subject=sk;q.subjectKey=sk;q.topicCode=tc;q.topicKey=key;q.chapter=names[key];q.Chuong=names[key];q.topic=names[key];q.topicName=names[key];q.status='ACTIVE';
   groups[key].push(q);
 });
 var pool=[];
 Object.keys(groups).forEach(function(key){
   var a=groups[key].slice();
   if(a.length>100)a=shuffle(a).slice(0,100);
   pool=pool.concat(a);
 });
 window.GAME_QUESTIONS=pool;
 window.QuestionBankGamePool={allCount:all.length,poolCount:pool.length,groups:groups,build:build};
 var e=document.getElementById('questionBankStatus');
 if(e){e.textContent='☁️ Ngân hàng: '+all.length+' câu • Game: '+pool.length+' câu trong các pool Môn + Chủ đề (tối đa 100/pool)';e.dataset.state='ok';}
 try{window.dispatchEvent(new CustomEvent('gamePoolReady',{detail:{allCount:all.length,poolCount:pool.length,groupCount:Object.keys(groups).length}}));}catch(e){}
 return true;
}
window.LHBuildGamePool=build;
window.addEventListener('questionBankReady',function(){setTimeout(build,0)});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){setTimeout(build,0)},{once:true});else setTimeout(build,0);
})();
