/* TRIỆU PHÚ HỌC ĐƯỜNG — GOOGLE SHEETS QUESTION BANK */
(function(){'use strict';
  var SHEET_ID='1i8lvDAYDwnQssOYolJWra6B-9Hc2XGx3lpbK3zuEDCo';
  var SHEET_NAME='BO_CAU_HOI';
  var API='https://docs.google.com/spreadsheets/d/'+SHEET_ID+'/gviz/tq?tqx=out:json&sheet='+encodeURIComponent(SHEET_NAME);
  var questions=Array.isArray(window.GAME_QUESTIONS)?window.GAME_QUESTIONS:[];
  var statusEl;
  var ready=false;
  window.QuestionBank={ready:false,count:0,error:null,url:API};
  function status(text,ok){
    statusEl=document.getElementById('questionBankStatus');
    if(statusEl){statusEl.textContent=text;statusEl.dataset.state=ok?'ok':'loading';}
  }
  function clean(v){return v==null?'':String(v).trim();}
  function num(v,d){var n=Number(v);return Number.isFinite(n)?n:d;}
  function subject(v){
    var s=clean(v).toUpperCase();
    if(s==='TOAN'||s==='MATH'||s==='MATHEMATICS'||s==='➗ TOÁN')return'math';
    if(s==='TV'||s==='TIENGVIET'||s==='TIẾNG VIỆT'||s==='VIETNAMESE'||s==='📖 TIẾNG VIỆT')return'vietnamese';
    if(s==='KHOA_HOC'||s==='KHOA HỌC'||s==='KHOA_HOC'||s==='SCIENCE'||s==='🔬 KHOA HỌC')return'science';
    if(s==='LS_DIA_LI'||s==='LSĐL'||s==='LICH SU & DIA LI'||s==='LỊCH SỬ & ĐỊA LÍ'||s==='HISTORY'||s==='HISTORY_GEOGRAPHY'||s==='🌏 LỊCH SỬ & ĐỊA LÍ')return'history';
    return s.toLowerCase();
  }
  function answerIndex(v){
    var s=clean(v).toUpperCase();
    if(s==='A'||s==='1')return 0;
    if(s==='B'||s==='2')return 1;
    if(s==='C'||s==='3')return 2;
    if(s==='D'||s==='4')return 3;
    var n=Number(s);return Number.isFinite(n)&&n>=0&&n<=3?n:0;
  }
  function parse(text){
    var start=text.indexOf('{'),end=text.lastIndexOf('}');
    if(start<0||end<start)throw new Error('Google Sheets không trả về JSON hợp lệ');
    var data=JSON.parse(text.slice(start,end+1));
    var cols=(data.table&&data.table.cols)||[];
    var rows=(data.table&&data.table.rows)||[];
    var heads=cols.map(function(c){return clean(c.label);});
    function idx(name){return heads.indexOf(name);}
    var map={STT:idx('STT'),ID:idx('ID'),Mon:idx('Mon'),MucDo:idx('MucDo'),CauHoi:idx('CauHoi'),A:idx('A'),B:idx('B'),C:idx('C'),D:idx('D'),DapAn:idx('DapAn'),GiaiThich:idx('GiaiThich'),Diem:idx('Diem'),ThoiGian:idx('ThoiGian'),TrangThai:idx('TrangThai')};
    if(map.ID<0||map.Mon<0||map.CauHoi<0||map.A<0||map.B<0||map.C<0||map.D<0||map.DapAn<0)throw new Error('BO_CAU_HOI thiếu một hoặc nhiều cột bắt buộc');
    return rows.map(function(r){
      var c=r.c||[];function val(k){var i=map[k];return i>=0&&c[i]?clean(c[i].v):'';}
      var st=val('TrangThai').toLowerCase();
      if(st && ['active','hoatdong','hoạt động','1','true','on'].indexOf(st)<0)return null;
      var opts=[val('A'),val('B'),val('C'),val('D')];
      if(!opts.some(Boolean)||!val('CauHoi'))return null;
      return {id:val('ID')||('GS-'+Date.now()+'-'+Math.random().toString(36).slice(2,8)),subject:subject(val('Mon')),level:val('MucDo')||'M1',question:val('CauHoi'),options:opts,correctAnswer:answerIndex(val('DapAn')),explanation:val('GiaiThich'),points:num(val('Diem'),10),time:num(val('ThoiGian'),30),stt:val('STT')};
    }).filter(Boolean).filter(function(q){return q.id&&q.question&&q.options.length===4;});
  }
  function load(){
    status('☁️ Đang kết nối ngân hàng câu hỏi…',false);
    return fetch(API,{cache:'no-store'})
      .then(function(r){if(!r.ok)throw new Error('Google Sheets HTTP '+r.status);return r.text();})
      .then(function(text){var list=parse(text);if(!list.length)throw new Error('BO_CAU_HOI chưa có câu hỏi hợp lệ');questions.splice(0,questions.length);Array.prototype.push.apply(questions,list);window.QuestionBank.ready=true;window.QuestionBank.count=list.length;status('☁️ Ngân hàng Google: '+list.length+' câu',true);return list;})
      .catch(function(err){window.QuestionBank.error=err;status('⚠️ Không tải được Google Sheets — đang dùng dữ liệu dự phòng',false);return questions;});
  }
  window.QuestionBank.load=load;
  /* Không cho bấm Bắt đầu trước khi ngân hàng online tải xong. */
  document.addEventListener('click',function(e){
    var b=e.target.closest&&e.target.closest('[data-action="start"]');
    if(b&&!window.QuestionBank.ready){e.preventDefault();e.stopImmediatePropagation();status('⏳ Đang tải ngân hàng câu hỏi, vui lòng chờ…',false);load();}
  },true);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',load);else load();
})();
