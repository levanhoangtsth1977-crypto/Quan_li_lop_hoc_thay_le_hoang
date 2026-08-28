/* TRIỆU PHÚ HỌC ĐƯỜNG — AUTHORITATIVE CURRICULUM/POOL FINAL 2.0 */
(function(){'use strict';
if(window.__LH_CURRICULUM_AUTHORITATIVE_20__)return;
window.__LH_CURRICULUM_AUTHORITATIVE_20__=true;

const SUBJECT_ALIASES={
  math:['math','toan','toán','mATH','mathematics'],
  vietnamese:['vietnamese','tv','tiengviet','tiếng việt'],
  science:['science','kh','khoahoc','khoa hoc','khoa học'],
  history:['history','ls-dl','lSDL','lsdl','lsdiaLi','lsđịa lí','lichsudiali','lịch sử và địa lí','historygeography']
};
const CATALOG={
  math:[
    ['C01','Chủ đề 1. Ôn tập và bổ sung'],['C02','Chủ đề 2. Số thập phân'],['C03','Chủ đề 3. Một số đơn vị đo diện tích'],['C04','Chủ đề 4. Các phép tính với số thập phân'],['C05','Chủ đề 5. Một số hình phẳng. Chu vi và diện tích'],['C06','Chủ đề 6. Ôn tập học kì 1'],['C07','Chủ đề 7. Tỉ số và các bài toán liên quan'],['C08','Chủ đề 8. Thể tích. Đơn vị đo thể tích'],['C09','Chủ đề 9. Diện tích và thể tích của một số hình khối'],['C10','Chủ đề 10. Số đo thời gian, vận tốc. Các bài toán liên quan đến chuyển động đều'],['C11','Chủ đề 11. Một số yếu tố thống kê và xác suất'],['C12','Chủ đề 12. Ôn tập cuối năm']
  ],
  vietnamese:[
    ['C01','Chủ điểm 1. Thế giới tuổi thơ'],['C02','Chủ điểm 2. Thiên nhiên kì thú'],['C03','Chủ điểm 3. Trên con đường học tập'],['C04','Chủ điểm 4. Nghệ thuật muôn màu'],['C05','Chủ điểm 5. Vẻ đẹp cuộc sống'],['C06','Chủ điểm 6. Hương sắc trăm miền'],['C07','Chủ điểm 7. Tiếp bước cha ông'],['C08','Chủ điểm 8. Thế giới của chúng ta']
  ],
  science:[
    ['C01','Chủ đề 1. Chất'],['C02','Chủ đề 2. Năng lượng'],['C03','Chủ đề 3. Thực vật và động vật'],['C04','Chủ đề 4. Vi khuẩn'],['C05','Chủ đề 5. Con người và sức khoẻ'],['C06','Chủ đề 6. Sinh vật và môi trường']
  ]
};
function text(v){return String(v==null?'':v).replace(/^\uFEFF/,'').trim().replace(/\s+/g,' ')}
function norm(v){return text(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/Đ/g,'D').replace(/đ/g,'d').replace(/[\s_\-&/.:]+/g,'').toUpperCase()}
function subject(v,id){
  const m=norm(v),r=String(id||'').toUpperCase();
  if(['TOAN','MATH','MATHEMATICS'].includes(m)||/(^|[-_])(?:TOAN|MATH)(?:[-_]|$)/.test(r))return'math';
  if(['TV','TIENGVIET','VIETNAMESE'].includes(m)||/(^|[-_])(?:TV|TIENGVIET|VIETNAMESE)(?:[-_]|$)/.test(r))return'vietnamese';
  if(['KH','KHOAHOC','SCIENCE','NATURALSCIENCE'].includes(m)||/(^|[-_])(?:KH|KHOA[_-]?HOC|SCIENCE)(?:[-_]|$)/.test(r))return'science';
  if(['LSDL','LSDIALI','LICHSUDIALI','LICHSUVADIALI','HISTORY','HISTORYGEOGRAPHY'].includes(m)||/(^|[-_])(?:LS[-_]?DL|LSDIALI|LICHSUDIALI|HISTORY)(?:[-_]|$)/.test(r))return'history';
  return'';
}
function topicCode(q){
  const id=text(q&&q.id).toUpperCase();
  let m=id.match(/(?:^|[-_])C[_-]?(\d{1,2})(?:[-_]|$)/);if(m)return'C'+String(Number(m[1])).padStart(2,'0');
  const raw=norm(q&&q.topicCode);if(/^C\d{1,2}$/.test(raw))return'C'+String(Number(raw.slice(1))).padStart(2,'0');
  for(const v of [q&&q.chapter,q&&q.Chuong,q&&q.topic,q&&q.topicName]){
    const n=norm(v),x=n.match(/(?:CHUDE|CHUONG|CHUDIÊM)(\d{1,2})/);if(x)return'C'+String(Number(x[1])).padStart(2,'0');
    const y=text(v).match(/(?:Chủ đề|Chủ điểm|Chương)\s*\.?\s*(\d{1,2})/i);if(y)return'C'+String(Number(y[1])).padStart(2,'0');
  }
  return'';
}
function cleanName(v){return text(v).replace(/\s*\([^)]*\)\s*$/,'').trim().replace(/\s+/g,' ')}
function canonicalName(sk,tc,q){
  const cat=CATALOG[sk];if(Array.isArray(cat)){const found=cat.find(x=>x[0]===tc);if(found)return found[1]}
  return cleanName(q&&q.chapter||q&&q.Chuong||q&&q.topic||q&&q.topicName)||('Chủ đề '+Number(tc.slice(1)));
}
function valid(q){return q&&q.question&&Array.isArray(q.options)&&q.options.length===4&&q.options.every(Boolean)}
function source(){return (Array.isArray(window.LH_ALL_GAME_QUESTIONS)?window.LH_ALL_GAME_QUESTIONS:[]).filter(valid).map(q=>{
  const sk=subject(q.subject||q.Mon,q.id||q.ID);const tc=topicCode(q);if(!sk||!tc)return null;
  q.subject=sk;q.subjectKey=sk;q.topicCode=tc;q.topicKey=sk+'|'+tc;q.chapter=canonicalName(sk,tc,q);q.Chuong=q.chapter;q.topic=q.chapter;q.topicName=q.chapter;q.status='ACTIVE';return q;
}).filter(Boolean)}
function unique(list){const seen=new Set(),out=[];list.forEach(q=>{const id=text(q.id);if(!id||seen.has(id))return;seen.add(id);out.push(q)});return out}
function shuffle(list){for(let i=list.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[list[i],list[j]]=[list[j],list[i]]}return list}
function build(){const src=unique(source()),groups={};src.forEach(q=>{const k=q.subject+'|'+q.topicCode;(groups[k]||(groups[k]=[])).push(q)});const pool=[];const stats={};Object.keys(groups).forEach(k=>{const chosen=shuffle(groups[k].slice()).slice(0,100);stats[k]={available:groups[k].length,selected:chosen.length,ready:chosen.length===100};chosen.forEach(q=>pool.push(q))});window.GAME_QUESTIONS=pool;window.LH_GAME_POOL_STATS=stats;return{src,pool,stats}}
function render(){const s=document.getElementById('subject'),c=document.getElementById('chapter'),m=document.getElementById('gameMode');if(!s||!c)return;
  if(m&&m.value==='mixed'){c.disabled=true;c.innerHTML='<option value="">🌐 Tổng hợp 4 môn</option>';return}
  const sk=subject(s.value,'');const all=Array.isArray(window.LH_GAME_POOL_SOURCE)?window.LH_GAME_POOL_SOURCE:source();const seen={};all.forEach(q=>{if(subject(q.subject||q.Mon,q.id)!==sk)return;const tc=q.topicCode||topicCode(q);if(!tc)return;seen[tc]=canonicalName(sk,tc,q)});
  let list=Array.isArray(CATALOG[sk])?CATALOG[sk].slice():Object.keys(seen).sort((a,b)=>Number(a.slice(1))-Number(b.slice(1))).map(tc=>[tc,seen[tc]]);
  const old=c.value;c.innerHTML='';const first=document.createElement('option');first.value='';first.textContent='📚 Chọn chủ đề / chương';c.appendChild(first);
  list.forEach(([tc,name])=>{const o=document.createElement('option');o.value=name;o.textContent='📘 '+cleanName(name);o.dataset.topicCode=tc;o.dataset.subject=sk;const st=window.LH_GAME_POOL_STATS&&window.LH_GAME_POOL_STATS[sk+'|'+tc];o.dataset.available=st?String(st.available):'0';o.dataset.selected=st?String(st.selected):'0';c.appendChild(o)});
  c.disabled=false;if(old&&Array.from(c.options).some(o=>o.value===old))c.value=old;
}
function apply(){
  const built=build();window.LH_GAME_POOL_SOURCE=built.src;
  render();
  if(typeof window.initQuestionFilters==='function')try{window.initQuestionFilters()}catch(e){}
  window.dispatchEvent(new CustomEvent('lhAuthoritativeCurriculumReady',{detail:{stats:built.stats}}));
  window.dispatchEvent(new CustomEvent('questionBankReady',{detail:{authoritative:true,count:built.src.length}}));
}
function hook(){
  if(window.__LH_AUTHORITATIVE_HOOKED__)return;window.__LH_AUTHORITATIVE_HOOKED__=true;
  const s=document.getElementById('subject'),m=document.getElementById('gameMode');
  if(s)s.addEventListener('change',()=>{render();if(typeof window.initQuestionFilters==='function')try{window.initQuestionFilters()}catch(e){}});
  if(m)m.addEventListener('change',render);
  window.addEventListener('questionBankReady',e=>{if(e.detail&&e.detail.authoritative)return;setTimeout(apply,60)});
  setTimeout(apply,300);
  setTimeout(apply,1200);
  setTimeout(apply,2500);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',hook,{once:true});else hook();
})();
