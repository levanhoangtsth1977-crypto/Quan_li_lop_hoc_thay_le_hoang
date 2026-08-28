/* TRIỆU PHÚ HỌC ĐƯỜNG — FINAL QUESTION BANK ENGINE 8.0
   FIX GỐC: MÔN -> Cxx -> CHỦ ĐỀ/CHƯƠNG.
   Nguồn duy nhất: Google Sheets / BO_CAU_HOI.
   - Chuẩn hóa Môn mạnh, có fallback từ ID.
   - Chuẩn hóa mã Cxx mạnh, không phụ thuộc duy nhất vào Chuong.
   - Một khóa duy nhất: subject|Cxx.
   - Tên Chủ đề được canonical hóa theo Cxx để không bị tách do khác kiểu viết.
   - Không dùng Học kỳ/Trạng thái để loại câu.
   - Giữ toàn bộ câu hợp lệ; pool tối đa 100/cặp Môn-Chủ đề chỉ dùng khi chơi.
*/
(function(){'use strict';
if(window.__LH_FINAL_QB_80__)return;window.__LH_FINAL_QB_80__=true;
var SHEET_ID='1n8ES33AkncKR6FzK0VODMgzDbycoyA_GsPIRuj7LEDM',SHEET='BO_CAU_HOI',BASE='https://docs.google.com/spreadsheets/d/'+SHEET_ID+'/gviz/tq';
var CHUNK=100,TIMEOUT=25000,MAX_CHUNKS=40;
var QB={ready:false,count:0,rawRows:0,rejected:0,duplicates:0,chunks:0,error:null,version:'8.0'};window.QuestionBank=QB;
function txt(v){return String(v==null?'':v).replace(/^\uFEFF/,'').trim().replace(/\s+/g,' ')}
function norm(v){return txt(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/Đ/g,'D').replace(/đ/g,'d').replace(/[\s_\-&/.:]+/g,'').toUpperCase()}
function subject(mon,id){
 var m=norm(mon),r=norm(id);
 if(/^(TOAN|MATH|MATHEMATICS|MATHEMATICS5)/.test(m)||/(^|[-_])(?:TOAN|MATH)(?:[-_]|$)/.test(String(id).toUpperCase())||r.indexOf('TOAN')>=0)return'math';
 if(/^(TV|TIENGVIET|VIETNAMESE|VIETNAMESE5)/.test(m)||/(^|[-_])(?:TV|TIENGVIET|VIETNAMESE)(?:[-_]|$)/.test(String(id).toUpperCase())||r.indexOf('TIENGVIET')>=0||r.indexOf('VIETNAMESE')>=0)return'vietnamese';
 if(/^(KH|KHOAHOC|KHOAHOC5|SCIENCE|NATURALSCIENCE|NATURALSCIENCE5)/.test(m)||/(^|[-_])(?:KH|KHOAHOC|SCIENCE|NATURALSCIENCE)(?:[-_]|$)/.test(String(id).toUpperCase())||r.indexOf('KHOAHOC')>=0||r.indexOf('SCIENCE')>=0)return'science';
 if(/^(LSDL|LSDIALI|LSDIALI5|LICHSUDIALI|LICHSUVADIALI|HISTORY|HISTORYGEOGRAPHY|HISTORYANDGEOGRAPHY)/.test(m)||/(^|[-_])(?:LSDL|LSDIALI|LICHSUDIALI|HISTORY)(?:[-_]|$)/.test(String(id).toUpperCase())||r.indexOf('LSDIALI')>=0||r.indexOf('LICHSUDIALI')>=0||r.indexOf('HISTORYGEOGRAPHY')>=0)return'history';
 return'';
}
function topicCode(id,chapter){
 var raw=txt(id).toUpperCase(), n=norm(id), m=raw.match(/(?:^|[-_])C[_-]?(\d{1,2})(?:[-_]|$)/i);
 if(m)return'C'+String(Number(m[1])).padStart(2,'0');
 var m2=n.match(/C(\d{1,2})(?:B\d|Q\d|$)/);if(m2)return'C'+String(Number(m2[1])).padStart(2,'0');
 var t=norm(chapter).match(/CHUDE(\d{1,2})/);if(t)return'C'+String(Number(t[1])).padStart(2,'0');
 var t2=txt(chapter).match(/(?:Chủ đề|Chuong|Chương)\s*[_-]?(\d{1,2})/i);return t2?'C'+String(Number(t2[1])).padStart(2,'0'):'';
}
function canonicalName(chapter,code){var v=txt(chapter);if(v&&code){var n=norm(v),m=n.match(/CHUDE(\d{1,2})/);if(m)return'Chủ đề '+Number(m[1])+v.replace(/^.*?\d{1,2}[\s.:-]*/,'').trim();}return v||(code?'Chủ đề '+Number(code.slice(1)):'');}
function cell(c,i){var x=c&&c[i];return x?txt(x.v!=null?x.v:x.f):''}
function ans(v){var s=norm(v);return s==='A'||s==='1'?0:s==='B'||s==='2'?1:s==='C'||s==='3'?2:s==='D'||s==='4'?3:0}
function jsonp(url,timeout){return new Promise(function(ok,no){var cb='__LH_FINAL_QB80_'+Date.now()+'_'+Math.random().toString(36).slice(2),sc=document.createElement('script'),done=false,t=setTimeout(function(){if(done)return;done=true;delete window[cb];if(sc.parentNode)sc.parentNode.removeChild(sc);no(Error('Google Sheets phản hồi quá chậm'))},timeout);window[cb]=function(d){if(done)return;done=true;clearTimeout(t);delete window[cb];if(sc.parentNode)sc.parentNode.removeChild(sc);ok(d)};sc.onerror=function(){if(done)return;done=true;clearTimeout(t);delete window[cb];if(sc.parentNode)sc.parentNode.removeChild(sc);no(Error('Không truy cập được BO_CAU_HOI'))};sc.src=url+'&tqx='+encodeURIComponent('out:json;responseHandler:'+cb)+'&t='+Date.now();sc.async=true;document.head.appendChild(sc)})}
function parse(data,offset){var rows=(data&&data.table&&data.table.rows)||[],list=[],bad=0;rows.forEach(function(r,i){var c=r.c||[],id=cell(c,1),mon=cell(c,2),sem=cell(c,3),chapter=cell(c,4),book=cell(c,5),level=cell(c,6),group=cell(c,7),question=cell(c,8),A=cell(c,9),B=cell(c,10),C=cell(c,11),D=cell(c,12),answer=cell(c,13),explain=cell(c,14),points=cell(c,15),time=cell(c,16),status=cell(c,17);if(!id||!question||!A||!B||!C||!D){bad++;return}var sk=subject(mon,id),tc=topicCode(id,chapter);if(!sk||!tc){bad++;return}var ch=canonicalName(chapter,tc);list.push({id:id,subject:sk,subjectKey:sk,Mon:mon,semester:sem,topicCode:tc,topicKey:sk+'|'+tc,chapter:ch,Chuong:ch,topic:ch,topicName:ch,set:book,level:/^M[1-4]$/i.test(level)?level.toUpperCase():'M1',group:group,question:question,options:[A,B,C,D],correctAnswer:ans(answer),explanation:explain,points:Number(String(points).replace(',','.'))||1,time:Number(String(time).replace(',','.'))||30,status:'ACTIVE',rawStatus:status,stt:cell(c,0),_row:offset+i+2})});return{rows:rows.length,list:list,bad:bad}}
function show(t,state){var e=document.getElementById('questionBankStatus');if(e){e.textContent=t;e.dataset.state=state||'loading'}}
function finish(all,raw,bad,chunks){var seen={},u=[],dup=0;all.forEach(function(q){var k=String(q.id||'').trim();if(!k||seen[k]){if(k)dup++;return}seen[k]=1;u.push(q)});window.LH_ALL_GAME_QUESTIONS=u.slice();window.GAME_QUESTIONS=u.slice();QB.ready=true;QB.count=u.length;QB.rawRows=raw;QB.rejected=bad;QB.duplicates=dup;QB.chunks=chunks;QB.error=null;show('☁️ BO_CAU_HOI: '+u.length+' câu • đọc '+raw+' dòng • sẵn sàng Môn/Chủ đề','ok');try{window.dispatchEvent(new CustomEvent('questionBankReady',{detail:{count:u.length,rawRows:raw,rejectedRows:bad,duplicates:dup,chunks:chunks}}))}catch(e){}setTimeout(renderFilters,0)}
function fail(e){QB.ready=false;QB.error=e;show('❌ '+(e&&e.message?e.message:'Không tải được BO_CAU_HOI'),'error')}
function poolKey(sk,tc){return'LH_TPHD_POOL_2026_2027|'+sk+'|'+tc}
function shuffle(a){for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1)),t=a[i];a[i]=a[j];a[j]=t}return a}
function renderFilters(){var all=Array.isArray(window.LH_ALL_GAME_QUESTIONS)?window.LH_ALL_GAME_QUESTIONS:[];if(!all.length)return;var groups={},names={};all.forEach(function(q){var sk=q.subject,tc=q.topicCode;if(!sk||!tc)return;var key=sk+'|'+tc;if(!groups[key])groups[key]=[];var name=txt(q.chapter)||('Chủ đề '+Number(tc.slice(1)));if(!names[key]||name.length>names[key].length)names[key]=name;groups[key].push(q)});
 var selected=[];Object.keys(groups).forEach(function(key){var p=key.split('|'),a=groups[key].slice(),ids=[];try{ids=JSON.parse(localStorage.getItem(poolKey(p[0],p[1]))||'[]')}catch(e){}var map={};a.forEach(function(q){map[q.id]=q});var keep=ids.filter(function(id){return!!map[id]});if(a.length>100&&keep.length!==100){keep=shuffle(a.slice()).slice(0,100).map(function(q){return q.id});try{localStorage.setItem(poolKey(p[0],p[1]),JSON.stringify(keep))}catch(e){}}if(a.length<=100)keep=a.map(function(q){return q.id});keep.forEach(function(id){if(map[id])selected.push(map[id])})});window.GAME_QUESTIONS=selected;
 var s=document.getElementById('subject'),c=document.getElementById('chapter'),m=document.getElementById('gameMode');if(!s||!c)return;
 function sk(){return subject(s.value,'')||String(s.value||'').toLowerCase()}
 function render(){if(m&&m.value==='mixed'){c.disabled=true;c.innerHTML='<option value="">🌐 Tổng hợp 4 môn</option>';window.GAME_QUESTIONS=window.LH_ALL_GAME_QUESTIONS.slice();return}var k=sk(),old=c.value,codes=Object.keys(groups).filter(function(x){return x.split('|')[0]===k}).sort(function(a,b){return Number(a.split('|')[1].slice(1))-Number(b.split('|')[1].slice(1))});c.innerHTML='';if(!codes.length){c.disabled=true;c.innerHTML='<option value="">⚠️ Môn này chưa có chủ đề</option>';return}var first=document.createElement('option');first.value='';first.textContent='📚 Chọn chủ đề / chương';c.appendChild(first);codes.forEach(function(key){var p=key.split('|'),o=document.createElement('option');o.value=names[key];o.textContent='📘 '+names[key]+' ('+groups[key].length+' câu)';o.dataset.topicCode=p[1];o.dataset.subject=p[0];o.dataset.questionCount=String(groups[key].length);c.appendChild(o)});c.disabled=false;if(old&&Array.prototype.some.call(c.options,function(o){return o.value===old}))c.value=old}
 render();s.onchange=render;if(m)m.onchange=render}
function load(){if(window.__LH_FINAL_QB_LOADING__)return;window.__LH_FINAL_QB_LOADING__=true;QB.ready=false;var all=[],off=0,bad=0,chunks=0;function next(){if(chunks>=MAX_CHUNKS){finish(all,off,bad,chunks);window.__LH_FINAL_QB_LOADING__=false;return}var q='select * where B is not null limit '+CHUNK+' offset '+off;show('☁️ Đang tải BO_CAU_HOI… lô '+(chunks+1)+' • đã đọc '+off+' dòng','loading');jsonp(BASE+'?sheet='+encodeURIComponent(SHEET)+'&headers=1&tq='+encodeURIComponent(q),TIMEOUT).then(function(d){var p=parse(d,off);if(!p.rows){finish(all,off,bad,chunks);window.__LH_FINAL_QB_LOADING__=false;return}all=all.concat(p.list);bad+=p.bad;chunks++;off+=p.rows;if(p.rows<CHUNK){finish(all,off,bad,chunks);window.__LH_FINAL_QB_LOADING__=false;return}setTimeout(next,25)}).catch(function(e){fail(e);window.__LH_FINAL_QB_LOADING__=false})}next()}
window.LHFinalQuestionBank={load:load,build:renderFilters,getStats:function(){return QB},getCatalog:function(){var all=window.LH_ALL_GAME_QUESTIONS||[],m={};all.forEach(function(q){var k=q.subject+'|'+q.topicCode;if(!m[k])m[k]={subject:q.subject,topicCode:q.topicCode,name:q.chapter,count:0};m[k].count++});return Object.keys(m).sort().map(function(k){return m[k]})}};
load();
})();
