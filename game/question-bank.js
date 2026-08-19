/* TRIỆU PHÚ HỌC ĐƯỜNG — GOOGLE SHEETS QUESTION BANK v2 */
(function(){'use strict';
  var SHEET_ID='1n8ES33AkncKR6FzK0VODMgzDbycoyA_GsPIRuj7LEDM';
  var SHEET_NAME='BO_CAU_HOI';
  var BASE='https://docs.google.com/spreadsheets/d/'+SHEET_ID+'/gviz/tq';
  var questions=Array.isArray(window.GAME_QUESTIONS)?window.GAME_QUESTIONS:[];
  var statusEl,ready=false,loading=false,timer=null,script=null;
  window.QuestionBank={ready:false,count:0,error:null,url:BASE};
  function status(text,ok){statusEl=document.getElementById('questionBankStatus');if(statusEl){statusEl.textContent=text;statusEl.dataset.state=ok?'ok':'loading';}}
  function clean(v){return v==null?'':String(v).trim();}
  function num(v,d){var n=Number(v);return Number.isFinite(n)?n:d;}
  function subject(v){var s=clean(v).toUpperCase();
    if(s==='TOAN'||s==='MATH'||s==='MATHEMATICS'||s==='➗ TOÁN')return'math';
    if(s==='TV'||s==='TIENGVIET'||s==='TIẾNG VIỆT'||s==='VIETNAMESE'||s==='📖 TIẾNG VIỆT')return'vietnamese';
    if(s==='KHOA_HOC'||s==='KHOA HỌC'||s==='SCIENCE'||s==='🔬 KHOA HỌC')return'science';
    if(s==='LS_DIA_LI'||s==='LSĐL'||s==='LICH SU & DIA LI'||s==='LỊCH SỬ & ĐỊA LÍ'||s==='HISTORY'||s==='HISTORY_GEOGRAPHY'||s==='🌏 LỊCH SỬ & ĐỊA LÍ')return'history';
    return s.toLowerCase();}
  function answerIndex(v){var s=clean(v).toUpperCase();if(s==='A'||s==='1')return 0;if(s==='B'||s==='2')return 1;if(s==='C'||s==='3')return 2;if(s==='D'||s==='4')return 3;var n=Number(s);return Number.isFinite(n)&&n>=0&&n<=3?n:0;}
  function parse(data){
    if(!data||!data.table)throw new Error('Google Sheets không trả về bảng dữ liệu');
    var cols=data.table.cols||[],rows=data.table.rows||[];
    var heads=cols.map(function(c){return clean(c.label||c.id);});
    function idx(name){return heads.indexOf(name);}
    var map={STT:idx('STT'),ID:idx('ID'),Mon:idx('Mon'),MucDo:idx('MucDo'),CauHoi:idx('CauHoi'),A:idx('A'),B:idx('B'),C:idx('C'),D:idx('D'),DapAn:idx('DapAn'),GiaiThich:idx('GiaiThich'),Diem:idx('Diem'),ThoiGian:idx('ThoiGian'),TrangThai:idx('TrangThai')};
    if(map.ID<0||map.Mon<0||map.CauHoi<0||map.A<0||map.B<0||map.C<0||map.D<0||map.DapAn<0)throw new Error('BO_CAU_HOI thiếu cột bắt buộc: cần STT, ID, Mon, MucDo, CauHoi, A, B, C, D, DapAn...');
    var list=rows.map(function(r){var c=r.c||[];function val(k){var i=map[k];return i>=0&&c[i]?clean(c[i].v):'';}var st=val('TrangThai').toLowerCase();if(st&&['active','hoatdong','hoạt động','1','true','on'].indexOf(st)<0)return null;var opts=[val('A'),val('B'),val('C'),val('D')];if(!val('CauHoi')||opts.some(function(x){return !x;}))return null;return{id:val('ID'),subject:subject(val('Mon')),level:val('MucDo')||'M1',question:val('CauHoi'),options:opts,correctAnswer:answerIndex(val('DapAn')),explanation:val('GiaiThich'),points:num(val('Diem'),10),time:num(val('ThoiGian'),30),stt:val('STT')};}).filter(Boolean).filter(function(q){return q.id;});
    if(!list.length)throw new Error('BO_CAU_HOI không có câu hỏi Active hợp lệ');
    return list;
  }
  function finish(list){loading=false;ready=true;window.QuestionBank.ready=true;window.QuestionBank.count=list.length;window.QuestionBank.error=null;questions.splice(0,questions.length);Array.prototype.push.apply(questions,list);status('☁️ Ngân hàng Google: '+list.length+' câu',true);}
  function fail(err){loading=false;ready=false;window.QuestionBank.ready=false;window.QuestionBank.error=err;status('❌ Không tải được Google Sheet: '+(err&&err.message?err.message:'Lỗi kết nối'),false);}
  function load(){
    if(loading)return;loading=true;status('☁️ Đang tải BO_CAU_HOI từ Google Sheets…',false);
    if(script&&script.parentNode)script.parentNode.removeChild(script);
    var cb='__LH_GS_'+Date.now();
    window[cb]=function(data){clearTimeout(timer);try{finish(parse(data));}catch(e){fail(e);}delete window[cb];if(script&&script.parentNode)script.parentNode.removeChild(script);};
    script=document.createElement('script');
    script.src=BASE+'?sheet='+encodeURIComponent(SHEET_NAME)+'&tqx='+encodeURIComponent('out:json;responseHandler:'+cb)+'&headers=1';
    script.async=true;
    script.onerror=function(){clearTimeout(timer);fail(new Error('Không truy cập được Google Sheets. Kiểm tra quyền chia sẻ hoặc tab BO_CAU_HOI.'));};
    document.head.appendChild(script);
    timer=setTimeout(function(){if(loading)fail(new Error('Google Sheets phản hồi quá chậm (>15 giây)'));},15000);
  }
  window.QuestionBank.load=load;
  document.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('[data-action="start"]');if(b&&!window.QuestionBank.ready){e.preventDefault();e.stopImmediatePropagation();load();}},true);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',load);else load();
})();
