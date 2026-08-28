/* TRIỆU PHÚ HỌC ĐƯỜNG — TOPIC AUTHORITY FIX 1.0
   Quy tắc: trường Chương/Chủ đề là nguồn sự thật.
   Cxx trong ID chỉ là fallback khi trường Chương không có số chủ đề.
*/
(function(){
  'use strict';
  if(window.__LH_TOPIC_AUTHORITY_10__) return;
  window.__LH_TOPIC_AUTHORITY_10__=true;

  function txt(v){return String(v==null?'':v).replace(/^\uFEFF/,'').trim().replace(/\s+/g,' ')}
  function norm(v){return txt(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/Đ/g,'D').replace(/đ/g,'d').replace(/[\s_\-&/.:-]+/g,'').toUpperCase()}
  function codeFrom(v){
    var s=txt(v);
    var m=s.match(/(?:Chủ đề|Chủ điểm|Chương|ChuDe|Chuong|ChuDiem)\s*\.?\s*(\d{1,2})/i);
    if(m) return 'C'+String(Number(m[1])).padStart(2,'0');
    var n=norm(s);
    m=n.match(/(?:CHUDE|CHUONG|CHUDIEM)(\d{1,2})/);
    if(m) return 'C'+String(Number(m[1])).padStart(2,'0');
    return '';
  }
  function idCode(id){
    var s=txt(id).toUpperCase(),m=s.match(/(?:^|[-_])C[_-]?(\d{1,2})(?:[-_]|$)/);
    if(m)return 'C'+String(Number(m[1])).padStart(2,'0');
    var n=norm(id),m2=n.match(/C(\d{1,2})(?:B\d|Q\d|$)/);
    return m2?'C'+String(Number(m2[1])).padStart(2,'0'):'';
  }
  function subject(v){
    var s=norm(v);
    if(/^(TOAN|MATH|MATHEMATICS|MATHEMATICS5)$/.test(s))return 'math';
    if(/^(TV|TIENGVIET|VIETNAMESE|VIETNAMESE5)$/.test(s))return 'vietnamese';
    if(/^(KH|KHOAHOC|KHOAHOC5|SCIENCE|NATURALSCIENCE|NATURALSCIENCE5)$/.test(s))return 'science';
    if(/^(LSDL|LSDIALI|LSDL5|LSDIALI5|LICHSUDIALI|LICHSUVADIALI|HISTORY|HISTORYGEOGRAPHY|HISTORYANDGEOGRAPHY)$/.test(s))return 'history';
    return '';
  }
  function fix(list){
    var mismatch=0;
    (list||[]).forEach(function(q){
      var chapter=txt(q.chapter||q.Chuong||q.topic||q.topicName);
      var authoritative=codeFrom(chapter);
      var fallback=idCode(q.id||'');
      var tc=authoritative||fallback||txt(q.topicCode);
      if(authoritative && fallback && authoritative!==fallback)mismatch++;
      if(!tc)return;
      var sk=subject(q.subject||q.Mon||q.subjectKey||'')||q.subjectKey||'';
      q.topicCode=tc;
      if(sk)q.topicKey=sk+'|'+tc;
      q._topicAuthority=authoritative?'CHUONG':'ID_FALLBACK';
      if(authoritative)q._topicIdMismatch=(fallback && fallback!==authoritative);
    });
    return mismatch;
  }
  function run(){
    var all=Array.isArray(window.LH_ALL_GAME_QUESTIONS)?window.LH_ALL_GAME_QUESTIONS:[];
    if(!all.length)return false;
    var mismatch=fix(all);
    window.LH_TOPIC_AUTHORITY_STATS={total:all.length,idChapterMismatch:mismatch};
    try{window.dispatchEvent(new CustomEvent('topicAuthorityReady',{detail:window.LH_TOPIC_AUTHORITY_STATS}))}catch(e){}
    return true;
  }
  if(window.LH_ALL_GAME_QUESTIONS&&window.LH_ALL_GAME_QUESTIONS.length)run();
  window.addEventListener('questionBankReady',function(){setTimeout(run,0)});
  window.LHTopicAuthority={run,fix,stats:function(){return window.LH_TOPIC_AUTHORITY_STATS||{total:0,idChapterMismatch:0}}};
})();
