/* MENU FINAL DIRECT — FINAL UI STABLE */
(function(){
'use strict';
if(window.__LH_MENU_FINAL_STABLE__)return;
window.__LH_MENU_FINAL_STABLE__=true;

const LABELS={dashboard:'Trang chủ',students:'Học sinh',attendance:'Điểm danh',violations:'Vi phạm',rewards:'Khen thưởng',learning:'Học tập',comments:'Nhận xét',statistics:'Thống kê','student-links':'Link học sinh',ai:'AI giáo viên','lucky-wheel':'Vòng quay may mắn',settings:'Cài đặt',materials:'Kho học liệu'};
let wheelBusy=false,wheelRotation=0,wheelAudio=null,wheelMusicTimer=null;

function injectStyle(){
 if(document.getElementById('lhFinalStableStyle'))return;
 const s=document.createElement('style');s.id='lhFinalStableStyle';
 s.textContent=`
/* FINAL MOBILE NAV */
@media (max-width:900px){
  .sidebar{width:250px!important;max-width:82vw!important;z-index:5000!important;transform:translateX(-102%)!important;transition:transform .22s ease!important}
  .sidebar.open{transform:translateX(0)!important}
  .sidebar-header{min-height:58px!important;padding:10px 12px!important}
  .brand-icon{width:34px!important;height:34px!important;flex-basis:34px!important;font-size:15px!important}
  .brand-text strong{font-size:10px!important}.brand-text span{font-size:9px!important}
  .class-selector{gap:5px!important;padding:10px!important}
  .class-selector select{padding:6px 7px!important;font-size:11px!important}
  .main-menu{gap:1px!important;padding:8px 7px!important}
  .menu-item{min-height:36px!important;padding:7px 9px!important;gap:9px!important;font-size:12px!important}
  .menu-item i{width:17px!important;flex-basis:17px!important;font-size:13px!important}
  .teacher-card{margin:7px!important;padding:8px!important}.teacher-avatar{width:32px!important;height:32px!important}.teacher-info strong{font-size:10px!important}.teacher-info span{font-size:9px!important}
  .sidebar-overlay{z-index:4900!important;pointer-events:none!important}
  .sidebar-overlay.active{pointer-events:auto!important}
}
/* FINAL WHEEL */
#page-lucky-wheel .lh-wheel-circle{position:relative;overflow:hidden;width:min(390px,72vw)!important;height:min(390px,72vw)!important;border-radius:50%!important;border:10px solid #fff!important;background:conic-gradient(#ef4444 0deg 45deg,#f59e0b 45deg 90deg,#22c55e 90deg 135deg,#06b6d4 135deg 180deg,#3b82f6 180deg 225deg,#6366f1 225deg 270deg,#a855f7 270deg 315deg,#ec4899 315deg 360deg)!important;box-shadow:0 12px 35px rgba(15,23,42,.22),inset 0 0 0 3px rgba(255,255,255,.5)!important;transform-origin:center!important;will-change:transform}
#page-lucky-wheel .lh-wheel-pointer{display:none!important}
#page-lucky-wheel .lh-wheel-stage{position:relative!important}
#page-lucky-wheel .lh-wheel-stage:before{content:'▼';position:absolute;z-index:20;top:-7px;left:50%;transform:translateX(-50%);font-size:34px;line-height:1;color:#111827;text-shadow:0 2px 4px rgba(0,0,0,.15);pointer-events:none}
#page-lucky-wheel .lh-wheel-center{position:absolute!important;z-index:15;inset:50% auto auto 50%!important;transform:translate(-50%,-50%)!important;width:82px!important;height:82px!important;display:grid!important;place-items:center!important;border-radius:50%!important;border:6px solid #fff!important;background:#111827!important;color:#fff!important;font-size:36px!important;box-shadow:0 5px 14px rgba(0,0,0,.28)!important}
#page-lucky-wheel .lh-wheel-circle:after{content:'1    2    3    4    5    6    7    8';position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:900;font-size:clamp(18px,3vw,28px);letter-spacing:clamp(16px,4vw,26px);text-shadow:0 2px 4px rgba(0,0,0,.35);transform:rotate(22deg);pointer-events:none;white-space:pre-wrap}
@media(max-width:900px){#page-lucky-wheel .lh-wheel-circle{width:min(320px,76vw)!important;height:min(320px,76vw)!important}.lh-wheel-panel{padding:12px!important}.lh-wheel-stage{gap:14px!important}}
`;
 document.head.appendChild(s);
}

function closeMobile(){
 if(window.innerWidth>900)return;
 const s=document.getElementById('sidebar'),o=document.getElementById('sidebarOverlay');
 if(s)s.classList.remove('open');if(o)o.classList.remove('active');
}
function show(page){
 const target=[...document.querySelectorAll('[data-page-section]')].find(x=>x.getAttribute('data-page-section')===page);
 if(!target)return false;
 document.querySelectorAll('[data-page-section]').forEach(x=>{x.hidden=true;x.classList.remove('active')});
 target.hidden=false;target.classList.add('active');
 document.querySelectorAll('.main-menu .menu-item[data-page]').forEach(x=>x.classList.toggle('active',x.getAttribute('data-page')===page));
 const title=document.getElementById('pageTitle');if(title)title.textContent=LABELS[page]||page;
 closeMobile();
 if(page==='lucky-wheel')setTimeout(bindWheel,0);
 return true;
}

function bindMenu(){
 document.querySelectorAll('.main-menu .menu-item[data-page]').forEach(btn=>{
  if(btn.__LH_FINAL_MENU__)return;
  btn.__LH_FINAL_MENU__=true;
  btn.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();show(btn.getAttribute('data-page'))},true);
  btn.addEventListener('touchend',e=>{e.preventDefault();show(btn.getAttribute('data-page'))},{passive:false});
 });
 const toggle=document.getElementById('sidebarToggle');
 if(toggle&&!toggle.__LH_FINAL_TOGGLE__){toggle.__LH_FINAL_TOGGLE__=true;toggle.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();const s=document.getElementById('sidebar'),o=document.getElementById('sidebarOverlay');const open=!!s&&!s.classList.contains('open');if(s)s.classList.toggle('open',open);if(o)o.classList.toggle('active',open)},{capture:true});}
 const close=document.getElementById('sidebarClose');
 if(close&&!close.__LH_FINAL_CLOSE__){close.__LH_FINAL_CLOSE__=true;close.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();closeMobile()},{capture:true});}
 const overlay=document.getElementById('sidebarOverlay');
 if(overlay&&!overlay.__LH_FINAL_OVERLAY__){overlay.__LH_FINAL_OVERLAY__=true;overlay.style.pointerEvents='auto';overlay.addEventListener('click',()=>closeMobile(),{capture:true});}
}

function staleCounts(){
 ['violationBadge','rewardBadge'].forEach(id=>{const el=document.getElementById(id);if(el){el.textContent='';el.style.display='none'}});
 ['statViolations','statRewards'].forEach(id=>{const el=document.getElementById(id);if(el)el.textContent='0'});
}

function students(){
 const keys=['students','allStudents','hocSinh','HOC_SINH'];
 for(const k of keys){const a=window[k];if(Array.isArray(a)&&a.length)return a.filter(s=>s&&s.id&&String(s.name||'').trim()).map(s=>({id:String(s.id),name:String(s.name).trim(),group:String(s.to||s.tTo||s.group||s.nhom||s.team||'').trim()}));}
 try{if(typeof window.getStudentsSafe==='function'){const a=window.getStudentsSafe();if(Array.isArray(a))return a.filter(s=>s&&s.id&&String(s.name||'').trim()).map(s=>({id:String(s.id),name:String(s.name).trim(),group:String(s.to||s.tTo||s.group||s.nhom||s.team||'').trim()}));}}catch(e){}
 return [];
}
function pool(scope){const all=students();if(/^to[1-4]$/.test(scope)){const n=scope.slice(2);const f=all.filter(s=>String(s.group).replace(/\s+/g,'').match(new RegExp('^(to|t[oô])?'+n+'$','i')));return f.length?f:all}return all}
function audio(){try{const C=window.AudioContext||window.webkitAudioContext;if(!C)return null;wheelAudio=wheelAudio||new C();if(wheelAudio.state==='suspended')wheelAudio.resume();return wheelAudio}catch(e){return null}}
function tone(freq,d=.13,v=.025,when=0,type='triangle'){const c=audio();if(!c)return;const o=c.createOscillator(),g=c.createGain(),t=c.currentTime+when;o.type=type;o.frequency.value=freq;g.gain.value=.0001;g.gain.exponentialRampToValueAtTime(v,t+.015);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g);g.connect(c.destination);o.start(t);o.stop(t+d+.04)}
function startMusic(){if(wheelMusicTimer)return;let i=0;const n=[523.25,659.25,783.99,659.25,587.33,698.46,880,698.46];const tick=()=>{tone(n[i++%n.length],.14,.02,0,'triangle')};tick();wheelMusicTimer=setInterval(tick,180)}
function stopMusic(){if(wheelMusicTimer){clearInterval(wheelMusicTimer);wheelMusicTimer=null}}
function renderCalled(ids){const out=document.getElementById('lhWheelCalled'),count=document.getElementById('lhWheelCount'),all=students();if(count)count.textContent=`Đã gọi ${ids.length}/${all.length} học sinh`;if(out){out.innerHTML=ids.map((id,i)=>{const s=all.find(x=>x.id===id);return s?`<div class="lh-wheel-called-item"><span>${i+1}</span><b>${s.name.replace(/&/g,'&amp;').replace(/</g,'&lt;')}</b></div>`:''}).join('')||'<div class="lh-wheel-empty">Chưa gọi học sinh nào.</div>'}}

function bindWheel(){
 const old=document.getElementById('lhWheelSpin');if(!old)return;
 const btn=old.cloneNode(true);old.replaceWith(btn); // remove all old handlers
 const resetOld=document.getElementById('lhWheelReset');if(resetOld){const r=resetOld.cloneNode(true);resetOld.replaceWith(r);r.addEventListener('click',()=>{wheelRotation=0;const w=document.querySelector('#page-lucky-wheel .lh-wheel-circle');if(w){w.style.transition='.35s ease';w.style.transform='rotate(0deg)'}localStorage.removeItem('lhCalled');renderCalled([])})}
 const scope=document.getElementById('lhWheelScope');if(scope&&!scope.__LH_FINAL_SCOPE__){scope.__LH_FINAL_SCOPE__=true;scope.addEventListener('change',()=>{localStorage.removeItem('lhCalled');renderCalled([])})}
 let ids=[];try{ids=JSON.parse(localStorage.getItem('lhCalled')||'[]');if(!Array.isArray(ids))ids=[]}catch(e){ids=[]}
 renderCalled(ids);
 btn.addEventListener('click',()=>{
  if(wheelBusy)return;const p=pool(scope?.value||'all');if(!p.length){alert('Chưa có dữ liệu học sinh để quay.');return}
  let available=p.filter(s=>!ids.includes(s.id));if(!available.length){ids=[];available=p.slice()}
  const winner=available[Math.floor(Math.random()*available.length)];ids.push(winner.id);localStorage.setItem('lhCalled',JSON.stringify(ids));
  const wheel=document.querySelector('#page-lucky-wheel .lh-wheel-circle'),name=document.getElementById('lhWheelName'),sub=document.getElementById('lhWheelSub');
  wheelBusy=true;btn.disabled=true;if(sub)sub.textContent='🎡 Đang quay...';audio();startMusic();
  const extra=(7+Math.floor(Math.random()*3))*360+Math.floor(Math.random()*360);wheelRotation+=extra;
  if(wheel){wheel.style.transition='transform 4.6s cubic-bezier(.12,.72,.15,1)';wheel.style.transform=`rotate(${wheelRotation}deg)`;}
  const fake=setInterval(()=>{const f=p[Math.floor(Math.random()*p.length)];if(name)name.textContent=f.name},100);
  setTimeout(()=>{clearInterval(fake);stopMusic();tone(1046,.18,.04,0,'sine');tone(1318,.22,.035,.12,'sine');tone(1568,.3,.03,.25,'sine');if(name){name.textContent=winner.name;name.classList.remove('winner-pop');void name.offsetWidth;name.classList.add('winner-pop')}if(sub)sub.textContent='🎉 Chúc mừng!';renderCalled(ids);btn.disabled=false;wheelBusy=false},4650);
 },{capture:true});
}

function boot(){injectStyle();staleCounts();bindMenu();if(window.innerWidth<=900)closeMobile();bindWheel();window.addEventListener('pagechange',()=>{setTimeout(bindWheel,0);closeMobile()});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
setTimeout(boot,300);setTimeout(boot,900);setTimeout(boot,1800);
})();
