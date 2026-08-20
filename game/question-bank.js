/* TRIỆU PHÚ HỌC ĐƯỜNG — QUESTION BANK SYSTEM 3.5 */
(function(){'use strict';
var SHEET_ID='1n8ES33AkncKR6FzK0VODMgzDbycoyA_GsPIRuj7LEDM';
var SHEET_NAME='BO_CAU_HOI';
var BASE='https://docs.google.com/spreadsheets/d/'+SHEET_ID+'/gviz/tq';
var questions=Array.isArray(window.GAME_QUESTIONS)?window.GAME_QUESTIONS:[];
var statusEl,ready=false,loading=false,timer=null,script=null,pendingStart=false;
window.QuestionBank={ready:false,count:0,error:null,url:BASE};
function status(text,ok){statusEl=document.getElementById('questionBankStatus');if(statusEl){statusEl.textContent=text;statusEl.dataset.state=ok?'ok':'loading';}}
function clean(v){return v==null?'':String(v).replace(/^\uFEFF/,'').trim();}
function norm(v){return clean(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/Đ/g,'D').replace(/đ/g,'d').replace(/[\s_\-&/]+/g,'').toUpperCase();}
function num(v,d){var n=Number(v);return Number.isFinite(n)?n:d;}
function subject(v){var s=norm(v);if(['TOAN','MATH','MATHEMATICS'].indexOf(s)>=0)return'math';if(['TV','TIENGVIET','VIETNAMESE'].indexOf(s)>=0)return'vietnamese';if(['KH','KHOAHOC','SCIENCE'].indexOf(s)>=0)return'science';if(['LSDL','LSDIALI','LICHSUDIALI','LICHSUVADIALI','HISTORY','HISTORYGEOGRAPHY','HISTORYANDGEOGRAPHY'].indexOf(s)>=0)return'history';return s.toLowerCase();}
function answerIndex(v){var s=norm(v);if(s==='A'||s==='1')return 0;if(s==='B'||s==='2')return 1;if(s==='C'||s==='3')return 2;if(s==='D'||s==='4')return 3;var n=Number(s);return Number.isFinite(n)&&n>=0&&n<=3?n:0;}
function parse(data){
 if(!data||!data.table)throw new Error('Google Sheets không trả về bảng dữ liệu');
 var cols=data.table.cols||[],rows=data.table.rows||[];var heads=cols.map(function(c){return norm(c.label||c.id);});
 var aliases={STT:['STT'],ID:['ID','MAID','QUESTIONID'],Mon:['MON','MONHOC','SUBJECT'],HocKy:['HOCKY','HOC KY','SEMESTER'],Chuong:['CHUONG','CHUONGCHUDE','CHUONGCHUDE1','CHAPTER','TOPIC'],Bo:['BO','BỘ','SET'],MucDo:['MUCDO','MUC'],NhomKT:['NHOMKT'],CauHoi:['CAUHOI','QUESTION'],A:['A','DA','DAPANA'],B:['B','DB','DAPANB'],C:['C','DC','DAPANC'],D:['D','DD','DAPAND'],DapAn:['DAPAN','DAPANDUNG','CORRECTANSWER'],GiaiThich:['GIAITHICH','EXPLANATION'],Diem:['DIEM','POINTS'],ThoiGian:['THOIGIAN','TIME'],TrangThai:['TRANGTHAI','STATUS']};
 function idx(name){var a=aliases[name]||[name],i,j;for(i=0;i<a.length;i++){j=heads.indexOf(norm(a[i]));if(j>=0)return j;}return -1;}
 var map={};Object.keys(aliases).forEach(function(k){map[k]=idx(k);});
 var required=['ID','Mon','Chuong','MucDo','CauHoi','A','B','C','D','DapAn'];
 if(required.some(function(k){return map[k]<0;})&&rows.length){var first=(rows[0]&&rows[0].c)||[];var firstHeads=first.map(function(cell){return norm(cell&&(cell.v!=null?cell.v:cell.f));});var oldHeads=heads;heads=firstHeads;Object.keys(aliases).forEach(function(k){map[k]=idx(k);});if(required.every(function(k){return map[k]>=0;}))rows=rows.slice(1);else heads=oldHeads;}
 if(required.some(function(k){return map[k]<0;}))throw new Error('BO_CAU_HOI thiếu cột bắt buộc. Header phải là: STT | ID | Mon | HocKy | Chuong | Bo | MucDo | NhomKT | CauHoi | A | B | C | D | DapAn | GiaiThich | Diem | ThoiGian | TrangThai');
 var list=rows.map(function(r){var c=r.c||[];function val(k){var i=map[k];var cell=i>=0?c[i]:null;return cell?clean(cell.v!=null?cell.v:cell.f):'';}var st=val('TrangThai').toLowerCase();if(st&&['active','hoatdong','hoạt động','1','true','on'].indexOf(st)<0)return null;var opts=[val('A'),val('B'),val('C'),val('D')];if(!val('CauHoi')||opts.some(function(x){return !x;}))return null;return{id:val('ID'),subject:subject(val('Mon')),semester:val('HocKy'),chapter:clean(val('Chuong')),set:val('Bo'),level:val('MucDo')||'M1',group:val('NhomKT'),question:val('CauHoi'),options:opts,correctAnswer:answerIndex(val('DapAn')),explanation:val('GiaiThich'),points:num(val('Diem'),1),time:num(val('ThoiGian'),30),status:val('TrangThai')||'ACTIVE',stt:val('STT')};}).filter(Boolean).filter(function(q){return q.id;});
 if(!list.length)throw new Error('BO_CAU_HOI không có câu hỏi Active hợp lệ');return list;
}
function finish(list){loading=false;ready=true;window.QuestionBank.ready=true;window.QuestionBank.count=list.length;window.QuestionBank.error=null;questions.splice(0,questions.length);Array.prototype.push.apply(questions,list);status('☁️ Ngân hàng Google: '+list.length+' câu • đã sẵn sàng lọc Môn/Chương',true);if(typeof window.initQuestionFilters==='function')window.initQuestionFilters();try{window.dispatchEvent(new Event('questionBankReady'));}catch(e){}if(pendingStart){pendingStart=false;setTimeout(function(){var b=document.querySelector('[data-action="start"]');if(b)b.click();},0);}}
function fail(err){loading=false;ready=false;window.QuestionBank.ready=false;pendingStart=false;window.QuestionBank.error=err;status('❌ Không tải được Google Sheet: '+(err&&err.message?err.message:'Lỗi kết nối'),false);}
function load(){if(loading||ready)return;loading=true;status('☁️ Đang tải BO_CAU_HOI từ Google Sheets…',false);if(script&&script.parentNode)script.parentNode.removeChild(script);var cb='__LH_GS_'+Date.now();window[cb]=function(data){clearTimeout(timer);try{finish(parse(data));}catch(e){fail(e);}delete window[cb];if(script&&script.parentNode)script.parentNode.removeChild(script);};script=document.createElement('script');script.src=BASE+'?sheet='+encodeURIComponent(SHEET_NAME)+'&tqx='+encodeURIComponent('out:json;responseHandler:'+cb)+'&headers=1&range='+encodeURIComponent('A:R');script.async=true;script.onerror=function(){clearTimeout(timer);fail(new Error('Không truy cập được Google Sheets. Kiểm tra quyền chia sẻ hoặc tab BO_CAU_HOI.'));};document.head.appendChild(script);timer=setTimeout(function(){if(loading)fail(new Error('Google Sheets phản hồi quá chậm (>15 giây)'));},15000);}
window.QuestionBank.load=load;
document.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('[data-action="start"]');if(b&&!window.QuestionBank.ready){pendingStart=true;e.preventDefault();e.stopImmediatePropagation();load();}},true);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',load);else load();
})();
