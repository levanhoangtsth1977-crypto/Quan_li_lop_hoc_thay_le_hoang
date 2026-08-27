/* TRIỆU PHÚ HỌC ĐƯỜNG — QUESTION BANK SYSTEM 4.0
   Nguồn: Google Sheets / BO_CAU_HOI
   Bộ lọc game: Môn + Chủ đề/Chương. Không phụ thuộc Học kỳ.
*/
(function(){'use strict';
var SHEET_ID='1n8ES33AkncKR6FzK0VODMgzDbycoyA_GsPIRuj7LEDM',SHEET_NAME='BO_CAU_HOI';
var BASE='https://docs.google.com/spreadsheets/d/'+SHEET_ID+'/gviz/tq';
var questions=Array.isArray(window.GAME_QUESTIONS)?window.GAME_QUESTIONS:[];
var ready=false,loading=false,timer=null,script=null,pendingStart=false;
window.QuestionBank={ready:false,count:0,error:null,url:BASE};
function clean(v){return v==null?'':String(v).replace(/^\uFEFF/,'').trim()}
function norm(v){return clean(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/Đ/g,'D').replace(/đ/g,'d').replace(/[\s_\-&/.:]+/g,'').toUpperCase()}
function subject(v,id){var s=norm(v),i=norm(id);if(/^(TOAN|MATH|MATHEMATICS)$/.test(s)||/TOAN/.test(i))return'math';if(/^(TV|TIENGVIET|VIETNAMESE)$/.test(s)||/TIENGVIET/.test(i)||/^TV[-_]/.test(i))return'vietnamese';if(/^(KH|KHOAHOC|KHOAHOC5|SCIENCE|NATURALSCIENCE)$/.test(s)||/KHOAHOC/.test(i)||/^KH[-_]/.test(i))return'science';if(/^(LSDL|LSDIALI|LSDIALI5|LICHSUDIALI|LICHSUVADIALI|HISTORY|HISTORYGEOGRAPHY|HISTORYANDGEOGRAPHY)$/.test(s)||/LICHSUDIALI/.test(i)||/^LS[-_]?DL/.test(i)||/LSDIALI/.test(i))return'history';return s.toLowerCase()}
function chapterFromId(id){var s=norm(id),m=s.match(/(?:^|-)C(\d{1,2})(?:-|$)/);return m?'Chủ đề '+String(Number(m[1])):''}
function chapter(v,id){var s=clean(v);return s||chapterFromId(id)||''}
function num(v,d){var n=Number(v);return Number.isFinite(n)?n:d}
function answerIndex(v){var s=norm(v);if(s==='A'||s==='1')return 0;if(s==='B'||s==='2')return 1;if(s==='C'||s==='3')return 2;if(s==='D'||s==='4')return 3;var n=Number(s);return Number.isFinite(n)&&n>=0&&n<=3?n:0}
function parse(data){
 if(!data||!data.table)throw new Error('Google Sheets không trả về bảng dữ liệu');
 var cols=data.table.cols||[],rows=data.table.rows||[],heads=cols.map(function(c){return norm(c.label||c.id);});
 var aliases={STT:['STT'],ID:['ID','MAID','QUESTIONID'],Mon:['MON','MONHOC','SUBJECT'],HocKy:['HOCKY','HOC KY','HOC KI','HOCKI','SEMESTER','KYHOC','HOC_KY'],Chuong:['CHUONG','CHUDE','CHUONGCHUDE','CHUDEBANG','CHUDE1','CHUDECHUONG','CHAPTER','TOPIC','TOPICNAME','CHAPTERNAME','TENCHUDE'],Bo:['BO','SET'],MucDo:['MUCDO','MUC','LEVEL'],NhomKT:['NHOMKT'],CauHoi:['CAUHOI','QUESTION'],A:['A','DA','DAPANA'],B:['B','DB','DAPANB'],C:['C','DC','DAPANC'],D:['D','DD','DAPAND'],DapAn:['DAPAN','DAPANDUNG','CORRECTANSWER'],GiaiThich:['GIAITHICH','EXPLANATION'],Diem:['DIEM','POINTS'],ThoiGian:['THOIGIAN','TIME'],TrangThai:['TRANGTHAI','STATUS']};
 function idx(k){var a=aliases[k]||[k],i,j;for(i=0;i<a.length;i++){j=heads.indexOf(norm(a[i]));if(j>=0)return j}return -1}
 var map={};Object.keys(aliases).forEach(function(k){map[k]=idx(k)});
 var required=['ID','Mon','MucDo','CauHoi','A','B','C','D','DapAn'];
 if(required.some(function(k){return map[k]<0})&&rows.length){var first=(rows[0]&&rows[0].c)||[],fh=first.map(function(cell){return norm(cell&&(cell.v!=null?cell.v:cell.f))}),old=heads;heads=fh;Object.keys(aliases).forEach(function(k){map[k]=idx(k)});if(required.every(function(k){return map[k]>=0}))rows=rows.slice(1);else heads=old}
 if(required.some(function(k){return map[k]<0}))throw new Error('BO_CAU_HOI thiếu cột bắt buộc: ID | Mon | MucDo | CauHoi | A | B | C | D | DapAn');
 return rows.map(function(r){var c=r.c||[];function val(k){var i=map[k],cell=i>=0?c[i]:null;return cell?clean(cell.v!=null?cell.v:cell.f):''}var id=val('ID'),st=val('TrangThai').toLowerCase();if(st&&['active','hoatdong','hoạt động','1','true','on'].indexOf(st)<0)return null;var opts=[val('A'),val('B'),val('C'),val('D')];if(!val('CauHoi')||opts.some(function(x){return !x}))return null;var ch=chapter(val('Chuong'),id),subj=subject(val('Mon'),id);return{id:id,subject:subj,semester:val('HocKy'),chapter:ch,Chuong:ch,topic:ch,topicName:ch,set:val('Bo'),level:val('MucDo')||'M1',group:val('NhomKT'),question:val('CauHoi'),options:opts,correctAnswer:answerIndex(val('DapAn')),explanation:val('GiaiThich'),points:num(val('Diem'),1),time:num(val('ThoiGian'),30),status:val('TrangThai')||'ACTIVE',stt:val('STT')})}).filter(Boolean).filter(function(q){return q.id})}
function status(t,ok){var e=document.getElementById('questionBankStatus');if(e){e.textContent=t;e.dataset.state=ok?'ok':'loading'}}
function finish(list){loading=false;ready=true;window.QuestionBank.ready=true;window.QuestionBank.count=list.length;window.QuestionBank.error=null;questions.splice(0,questions.length);Array.prototype.push.apply(questions,list);status('☁️ Ngân hàng Google: '+list.length+' câu • đã nhận diện Môn/Chủ đề/Chương',true);if(typeof window.initQuestionFilters==='function')window.initQuestionFilters();try{window.dispatchEvent(new Event('questionBankReady'))}catch(e){}if(pendingStart){pendingStart=false;setTimeout(function(){var b=document.querySelector('[data-action="start"]');if(b)b.click()},0)}}
function fail(e){loading=false;ready=false;window.QuestionBank.ready=false;pendingStart=false;window.QuestionBank.error=e;status('❌ Không tải được Google Sheet: '+(e&&e.message?e.message:'Lỗi kết nối'),false)}
function load(){if(loading||ready)return;loading=true;status('☁️ Đang tải BO_CAU_HOI từ Google Sheets…',false);var cb='__LH_GS_'+Date.now();window[cb]=function(data){clearTimeout(timer);try{finish(parse(data))}catch(e){fail(e)}delete window[cb];if(script&&script.parentNode)script.parentNode.removeChild(script)};script=document.createElement('script');script.src=BASE+'?sheet='+encodeURIComponent(SHEET_NAME)+'&tqx='+encodeURIComponent('out:json;responseHandler:'+cb)+'&headers=1&range='+encodeURIComponent('A:R');script.async=true;script.onerror=function(){clearTimeout(timer);fail(new Error('Không truy cập được Google Sheets. Kiểm tra quyền chia sẻ hoặc tab BO_CAU_HOI.'))};document.head.appendChild(script);timer=setTimeout(function(){if(loading)fail(new Error('Google Sheets phản hồi quá chậm (>15 giây)'))},15000)}
window.QuestionBank.load=load;document.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('[data-action="start"]');if(b&&!window.QuestionBank.ready){pendingStart=true;e.preventDefault();e.stopImmediatePropagation();load()}},true);if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',load);else load();
})();
