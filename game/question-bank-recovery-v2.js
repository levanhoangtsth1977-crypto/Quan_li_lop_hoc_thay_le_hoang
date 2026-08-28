/* TRIỆU PHÚ HỌC ĐƯỜNG — QUESTION BANK RECOVERY V2 */
(function(){'use strict';
if(window.__LH_QB_RECOVERY_V2__)return;window.__LH_QB_RECOVERY_V2__=true;
const SHEET_ID='1n8ES33AkncKR6FzK0VODMgzDbycoyA_GsPIRuj7LEDM',SHEET='BO_CAU_HOI',BASE='https://docs.google.com/spreadsheets/d/'+SHEET_ID+'/gviz/tq';
const CHUNK=100,MAX_CHUNKS=50,TIMEOUT=25000;
const text=v=>String(v==null?'':v).replace(/^\uFEFF/,'').trim().replace(/\s+/g,' ');
const norm=v=>text(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/Đ/g,'D').replace(/đ/g,'d').replace(/[\s_\-&/.:]+/g,'').toUpperCase();
function subject(mon,id){
 const m=norm(mon),r=text(id).toUpperCase();
 if(/^(TOAN|MATH|MATHEMATICS)(5)?$/.test(m)||/(^|[-_])(?:TOAN|MATH)(?:[-_]|$)/.test(r))return'math';
 if(/^(TV|TIENGVIET|VIETNAMESE)(5)?$/.test(m)||/(^|[-_])(?:TV|TIENGVIET|VIETNAMESE)(?:[-_]|$)/.test(r))return'vietnamese';
 if(/^(KH|KHOAHOC|SCIENCE|NATURALSCIENCE)(5)?$/.test(m)||/(^|[-_])(?:KH|KHOA[_-]?HOC|SCIENCE|NATURALSCIENCE)(?:[-_]|$)/.test(r))return'science';
 if(/^(LSDL|LSDIALI|LICHSUDIALI|LICHSUVADIALI|HISTORY|HISTORYGEOGRAPHY|HISTORYANDGEOGRAPHY)(5)?$/.test(m)||/(^|[-_])(?:LS[-_]?DL|LSDIALI|LICHSUDIALI|HISTORY)(?:[-_]|$)/.test(r))return'history';
 return'';
}
function topicCode(id,chapter){
 const r=text(id).toUpperCase();
 let m=r.match(/(?:^|[-_])C[_-]?(\d{1,2})(?:[-_]|$)/);if(m)return'C'+String(Number(m[1])).padStart(2,'0');
 const n=norm(chapter);m=n.match(/(?:CHUDE|CHUDIEM|CHUONG)(\d{1,2})/);if(m)return'C'+String(Number(m[1])).padStart(2,'0');
 return'';
}
function label(sk,tc,chapter){
 const catalogs={
  math:{C01:'Chủ đề 1. Ôn tập và bổ sung',C02:'Chủ đề 2. Số thập phân',C03:'Chủ đề 3. Một số đơn vị đo diện tích',C04:'Chủ đề 4. Các phép tính với số thập phân',C05:'Chủ đề 5. Một số hình phẳng. Chu vi và diện tích',C06:'Chủ đề 6. Ôn tập học kì 1',C07:'Chủ đề 7. Tỉ số và các bài toán liên quan',C08:'Chủ đề 8. Thể tích. Đơn vị đo thể tích',C09:'Chủ đề 9. Diện tích và thể tích của một số hình khối',C10:'Chủ đề 10. Số đo thời gian, vận tốc. Các bài toán liên quan đến chuyển động đều',C11:'Chủ đề 11. Một số yếu tố thống kê và xác suất',C12:'Chủ đề 12. Ôn tập cuối năm'},
  vietnamese:{C01:'Chủ điểm 1. Thế giới tuổi thơ',C02:'Chủ điểm 2. Thiên nhiên kì thú',C03:'Chủ điểm 3. Trên con đường học tập',C04:'Chủ điểm 4. Nghệ thuật muôn màu',C05:'Chủ điểm 5. Vẻ đẹp cuộc sống',C06:'Chủ điểm 6. Hương sắc trăm miền',C07:'Chủ điểm 7. Tiếp bước cha ông',C08:'Chủ điểm 8. Thế giới của chúng ta'},
  science:{C01:'Chủ đề 1. Chất',C02:'Chủ đề 2. Năng lượng',C03:'Chủ đề 3. Thực vật và động vật',C04:'Chủ đề 4. Vi khuẩn',C05:'Chủ đề 5. Con người và sức khoẻ',C06:'Chủ đề 6. Sinh vật và môi trường'}
 };
 return (catalogs[sk]&&catalogs[sk][tc])||text(chapter).replace(/\s*\([^)]*\)\s*$/,'')||('Chủ đề '+Number(tc.slice(1)));
}
function cell(c,i){const x=c&&c[i];return text(x&&x.v!=null?x.v:(x&&x.f)||'')}
function ans(v){const s=norm(v);return s==='A'||s==='1'?0:s==='B'||s==='2'?1:s==='C'||s==='3'?2:s==='D'||s==='4'?3:-1}
function jsonp(url){return new Promise((resolve,reject)=>{const cb='__LH_QBR2_'+Date.now()+'_'+Math.random().toString(36).slice(2),sc=document.createElement('script');let done=false;const timer=setTimeout(()=>{if(done)return;done=true;delete window[cb];sc.remove();reject(Error('BO_CAU_HOI timeout'))},TIMEOUT);window[cb]=d=>{if(done)return;done=true;clearTimeout(timer);delete window[cb];sc.remove();resolve(d)};sc.onerror=()=>{if(done)return;done=true;clearTimeout(timer);delete window[cb];sc.remove();reject(Error('BO_CAU_HOI unavailable'))};sc.src=url+'&tqx='+encodeURIComponent('out:json;responseHandler:'+cb)+'&t='+Date.now();sc.async=true;document.head.appendChild(sc)})}
function parse(data,offset){const rows=data&&data.table&&data.table.rows||[],out=[];rows.forEach((r,i)=>{const c=r.c||[],id=cell(c,1),mon=cell(c,2),sem=cell(c,3),chapter=cell(c,4),book=cell(c,5),level=cell(c,6),group=cell(c,7),question=cell(c,8),A=cell(c,9),B=cell(c,10),C=cell(c,11),D=cell(c,12),correct=ans(cell(c,13)),explain=cell(c,14),points=cell(c,15),time=cell(c,16),rawStatus=cell(c,17);if(!id||!question||!A||!B||!C||!D||correct<0)return;const sk=subject(mon,id);const tc=topicCode(id,chapter);if(!sk||!tc)return;const name=label(sk,tc,chapter);out.push({id,subject:sk,subjectKey:sk,Mon:mon,semester:sem,topicCode:tc,topicKey:sk+'|'+tc,chapter:name,Chuong:name,topic:name,topicName:name,set:book,level:/^M[1-4]$/i.test(level)?level.toUpperCase():'M1',group,question,options:[A,B,C,D],correctAnswer:correct,explanation:explain,points:Number(String(points).replace(',','.'))||1,time:Number(String(time).replace(',','.'))||30,status:'ACTIVE',rawStatus,stt:cell(c,0),_row:offset+i+2})});return{rows:rows.length,list:out}}
function publish(all,raw){const seen=new Set(),u=[];all.forEach(q=>{if(!q||seen.has(q.id))return;seen.add(q.id);u.push(q)});const current=Array.isArray(window.LH_ALL_GAME_QUESTIONS)?window.LH_ALL_GAME_QUESTIONS:[];if(u.length<current.length)return;window.LH_ALL_GAME_QUESTIONS=u;window.GAME_QUESTIONS=u.slice();if(window.QuestionBank){window.QuestionBank.count=u.length;window.QuestionBank.rawRows=raw;window.QuestionBank.version='RECOVERY-V2'}try{window.dispatchEvent(new CustomEvent('questionBankReady',{detail:{recovered:true,version:'2.0',count:u.length,rawRows:raw}}))}catch(_){}}
function load(){let all=[],off=0,chunks=0;(function next(){if(chunks>=MAX_CHUNKS){publish(all,off);return}jsonp(BASE+'?sheet='+encodeURIComponent(SHEET)+'&headers=1&tq='+encodeURIComponent('select * limit '+CHUNK+' offset '+off)).then(d=>{const p=parse(d,off);all=all.concat(p.list);chunks++;off+=p.rows;if(p.rows<CHUNK)publish(all,off);else setTimeout(next,15)}).catch(()=>{} )})()}
window.LHQuestionBankRecoveryV2={load};setTimeout(load,500);
})();
