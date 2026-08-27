/* TRIỆU PHÚ HỌC ĐƯỜNG — SEMESTER FILTER FIX 1.0
   - Nhận diện HKI/HKII nhiều cách ghi.
   - Thêm bộ lọc Học kỳ: HKI / HKII / Cả năm.
   - Không sửa dữ liệu Google Sheets.
   - Giữ nguyên luồng chơi hiện tại; mặc định HKI để tương thích.
*/
(function(){'use strict';
if(window.__LH_GAME_SEMESTER_FIX_10__)return;
window.__LH_GAME_SEMESTER_FIX_10__=true;

var MASTER=[];
var SELECTED='HKI';
var PERIODS=['HKI','HKII','ALL'];

function text(v){return String(v==null?'':v).trim().replace(/\s+/g,' ')}
function norm(v){return text(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/Đ/g,'D').replace(/đ/g,'d').replace(/[\s_\-&/.]+/g,'').toUpperCase()}
function semester(v){
 var s=norm(v);
 if(!s)return'';
 if(['HKI','HK1','HOCIKY1','HOCKY1','HOCY1','KI1','KY1','1','FIRSTSEMESTER','SEMESTER1'].indexOf(s)>=0)return'HKI';
 if(['HKII','HK2','HOCIKY2','HOCKY2','HOCY2','KI2','KY2','2','SECONDSEMESTER','SEMESTER2'].indexOf(s)>=0)return'HKII';
 if(s.indexOf('HKII')>=0||s.indexOf('HOCKYII')>=0||s.indexOf('HOCIKYII')>=0)return'HKII';
 if(s.indexOf('HKI')>=0||s.indexOf('HOCKYI')>=0||s.indexOf('HOCIKYI')>=0)return'HKI';
 return'';
}
function qSemester(q){return semester(q&&((q.semester!=null&&q.semester!=='')?q.semester:(q.HocKy!=null?q.HocKy:(q.hocKy!=null?q.hocKy:(q.schoolTerm!=null?q.schoolTerm:'')))))}
function allQuestions(){
 var q=Array.isArray(window.GAME_QUESTIONS)?window.GAME_QUESTIONS:[];
 if(q.length&&!MASTER.length)MASTER=q.slice();
 if(!q.length&&MASTER.length){window.GAME_QUESTIONS.push.apply(window.GAME_QUESTIONS,MASTER);q=window.GAME_QUESTIONS}
 return q;
}
function setQuestions(period){
 var global=window.GAME_QUESTIONS;
 if(!Array.isArray(global))return 0;
 if(!MASTER.length)MASTER=global.slice();
 var filtered=period==='ALL'?MASTER.slice():MASTER.filter(function(q){return qSemester(q)===period});
 global.splice(0,global.length);
 Array.prototype.push.apply(global,filtered);
 return filtered.length;
}
function ensureSelector(){
 var home=document.getElementById('home');if(!home)return null;
 var mode=document.getElementById('gameMode');if(!mode)return null;
 var existing=document.getElementById('semester');if(existing)return existing;
 var label=document.createElement('label');label.id='semesterLabel';label.textContent='Học kỳ';
 var sel=document.createElement('select');sel.id='semester';sel.setAttribute('aria-label','Chọn học kỳ');
 [['HKI','📘 Học kỳ I'],['HKII','📗 Học kỳ II'],['ALL','🌐 Cả năm']].forEach(function(x){var o=document.createElement('option');o.value=x[0];o.textContent=x[1];sel.appendChild(o)});
 sel.value=SELECTED;label.appendChild(sel);
 var config=mode.parentElement;
 if(config&&mode.parentNode===config){config.insertBefore(label,mode)}
 else home.insertBefore(label,home.querySelector('.config')||home.firstChild);
 sel.addEventListener('change',function(){SELECTED=sel.value;apply();});
 return sel;
}
function apply(){
 var sel=ensureSelector();if(sel)sel.value=SELECTED;
 allQuestions();
 var count=setQuestions(SELECTED);
 if(typeof window.refreshChapterFilter==='function')window.refreshChapterFilter();
 if(typeof window.initQuestionFilters==='function')window.initQuestionFilters();
 var mode=document.getElementById('gameMode');
 var status=document.getElementById('questionBankStatus');
 if(status&&MASTER.length){var label=SELECTED==='HKI'?'HKI':SELECTED==='HKII'?'HKII':'Cả năm';status.textContent='☁️ Ngân hàng Google: '+MASTER.length+' câu • '+label+': '+count+' câu';}
 return count;
}
function boot(){
 ensureSelector();
 var tries=0;
 function tick(){
  var q=Array.isArray(window.GAME_QUESTIONS)?window.GAME_QUESTIONS:[];
  if(q.length){if(!MASTER.length)MASTER=q.slice();apply();return;}
  if(++tries<40)setTimeout(tick,300);
 }
 window.addEventListener('questionBankReady',function(){setTimeout(function(){if(!MASTER.length)MASTER=(window.GAME_QUESTIONS||[]).slice();apply();},0)});
 window.addEventListener('questionBankReady',function(){ensureSelector()});
 tick();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
window.LHGameSemester={getSelected:function(){return SELECTED},getAll:function(){return MASTER.slice()},normalize:semester,apply:apply};
})();
