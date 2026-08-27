/* TRIỆU PHÚ HỌC ĐƯỜNG — SEMESTER FILTER FIX 2.0
   Nhận diện Học kỳ từ dữ liệu HocKy thực tế với nhiều cách ghi tiếng Việt.
   Không sửa dữ liệu Google Sheets.
*/
(function(){'use strict';
if(window.__LH_GAME_SEMESTER_FIX_20__)return;
window.__LH_GAME_SEMESTER_FIX_20__=true;

var MASTER=[];
var SELECTED='HKI';

function text(v){return String(v==null?'':v).trim().replace(/\s+/g,' ')}
function norm(v){return text(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/Đ/g,'D').replace(/đ/g,'d').replace(/[\s_\-&/.]+/g,'').toUpperCase()}
function semester(v){
 var raw=text(v),s=norm(raw);
 if(!s)return'';
 // Ưu tiên II/2 trước I/1 để tránh chuỗi HKII bị nhận nhầm là HKI.
 if(/(?:HKII|HCKII|HOCIKYII|HOCKYII|HOCYII|HOCKIII|HOCIII|HOCIKY2|HOCKY2|HOCY2|KI2|KY2|SEMESTERII|SEMESTER2|SECONDSEMESTER|HOC[IY]2)$/.test(s))return'HKII';
 if(/(?:HK2|^2$|(?:^|[^0-9])2$)/.test(s))return'HKII';
 if(/(?:HKI|HCKI|HOCIKYI|HOCKYI|HOCYI|HOCKI|HOCI|HOCIKY1|HOCKY1|HOCY1|KI1|KY1|SEMESTERI|SEMESTER1|FIRSTSEMESTER)$/.test(s))return'HKI';
 if(/(?:HK1|^1$|(?:^|[^0-9])1$)/.test(s))return'HKI';
 // Dạng chữ đầy đủ có thể còn số/La Mã ở cuối.
 if(/(?:HOC.*(?:II|2)|KY.*(?:II|2)|KI.*(?:II|2)|SEMESTER.*(?:II|2))$/.test(s))return'HKII';
 if(/(?:HOC.*(?:I|1)|KY.*(?:I|1)|KI.*(?:I|1)|SEMESTER.*(?:I|1))$/.test(s))return'HKI';
 // Một số hệ thống ghi trực tiếp "HỌC KÌ 2", "HỌC KỲ II", "2".
 if(/II$/.test(s)&&/(HK|HOC|KI|KY|SEMESTER)/.test(s))return'HKII';
 if(/I$/.test(s)&&/(HK|HOC|KI|KY|SEMESTER)/.test(s))return'HKI';
 return'';
}
function qSemester(q){
 if(!q)return'';
 var candidates=[q.semester,q.semesterKey,q.semesterRaw,q.HocKy,q.hocKy,q.HOCKY,q.schoolTerm,q.term,q.period];
 for(var i=0;i<candidates.length;i++){var k=semester(candidates[i]);if(k)return k;}
 return'';
}
function allQuestions(){var q=Array.isArray(window.GAME_QUESTIONS)?window.GAME_QUESTIONS:[];if(q.length&&!MASTER.length)MASTER=q.slice();return MASTER.length?MASTER:q;}
function count(period){var all=allQuestions();return period==='ALL'?all.length:all.filter(function(q){return qSemester(q)===period}).length;}
function apply(){
 var all=allQuestions(),global=window.GAME_QUESTIONS;
 if(!Array.isArray(global)||!all.length)return 0;
 var filtered=SELECTED==='ALL'?all.slice():all.filter(function(q){return qSemester(q)===SELECTED});
 global.splice(0,global.length);Array.prototype.push.apply(global,filtered);
 if(typeof window.refreshChapterFilter==='function')window.refreshChapterFilter();
 if(typeof window.initQuestionFilters==='function')window.initQuestionFilters();
 var status=document.getElementById('questionBankStatus');
 if(status){status.textContent='☁️ Ngân hàng Google: '+all.length+' câu • '+(SELECTED==='HKI'?'HKI':SELECTED==='HKII'?'HKII':'Cả năm')+': '+filtered.length+' câu';}
 return filtered.length;
}
function ensureSelector(){
 var home=document.getElementById('home'),mode=document.getElementById('gameMode');if(!home||!mode)return null;
 var old=document.getElementById('semester');if(old)return old;
 var label=document.createElement('label');label.id='semesterLabel';label.textContent='Học kỳ';
 var sel=document.createElement('select');sel.id='semester';sel.setAttribute('aria-label','Chọn học kỳ');
 [['HKI','📘 Học kỳ I'],['HKII','📗 Học kỳ II'],['ALL','🌐 Cả năm']].forEach(function(x){var o=document.createElement('option');o.value=x[0];o.textContent=x[1];sel.appendChild(o)});
 sel.value=SELECTED;label.appendChild(sel);
 var config=mode.parentElement;
 if(config&&mode.parentNode===config)config.insertBefore(label,mode);else home.appendChild(label);
 sel.addEventListener('change',function(){SELECTED=sel.value;window.LHGameSemester.SELECTED=SELECTED;apply();});
 return sel;
}
function boot(){
 ensureSelector();
 var tries=0;
 function tick(){var q=Array.isArray(window.GAME_QUESTIONS)?window.GAME_QUESTIONS:[];if(q.length){if(!MASTER.length)MASTER=q.slice();apply();return;}if(++tries<60)setTimeout(tick,300)}
 window.addEventListener('questionBankReady',function(){MASTER=(window.GAME_QUESTIONS||[]).slice();setTimeout(function(){ensureSelector();apply();},0)});
 tick();
}
window.LHGameSemester={SELECTED:SELECTED,getSelected:function(){return SELECTED},getAll:function(){return MASTER.slice()},normalize:semester,getQuestionSemester:qSemester,apply:apply,debug:function(){var all=allQuestions(),out={HKI:0,HKII:0,UNKNOWN:0};all.forEach(function(q){var s=qSemester(q);if(s==='HKI')out.HKI++;else if(s==='HKII')out.HKII++;else out.UNKNOWN++;});return out;}};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
