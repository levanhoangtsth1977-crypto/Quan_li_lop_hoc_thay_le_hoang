/* TRIỆU PHÚ HỌC ĐƯỜNG — TOPIC ROUTER 3.0
   Mục tiêu:
   - Phân loại MÔN trước, rồi mới lấy CHỦ ĐỀ/CHƯƠNG của đúng môn đó.
   - Khóa nội bộ của chủ đề = MÔN + Cxx lấy từ ID.
   - Tên hiển thị = cột Chuong của chính câu hỏi thuộc môn đó.
   - Không cho chủ đề của môn này lọt sang môn khác.
   - Thứ tự chủ đề luôn theo C01, C02, C03...; không theo thứ tự chuỗi.
*/
(function(){
'use strict';
if(window.__LH_TOPIC_ROUTER_30__)return;
window.__LH_TOPIC_ROUTER_30__=true;

function text(v){
  return String(v==null?'':v)
    .replace(/^\uFEFF/,'')
    .trim()
    .replace(/\s+/g,' ');
}
function norm(v){
  return text(v)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g,'')
    .replace(/Đ/g,'D').replace(/đ/g,'d')
    .replace(/[\s_\-&/.:]+/g,'')
    .toUpperCase();
}

/* Chỉ dùng các mã môn chuẩn của hệ thống; ID chỉ là fallback. */
function subject(mon,id){
  var s=norm(mon);
  var r=text(id).toUpperCase();

  if(['TOAN','MATH','MATHEMATICS'].indexOf(s)>=0)return 'math';
  if(['TV','TIENGVIET','VIETNAMESE'].indexOf(s)>=0)return 'vietnamese';
  if(['KH','KHOAHOC','KHOAHOC5','SCIENCE','NATURALSCIENCE'].indexOf(s)>=0)return 'science';
  if(['LSDL','LSDIALI','LSDL5','LSDIALI5','LICHSUDIALI','LICHSUVADIALI','HISTORY','HISTORYGEOGRAPHY','HISTORYANDGEOGRAPHY'].indexOf(s)>=0)return 'history';

  if(/(^|[-_])TOAN([_-]|$)/.test(r)||r.indexOf('TOAN-')>=0)return 'math';
  if(/(^|[-_])TV([_-]|$)/.test(r)||r.indexOf('TIENGVIET')>=0)return 'vietnamese';
  if(/(^|[-_])KH([_-]|$)/.test(r)||r.indexOf('KHOA_HOC')>=0||r.indexOf('KHOA-HOC')>=0||r.indexOf('KHOAHOC')>=0)return 'science';
  if(/(^|[-_])LS[_-]?DL([_-]|$)/.test(r)||r.indexOf('LSDIALI')>=0||r.indexOf('LICHSUDIALI')>=0)return 'history';
  return '';
}

function topicCode(id,topic){
  var r=text(id).toUpperCase();
  var m=r.match(/(?:^|[-_])C(\d{1,2})(?:[-_]|$)/);
  if(m)return 'C'+String(Number(m[1])).padStart(2,'0');

  var t=text(topic).normalize('NFC').match(/(?:^|\s)Ch(?:u|ủ)\s*đề\s*([0-9]{1,2})(?:\b|\.)/i);
  return t?'C'+String(Number(t[1])).padStart(2,'0'):'';
}

function topicName(q,code){
  var candidates=[q&&q.Chuong,q&&q.topicName,q&&q.topic,q&&q.chapter,q&&q.ChuDe,q&&q.chude];
  for(var i=0;i<candidates.length;i++){
    var v=text(candidates[i]);
    if(v && !/^C\d{2}$/.test(v))return v;
  }
  return code?'Chủ đề '+Number(code.slice(1)):'';
}

function render(){
  var sel=document.getElementById('chapter');
  var subSel=document.getElementById('subject');
  var mode=document.getElementById('gameMode');
  if(!sel||!subSel)return;

  if(mode&&mode.value==='mixed'){
    sel.innerHTML='<option value="">🌐 Tổng hợp 4 môn — không chia chủ đề</option>';
    sel.disabled=true;
    return;
  }

  var qs=Array.isArray(window.GAME_QUESTIONS)?window.GAME_QUESTIONS:[];
  if(!qs.length){
    sel.innerHTML='<option value="">⏳ Đang tải chủ đề...</option>';
    sel.disabled=true;
    return;
  }

  var target=subject(subSel.value,'');
  var map={};

  /* Quan trọng: MÔN là khóa lọc đầu tiên. */
  qs.forEach(function(q){
    if(!q)return;
    var sid=q.id||q.ID||'';
    var qSubject=subject(q.Mon!=null?q.Mon:(q.mon!=null?q.mon:q.subject),sid);
    if(!qSubject || qSubject!==target)return;

    var sourceTopic=q.Chuong!=null?q.Chuong:(q.chapter!=null?q.chapter:(q.topic!=null?q.topic:q.topicName));
    var code=topicCode(sid,sourceTopic);
    if(!code)return;

    var name=topicName(q,code);
    if(!name)return;

    if(!map[code])map[code]={name:name,count:0};
    map[code].count++;
    /* Nếu dữ liệu có nhiều cách ghi tên, ưu tiên tên đầy đủ nhất. */
    if(name.length>map[code].name.length)map[code].name=name;
  });

  var keys=Object.keys(map).sort(function(a,b){
    return Number(a.slice(1))-Number(b.slice(1));
  });

  var old=String(sel.value||'');
  var sig=target+'|'+keys.map(function(k){
    return k+'='+map[k].name+'#'+map[k].count;
  }).join('|');

  if(sel.dataset.lh30===sig&&sel.options.length)return;
  sel.dataset.lh30=sig;
  sel.innerHTML='';

  if(!keys.length){
    sel.disabled=true;
    sel.innerHTML='<option value="">⚠️ Chưa có chủ đề cho môn này</option>';
    return;
  }

  var first=document.createElement('option');
  first.value='';
  first.textContent='📚 Chọn chủ đề / chương';
  sel.appendChild(first);

  keys.forEach(function(code){
    var o=document.createElement('option');
    o.value=map[code].name;
    o.textContent='📘 '+map[code].name+' ('+map[code].count+' câu)';
    o.dataset.topicCode=code;
    o.dataset.questionCount=String(map[code].count);
    o.dataset.subject=target;
    sel.appendChild(o);
  });

  sel.disabled=false;
  if(old&&Array.prototype.some.call(sel.options,function(o){return o.value===old}))sel.value=old;
}

window.LHTopicRouter={
  render:render,
  subject:subject,
  topicCode:topicCode,
  refresh:render
};

function hook(){
  var s=document.getElementById('subject');
  var m=document.getElementById('gameMode');
  if(s)s.addEventListener('change',render);
  if(m)m.addEventListener('change',render);
  window.addEventListener('questionBankReady',function(){setTimeout(render,0);});
  render();
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',hook,{once:true});
else hook();
})();
