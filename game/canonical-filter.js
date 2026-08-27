/* TRIỆU PHÚ HỌC ĐƯỜNG — CANONICAL FILTER 1.0
   Nguồn dữ liệu: window.GAME_QUESTIONS
   Khóa bất biến: subjectKey + topicCode từ ID.
   Tên hiển thị: Chuong của chính nhóm Môn + Cxx.
*/
(function(){
'use strict';
if(window.__LH_CANONICAL_FILTER_10__) return;
window.__LH_CANONICAL_FILTER_10__ = true;

function text(v){ return String(v==null?'':v).replace(/^\uFEFF/,'').trim().replace(/\s+/g,' '); }
function norm(v){
  return text(v).normalize('NFD')
    .replace(/[\u0300-\u036f]/g,'')
    .replace(/Đ/g,'D').replace(/đ/g,'d')
    .replace(/[\s_\-&/.:]+/g,'').toUpperCase();
}
function subjectKey(mon,id){
  var s=norm(mon), r=text(id).toUpperCase();
  if(/^(TOAN|MATH|MATHEMATICS)$/.test(s) || /(^|[-_])TOAN([_-]|$)/.test(r) || r.indexOf('MATH')>=0) return 'math';
  if(/^(TV|TIENGVIET|VIETNAMESE)$/.test(s) || /(^|[-_])TV([_-]|$)/.test(r) || r.indexOf('TIENGVIET')>=0) return 'vietnamese';
  if(/^(KH|KHOAHOC|KHOAHOC5|SCIENCE|NATURALSCIENCE)$/.test(s) || /(^|[-_])KH([_-]|$)/.test(r) || r.indexOf('KHOAHOC')>=0 || r.indexOf('KHOA_HOC')>=0) return 'science';
  if(/^(LSDL|LSDIALI|LSDIALI5|LICHSUDIALI|LICHSUVADIALI|HISTORY|HISTORYGEOGRAPHY|HISTORYANDGEOGRAPHY)$/.test(s) || /(^|[-_])LS[_-]?DL([_-]|$)/.test(r) || r.indexOf('LSDIALI')>=0 || r.indexOf('LICHSUDIALI')>=0) return 'history';
  return s.toLowerCase();
}
function topicCode(id,chapter){
  var r=text(id).toUpperCase(), m=r.match(/(?:^|[-_])C(\d{1,2})(?:[-_]|$)/);
  if(m) return 'C'+String(Number(m[1])).padStart(2,'0');
  var c=norm(chapter).match(/CHUDE(\d{1,2})/);
  return c?'C'+String(Number(c[1])).padStart(2,'0'):'';
}
function topicNumber(code){ return code ? Number(code.slice(1)) : 0; }
function topicDisplay(q,code){
  var raw=text(q && (q.Chuong || q.topicName || q.topic || q.chapter || ''));
  if(raw && topicCode(q.id,raw)===code) return raw;
  return code ? 'Chủ đề '+topicNumber(code) : 'Chủ đề chưa xác định';
}
function canonicalize(){
  var qs=Array.isArray(window.GAME_QUESTIONS)?window.GAME_QUESTIONS:[];
  if(!qs.length) return;
  var names={};
  qs.forEach(function(q){
    if(!q) return;
    var id=q.id || q.ID || '';
    var sk=subjectKey(q.Mon || q.mon || q.subject || '',id);
    var code=topicCode(id,q.Chuong || q.topic || q.chapter || q.topicName || '');
    var key=sk+'|'+code;
    if(code && !names[key]) names[key]=topicDisplay(q,code);
  });
  qs.forEach(function(q){
    if(!q) return;
    var id=q.id || q.ID || '';
    var sk=subjectKey(q.Mon || q.mon || q.subject || '',id);
    var code=topicCode(id,q.Chuong || q.topic || q.chapter || q.topicName || '');
    q.subject=sk;
    q.subjectKey=sk;
    q.topicCode=code;
    q.topicKey=sk+'|'+code;
    q.chapter=code ? (names[sk+'|'+code] || ('Chủ đề '+topicNumber(code))) : text(q.Chuong || q.chapter || '');
    q.Chuong=q.chapter;
    q.topic=q.chapter;
    q.topicName=q.chapter;
  });
}
function renderSelect(){
  var sel=document.getElementById('chapter'), sub=document.getElementById('subject'), mode=document.getElementById('gameMode');
  if(!sel || !sub) return;
  if(mode && mode.value==='mixed'){
    sel.innerHTML='<option value="">🌐 Tổng hợp 4 môn — không chia chương</option>';
    sel.disabled=true; return;
  }
  var target=subjectKey(sub.value,''), qs=Array.isArray(window.GAME_QUESTIONS)?window.GAME_QUESTIONS:[], map={};
  qs.forEach(function(q){
    if(!q || q.subject!==target || !q.topicCode) return;
    if(!map[q.topicCode]) map[q.topicCode]={name:q.chapter,count:0};
    map[q.topicCode].count++;
  });
  var keys=Object.keys(map).sort(function(a,b){ return Number(a.slice(1))-Number(b.slice(1)); });
  var old=sel.value, sig=target+'|'+keys.map(function(k){return k+'='+map[k].name+'#'+map[k].count;}).join('|');
  if(sel.dataset.lhCanonical===sig && sel.options.length) return;
  sel.dataset.lhCanonical=sig;
  sel.innerHTML='';
  if(!keys.length){
    sel.disabled=true;
    sel.innerHTML='<option value="">⚠️ Môn này chưa có chủ đề</option>';
    return;
  }
  var first=document.createElement('option'); first.value=''; first.textContent='📚 Chọn chủ đề / chương'; sel.appendChild(first);
  keys.forEach(function(code){
    var o=document.createElement('option');
    o.value=map[code].name;
    o.textContent='📘 '+map[code].name+' ('+map[code].count+' câu)';
    o.dataset.topicCode=code;
    o.dataset.topicCount=String(map[code].count);
    sel.appendChild(o);
  });
  sel.disabled=false;
  if(old && Array.prototype.some.call(sel.options,function(o){return o.value===old})) sel.value=old;
}
function run(){ canonicalize(); renderSelect(); }
window.LHCanonicalFilter={run:run,canonicalize:canonicalize,renderSelect:renderSelect,subjectKey:subjectKey,topicCode:topicCode};
window.addEventListener('questionBankReady',function(){ setTimeout(run,0); });
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',function(){setTimeout(run,0);},{once:true});
else setTimeout(run,0);
})();
