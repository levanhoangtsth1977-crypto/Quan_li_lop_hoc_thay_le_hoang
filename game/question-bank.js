/* TRIỆU PHÚ HỌC ĐƯỜNG — QUESTION BANK 4.3 SAFE
   Nguồn duy nhất: Google Sheets / BO_CAU_HOI.
   Game lọc theo Môn + Chủ đề/Chương.
   Không dùng Học kỳ hoặc Trạng thái để loại câu hỏi.
*/
(function(){'use strict';
var SHEET_ID='1n8ES33AkncKR6FzK0VODMgzDbycoyA_GsPIRuj7LEDM',SHEET_NAME='BO_CAU_HOI';
var BASE='https://docs.google.com/spreadsheets/d/'+SHEET_ID+'/gviz/tq';
var questions=Array.isArray(window.GAME_QUESTIONS)?window.GAME_QUESTIONS:[];
var ready=false,loading=false,timer=null,script=null,pendingStart=false;
window.QuestionBank={ready:false,count:0,error:null,url:BASE};
function clean(v){return v==null?'':String(v).replace(/^\uFEFF/,'').trim()}
function norm(v){return clean(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/Đ/g,'D').replace(/đ/g,'d').replace(/[\s_\-&/.:]+/g,'').toUpperCase()}
function subject(v,id){var s=norm(v),r=String(id==null?'':id).toUpperCase();if(/^(TOAN|MATH|MATHEMATICS)$/.test(s)||r.indexOf('TOAN')>=0)return'math';if(/^(TV|TIENGVIET|VIETNAMESE)$/.test(s)||r.indexOf('TIENGVIET')>=0||/^TV[-_]/.test(r))return'vietnamese';if(/^(KH|KHOAHOC|KHOAHOC5|SCIENCE|NATURALSCIENCE)$/.test(s)||r.indexOf('KHOA_HOC')>=0||r.indexOf('KHOA-HOC')>=0||r.indexOf('KHOAHOC')>=0)return'science';if(/^(LSDL|LSDIALI|LSDIALI5|LICHSUDIALI|LICHSUVADIALI|HISTORY|HISTORYGEOGRAPHY|HISTORYANDGEOGRAPHY)$/.test(s)||r.indexOf('LS-DL')>=0||r.indexOf('LS_DL')>=0||r.indexOf('LSDIALI')>=0||r.indexOf('LICHSUDIALI')>=0)return'history';return s.toLowerCase()}
function chapterFromId(id){var r=String(id==null?'':id).trim().toUpperCase(),m=r.match(/(?:^|[-_])C(\d{1,2})(?:[-_]|$)/);return m?'Chủ đề '+Number(m[1]):''}
function chapter(v,id){var s=clean(v);return s||chapterFromId(id)||''}
function num(v,d){var n=Number(String(v==null?'':v).replace(',','.'));return Number.isFinite(n)?n:d}
function answerIndex(v){var s=norm(v);if(s==='A'||s==='1')return 0;if(s==='B'||s==='2')return 1;if(s==='C'||s==='3')return 2;if(s==='D'||s==='4')return 3;var n=Number(s);return Number.isFinite(n)&&n>=0&&n<=3?n:0}
function valueFromCell(c,i){var cell=i>=0?c[i]:null;return cell?clean(cell.v!=null?cell.v:cell.f):''}
function parse(data){
 if(!data||!data.table)throw new Error('Google Sheets không trả về bảng BO_CAU_HOI');
 var rows=data.table.rows||[];
 var list=rows.map(function(r,ri){var c=r.c||[];
   /* BO_CAU_HOI chuẩn 18 cột: STT,ID,Mon,HocKy,Chuong,Bo,MucDo,NhomKT,CauHoi,A,B,C,D,DapAn,GiaiThich,Diem,ThoiGian,TrangThai */
   var id=valueFromCell(c,1),mon=valueFromCell(c,2),hocKy=valueFromCell(c,3),chuong=valueFromCell(c,4),bo=valueFromCell(c,5),muc=valueFromCell(c,6),nhom=valueFromCell(c,7),question=valueFromCell(c,8),A=valueFromCell(c,9),B=valueFromCell(c,10),C=valueFromCell(c,11),D=valueFromCell(c,12),answer=valueFromCell(c,13),explain=valueFromCell(c,14),points=valueFromCell(c,15),time=valueFromCell(c,16),status=valueFromCell(c,17);
   if(!id||!question||!A||!B||!C||!D)return null;
   var ch=chapter(chuong,id);
   return{id:id,subject:subject(mon,id),Mon:mon,semester:hocKy,chapter:ch,Chuong:ch,topic:ch,topicName:ch,set:bo,level:muc||'M1',group:nhom,question:question,options:[A,B,C,D],correctAnswer:answerIndex(answer),explanation:explain,points:num(points,1),time:num(time,30),status:status||'ACTIVE',stt:valueFromCell(c,0),_row:ri+2};
 }).filter(Boolean);
 if(!list.length)throw new Error('BO_CAU_HOI không có dòng câu hỏi hợp lệ.');
 return list;
}
function setStatus(t,ok){var e=document.getElementById('questionBankStatus');if(e){e.textContent=t;e.dataset.state=ok?'ok':'loading'}}
function finish(list){loading=false;ready=true;window.QuestionBank.ready=true;window.QuestionBank.count=list.length;window.QuestionBank.error=null;questions.splice(0,questions.length);Array.prototype.push.apply(questions,list);setStatus('☁️ BO_CAU_HOI: '+list.length+' câu • đã kết nối Môn/Chủ đề',true);if(typeof window.initQuestionFilters==='function')window.initQuestionFilters();try{window.dispatchEvent(new Event('questionBankReady'))}catch(e){}if(pendingStart){pendingStart=false;setTimeout(function(){var b=document.querySelector('[data-action="start"]');if(b)b.click()},0)}}
function fail(e){loading=false;ready=false;window.QuestionBank.ready=false;pendingStart=false;window.QuestionBank.error=e;setStatus('❌ '+(e&&e.message?e.message:'Không tải được BO_CAU_HOI'),false)}
function load(){if(loading||ready)return;loading=true;setStatus('☁️ Đang tải BO_CAU_HOI…',false);var cb='__LH_GS_'+Date.now();window[cb]=function(data){clearTimeout(timer);try{finish(parse(data))}catch(e){fail(e)}delete window[cb];if(script&&script.parentNode)script.parentNode.removeChild(script)};script=document.createElement('script');script.src=BASE+'?sheet='+encodeURIComponent(SHEET_NAME)+'&headers=1&tqx='+encodeURIComponent('out:json;responseHandler:'+cb)+'&range=A:R&t='+Date.now();script.async=true;script.onerror=function(){clearTimeout(timer);fail(new Error('Không truy cập được Google Sheets / BO_CAU_HOI.'))};document.head.appendChild(script);timer=setTimeout(function(){if(loading)fail(new Error('Google Sheets phản hồi quá chậm (>15 giây)'))},15000)}
window.QuestionBank.load=load;
document.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('[data-action="start"]');if(b&&!window.QuestionBank.ready){pendingStart=true;e.preventDefault();e.stopImmediatePropagation();load()}},true);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',load);else load();
})();
