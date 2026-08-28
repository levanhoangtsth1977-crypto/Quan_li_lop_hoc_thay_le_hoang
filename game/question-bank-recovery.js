/* ============================================================
   TRIỆU PHÚ HỌC ĐƯỜNG — QUESTION BANK RECOVERY 1.0
   Mục tiêu: đọc lại BO_CAU_HOI với parser khoan dung hơn khi
   engine cũ loại nhầm các dòng hợp lệ.
   - Giữ nguồn duy nhất Google Sheets / BO_CAU_HOI.
   - Không tạo câu hỏi giả.
   - Chuẩn hóa Môn -> Cxx -> Chủ đề.
   - Bỏ phần trong ngoặc ở tên Chủ đề/Chương khi hiển thị.
   - Chỉ thay bộ hiện tại nếu số câu hợp lệ tăng lên.
   ============================================================ */
(function(){
'use strict';
if(window.__LH_QB_RECOVERY_10__)return;
window.__LH_QB_RECOVERY_10__=true;

const SHEET_ID='1n8ES33AkncKR6FzK0VODMgzDbycoyA_GsPIRuj7LEDM';
const SHEET='BO_CAU_HOI';
const BASE='https://docs.google.com/spreadsheets/d/'+SHEET_ID+'/gviz/tq';
const CHUNK=100,TIMEOUT=25000,MAX_CHUNKS=40;
const text=v=>String(v==null?'':v).replace(/^\uFEFF/,'').trim().replace(/\s+/g,' ');
const norm=v=>text(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/Đ/g,'D').replace(/đ/g,'d').replace(/[\s_\-&/.:]+/g,'').toUpperCase();
const stripParens=v=>text(v).replace(/\s*\([^)]*\)\s*$/,'').trim();

function subject(mon,id){
  const m=norm(mon),r=norm(id);
  if(/^(TOAN|MATH|MATHEMATICS|MATHEMATICS5)$/.test(m)||r.indexOf('TOAN')>=0||r.indexOf('MATH')>=0)return'math';
  if(/^(TV|TIENGVIET|VIETNAMESE|VIETNAMESE5)$/.test(m)||r.indexOf('TV')>=0||r.indexOf('TIENGVIET')>=0||r.indexOf('VIETNAMESE')>=0)return'vietnamese';
  if(/^(KH|KHOAHOC|KHOAHOC5|SCIENCE|NATURALSCIENCE|NATURALSCIENCE5)$/.test(m)||r.indexOf('KHOAHOC')>=0||r.indexOf('SCIENCE')>=0)return'science';
  if(/^(LSDL|LSDIALI|LSDL5|LSDIALI5|LICHSUDIALI|LICHSUVADIALI|HISTORY|HISTORYGEOGRAPHY|HISTORYANDGEOGRAPHY)$/.test(m)||r.indexOf('LSDL')>=0||r.indexOf('LSDIALI')>=0||r.indexOf('LICHSUDIALI')>=0||r.indexOf('HISTORY')>=0)return'history';
  return'';
}
function topicCode(id,chapter,topic){
  const r=norm(id),raw=text(id);
  let m=raw.toUpperCase().match(/(?:^|[-_])C[_-]?(\d{1,2})(?:[-_]|$)/);if(m)return'C'+String(Number(m[1])).padStart(2,'0');
  m=r.match(/C(\d{1,2})(?:B\d|Q\d|$)/);if(m)return'C'+String(Number(m[1])).padStart(2,'0');
  for(const v of [chapter,topic]){
    const n=norm(v),t=n.match(/(?:CHUDE|CHUONG|CHUONGTRINH)(\d{1,2})/);if(t)return'C'+String(Number(t[1])).padStart(2,'0');
    const t2=text(v).match(/(?:Chủ đề|Chủ điểm|Chương|ChuDe|Chuong)\s*\.?\s*(\d{1,2})/i);if(t2)return'C'+String(Number(t2[1])).padStart(2,'0');
  }
  return'';
}
function chapterName(chapter,topic,code){
  let v=stripParens(chapter)||stripParens(topic);
  if(!v&&code)v='Chủ đề '+Number(code.slice(1));
  return v;
}
function answer(v){const s=norm(v);return s==='A'||s==='1'?0:s==='B'||s==='2'?1:s==='C'||s==='3'?2:s==='D'||s==='4'?3:-1;}
function cell(c,i){const x=c&&c[i];return x?text(x.v!=null?x.v:x.f):'';}
function jsonp(url){return new Promise((ok,no)=>{const cb='__LH_QBR_'+Date.now()+'_'+Math.random().toString(36).slice(2),sc=document.createElement('script');let done=false;const t=setTimeout(()=>{if(done)return;done=true;delete window[cb];sc.remove();no(Error('BO_CAU_HOI phản hồi quá chậm'))},TIMEOUT);window[cb]=d=>{if(done)return;done=true;clearTimeout(t);delete window[cb];sc.remove();ok(d)};sc.onerror=()=>{if(done)return;done=true;clearTimeout(t);delete window[cb];sc.remove();no(Error('Không truy cập được BO_CAU_HOI'))};sc.src=url+'&tqx='+encodeURIComponent('out:json;responseHandler:'+cb)+'&t='+Date.now();sc.async=true;document.head.appendChild(sc)})}
function parse(data,offset){
  const rows=(data&&data.table&&data.table.rows)||[],list=[];
  rows.forEach((r,i)=>{
    const c=r.c||[];
    const stt=cell(c,0),id=cell(c,1),mon=cell(c,2),sem=cell(c,3),chapter=cell(c,4),book=cell(c,5),level=cell(c,6),group=cell(c,7),question=cell(c,8),A=cell(c,9),B=cell(c,10),C=cell(c,11),D=cell(c,12),ans=cell(c,13),explain=cell(c,14),points=cell(c,15),time=cell(c,16),status=cell(c,17);
    if(!question||!A||!B||!C||!D)return;
    const sk=subject(mon,id),tc=topicCode(id,chapter,'');
    if(!sk||!tc)return;
    const an=answer(ans);if(an<0)return;
    const qid=id||('RECOVERED-'+sk.toUpperCase()+'-'+tc+'-R'+String(offset+i+2).padStart(5,'0'));
    const ch=chapterName(chapter,'',tc);
    list.push({id:qid,subject:sk,subjectKey:sk,Mon:mon,semester:sem,topicCode:tc,topicKey:sk+'|'+tc,chapter:ch,Chuong:ch,topic:ch,topicName:ch,set:book,level:/^M[1-4]$/i.test(level)?level.toUpperCase():'M1',group:group,question:question,options:[A,B,C,D],correctAnswer:an,explanation:explain,points:Number(String(points).replace(',','.'))||1,time:Number(String(time).replace(',','.'))||30,status:'ACTIVE',rawStatus:status,stt:stt,_row:offset+i+2});
  });
  return{rows:rows.length,list};
}
function publish(all,raw){
  const seen=new Set(),u=[];all.forEach(q=>{const id=String(q.id||'').trim();if(!id||seen.has(id))return;seen.add(id);u.push(q)});
  const current=Array.isArray(window.LH_ALL_GAME_QUESTIONS)?window.LH_ALL_GAME_QUESTIONS:[];
  if(u.length<current.length)return;
  window.LH_ALL_GAME_QUESTIONS=u.slice();window.GAME_QUESTIONS=u.slice();
  if(window.QuestionBank){window.QuestionBank.count=u.length;window.QuestionBank.rawRows=raw;window.QuestionBank.rejected=Math.max(0,raw-u.length);window.QuestionBank.version='8.0+RECOVERY'}
  const e=document.getElementById('questionBankStatus');if(e){e.textContent='☁️ BO_CAU_HOI: '+u.length+' câu • đọc '+raw+' dòng • sẵn sàng Môn/Chủ đề';e.dataset.state='ok'}
  window.dispatchEvent(new CustomEvent('questionBankReady',{detail:{count:u.length,rawRows:raw,recovered:true}}));
}
function load(){
  let all=[],off=0,chunks=0;
  const next=()=>{
    if(chunks>=MAX_CHUNKS){publish(all,off);return;}
    const q='select * limit '+CHUNK+' offset '+off;
    jsonp(BASE+'?sheet='+encodeURIComponent(SHEET)+'&headers=1&tq='+encodeURIComponent(q)).then(d=>{
      const p=parse(d,off);all=all.concat(p.list);chunks++;off+=p.rows;
      if(p.rows<CHUNK){publish(all,off);return;}
      setTimeout(next,20);
    }).catch(()=>{});
  };
  next();
}
setTimeout(load,350);
})();
