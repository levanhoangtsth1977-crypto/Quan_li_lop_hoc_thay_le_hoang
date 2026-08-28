/* TRIỆU PHÚ HỌC ĐƯỜNG — GAME POOL 2.0
   Một nguồn dữ liệu duy nhất: window.GAME_QUESTIONS sau QuestionBank 6.0.
   Quy tắc: Môn → Cxx → pool tối đa 100 câu → game random trong pool.
   Không tự nạp question-bank lần hai. Không lọc theo Học kỳ/Trạng thái.
*/
(function(){'use strict';
if(window.__LH_GAME_POOL_20__)return;window.__LH_GAME_POOL_20__=true;
function text(v){return String(v==null?'':v).replace(/^\uFEFF/,'').trim().replace(/\s+/g,' ')}
function norm(v){return text(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/Đ/g,'D').replace(/đ/g,'d').replace(/[\s_\-&/.:]+/g,'').toUpperCase()}
function subjectKey(mon,id){var s=norm(mon),r=text(id).toUpperCase();
if(/^(TOAN|MATH|MATHEMATICS|MATHEMATICS5)$/.test(s)||r.indexOf('TOAN-')===0||r.indexOf('MATH-')===0)return'math';
if(/^(TV|TIENGVIET|VIETNAMESE|VIETNAMESE5)$/.test(s)||r.indexOf('TV-')===0||r.indexOf('TIENGVIET-')===0||r.indexOf('VIETNAMESE-')===0)return'vietnamese';
if(/^(KH|KHOAHOC|KHOAHOC5|SCIENCE|NATURALSCIENCE|NATURALSCIENCE5)$/.test(s)||r.indexOf('KHOA_HOC-')===0||r.indexOf('KHOA-HOC-')===0||r.indexOf('KHOAHOC-')===0||r.indexOf('SCIENCE-')===0)return'science';
if(/^(LSDL|LSDIALI|LSDIALI5|LICHSUDIALI|LICHSUVADIALI|HISTORY|HISTORYGEOGRAPHY|HISTORYANDGEOGRAPHY)$/.test(s)||r.indexOf('LS-DL-')===0||r.indexOf('LSDL-')===0||r.indexOf('LSDIALI-')===0||r.indexOf('LICHSUDIALI-')===0)return'history';return''}
function topicCode(id,chapter){var r=text(id).toUpperCase(),m=r.match(/(?:^|[-_])C(\d{1,2})(?:[-_]|$)/);if(m)return'C'+String(Number(m[1])).padStart(2,'0');var t=norm(chapter).match(/CHUDE(\d{1,2})/);return t?'C'+String(Number(t[1])).padStart(2,'0'):''}
function shuffle(a){for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1)),t=a[i];a[i]=a[j];a[j]=t}return a}
function build(){var all=Array.isArray(window.GAME_QUESTIONS)?window.GAME_QUESTIONS:[];if(!all.length)return false;window.LH_ALL_GAME_QUESTIONS=all.slice();var groups={},names={};all.forEach(function(q){if(!q)return;var id=q.id||q.ID||'',sk=subjectKey(q.Mon||q.mon||q.subject||q.subjectKey||'',id),tc=topicCode(id,q.Chuong||q.chapter||q.topicName||q.topic||'');if(!sk||!tc)return;var key=sk+'|'+tc;if(!groups[key])groups[key]=[];var nm=text(q.Chuong||q.chapter||q.topicName||q.topic||'')||('Chủ đề '+Number(tc.slice(1)));if(!names[key])names[key]=nm;q.subject=sk;q.subjectKey=sk;q.topicCode=tc;q.topicKey=key;q.chapter=nm;q.Chuong=nm;q.topic=nm;q.topicName=nm;q.status='ACTIVE';groups[key].push(q)});var pool=[];Object.keys(groups).sort().forEach(function(key){var a=groups[key].slice();if(a.length>100)a=shuffle(a).slice(0,100);pool=pool.concat(a)});window.GAME_QUESTIONS=pool;window.QuestionBankGamePool={allCount:all.length,poolCount:pool.length,groupCount:Object.keys(groups).length,groups:groups,build:build};var e=document.getElementById('questionBankStatus');if(e){e.textContent='☁️ Ngân hàng: '+all.length+' câu • Game: '+pool.length+' câu • '+Object.keys(groups).length+' nhóm Môn + Chủ đề';e.dataset.state='ok'}try{window.dispatchEvent(new CustomEvent('gamePoolReady',{detail:{allCount:all.length,poolCount:pool.length,groupCount:Object.keys(groups).length}}))}catch(_){ }if(typeof window.LHGameDataNormalizer!=='undefined'&&window.LHGameDataNormalizer.render){try{window.LHGameDataNormalizer.render()}catch(_){}}return true}
function wait(){if(window.QuestionBank&&window.QuestionBank.ready){build();return}setTimeout(wait,250)}
window.LHBuildGamePool=build;window.addEventListener('questionBankReady',function(){setTimeout(build,0)});if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',wait,{once:true});else setTimeout(wait,0);
})();