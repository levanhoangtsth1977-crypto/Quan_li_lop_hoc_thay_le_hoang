/* LUCKY WHEEL FINAL — độc lập hoàn toàn
 * Tự lấy học sinh từ Apps Script; tự quay thật; tự phát nhạc.
 */
(function(){'use strict';
if(window.__LH_LUCKY_WHEEL_FINAL_V2__)return;window.__LH_LUCKY_WHEEL_FINAL_V2__=true;
const API='https://script.google.com/macros/s/AKfycbxTPwf-jhrR8JOoKY5ZLuzlsDgcv3nWILtDPTrYNWZCEPpm2rkpXTn-sPAdFaUyy0z_uw/exec';
let audioCtx=null, musicTimer=null, called=[], spinning=false, studentsCache=[];
const $=s=>document.querySelector(s), clean=v=>String(v??'').trim().replace(/\s+/g,' ');
async function loadStudents(){
 try{const r=await fetch(API+'?action=get_students',{cache:'no-store'});const j=await r.json();studentsCache=(j.students||[]).filter(s=>s&&s.id&&clean(s.name)).map(s=>({id:String(s.id),name:clean(s.name),group:clean(s.to||s.tTo||s.group||s.nhom||s.team||'')}));return studentsCache;}catch(e){console.error('LuckyWheel get_students',e);return []}
}
function pool(){const scope=$('#lhWheelScope')?.value||'all';const list=studentsCache.slice();if(!/^to[1-4]$/.test(scope))return list;const n=scope.slice(2);const f=list.filter(s=>{const g=s.group.toLowerCase().replace('tổ','').replace('to','').trim();return g===n});return f.length?f:list}
function audio(){try{const C=window.AudioContext||window.webkitAudioContext;if(!C)return null;audioCtx=audioCtx||new C();if(audioCtx.state==='suspended')audioCtx.resume();return audioCtx}catch(e){return null}}
function tone(f,d=.12,v=.02,at=0){const c=audio();if(!c)return;try{const o=c.createOscillator(),g=c.createGain(),t=c.currentTime+at;o.type='triangle';o.frequency.setValueAtTime(f,t);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(v,t+.01);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g);g.connect(c.destination);o.start(t);o.stop(t+d+.03)}catch(e){}}
function startMusic(){audio();stopMusic();const notes=[523.25,659.25,783.99,659.25,587.33,698.46,880,698.46];let i=0;const tick=()=>{if(!musicTimer)return;tone(notes[i++%notes.length],.16,.025);};musicTimer=setInterval(tick,190);tick()}
function stopMusic(){if(musicTimer){clearInterval(musicTimer);musicTimer=null}}
function renderCalled(total){const box=$('#lhWheelCalled'),count=$('#lhWheelCount');if(count)count.textContent=`Đã gọi ${called.length}/${total} học sinh`;if(!box)return;box.innerHTML=called.map((id,i)=>{const s=studentsCache.find(x=>x.id===id);return s?`<div class="lh-wheel-called-item"><span>${i+1}</span><b>${s.name.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</b></div>`:''}).join('')||'<div class="lh-wheel-empty">Chưa gọi học sinh nào.</div>'}
function setName(t){const n=$('#lhWheelName');if(n)n.textContent=t}
async function spin(){
 if(spinning)return;
 const list=await loadStudents();if(!list.length){alert('Chưa lấy được danh sách học sinh từ hệ thống.');return}
 let p=pool();if(!p.length){alert('Phạm vi hiện không có học sinh.');return}
 let avail=p.filter(s=>!called.includes(s.id));if(!avail.length){called=[];avail=p.slice();}
 const winner=avail[Math.floor(Math.random()*avail.length)];called.push(winner.id);spinning=true;
 const btn=$('#lhWheelSpin'),wheel=$('#page-lucky-wheel .lh-wheel-circle'),sub=$('#lhWheelSub');if(btn)btn.disabled=true;if(sub)sub.textContent='🎡 Đang quay...';
 if(wheel){wheel.style.animation='none';wheel.style.webkitAnimation='none';wheel.style.transition='none';const current=Number(wheel.dataset.rot||0);const target=current+(7+Math.floor(Math.random()*3))*360+Math.floor(Math.random()*360);wheel.dataset.rot=target;requestAnimationFrame(()=>{wheel.style.transition='transform 4.5s cubic-bezier(.12,.72,.16,1)';wheel.style.transform=`rotate(${target}deg)`})}
 startMusic();let k=0;const fake=setInterval(()=>{setName(p[Math.floor(Math.random()*p.length)].name);if(++k>24)clearInterval(fake)},150);
 setTimeout(()=>{clearInterval(fake);stopMusic();setName(winner.name);if(sub)sub.textContent='🎉 Chúc mừng!';renderCalled(list.length);tone(1046,.18,.05);tone(1319,.25,.04,.12);tone(1568,.3,.03,.25);spinning=false;if(btn)btn.disabled=false},4550)
}
function reset(){if(spinning)return;called=[];const w=$('#page-lucky-wheel .lh-wheel-circle');if(w){w.style.transition='transform .35s ease';w.style.transform='rotate(0deg)';w.dataset.rot='0'}setName('SẴN SÀNG');const s=$('#lhWheelSub');if(s)s.textContent='Nhấn “QUAY NGAY” để chọn học sinh';renderCalled(studentsCache.length)}
function bind(){
 const sec=$('#page-lucky-wheel');if(!sec)return false;
 const scope=$('#lhWheelScope');if(scope&&!scope.dataset.final2){scope.dataset.final2='1';scope.addEventListener('change',reset)}
 const resetBtn=$('#lhWheelReset');if(resetBtn&&!resetBtn.dataset.final2){resetBtn.dataset.final2='1';resetBtn.addEventListener('click',reset)}
 renderCalled(studentsCache.length);return true;
}
function captureClick(e){const b=e.target.closest&&e.target.closest('#lhWheelSpin');if(!b)return;e.preventDefault();e.stopImmediatePropagation();audio();spin()}
function start(){document.addEventListener('click',captureClick,true);bind();new MutationObserver(bind).observe(document.body,{childList:true,subtree:true})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
