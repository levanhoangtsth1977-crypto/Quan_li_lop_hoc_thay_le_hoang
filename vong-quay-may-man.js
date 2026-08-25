/* VÒNG QUAY MAY MẮN — ĐỘC LẬP
 * Chỉ đọc danh sách học sinh hiện có.
 * Không ghi/sửa/xóa Google Sheets.
 * Không lặp học sinh trong cùng một vòng cho đến khi hết danh sách.
 */
(function(){'use strict';
  const APP='lhLuckyWheel';
  const PAGE='page-lucky-wheel';
  let calledIds=[];
  let currentWinner=null;

  const clean=v=>String(v??'').trim().replace(/\s+/g,' ');
  const esc=v=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\"/g,'&quot;');

  function getStudents(){
    const candidates=['students','allStudents','hocSinh','HOC_SINH'];
    for(const k of candidates){
      if(Array.isArray(window[k])){
        const a=window[k].filter(s=>s&&s.id&&clean(s.name));
        if(a.length)return a;
      }
    }
    try{
      if(typeof window.getStudentsSafe==='function'){
        const a=window.getStudentsSafe();
        if(Array.isArray(a))return a.filter(s=>s&&s.id&&clean(s.name));
      }
    }catch(e){}
    return [];
  }

  function normalizeStudents(){
    return getStudents().map((s,i)=>({
      id:String(s.id),
      name:clean(s.name),
      gender:clean(s.gender||s.gioiTinh||''),
      group:clean(s.to||s.tTo||s.group||s.nhom||s.team||'') || '',
      index:i+1
    }));
  }

  function scopes(students,scope){
    if(scope==='to1'||scope==='to2'||scope==='to3'||scope==='to4'){
      const n=scope.slice(2);
      const filtered=students.filter(s=>new RegExp('^t[oô]\\s*'+n+'$','i').test(s.group)||s.group===n);
      return filtered.length?filtered:students;
    }
    return students;
  }

  function available(students){
    return students.filter(s=>!calledIds.includes(s.id));
  }

  function choose(){
    const students=normalizeStudents();
    if(!students.length){alert('Chưa có dữ liệu học sinh để quay.');return;}
    const scope=document.getElementById('lhWheelScope')?.value||'all';
    let pool=scopes(students,scope);
    let avail=available(pool);
    if(!avail.length){
      calledIds=[];
      avail=pool.slice();
      toast('Đã hết lượt. Hệ thống tự động bắt đầu vòng mới.');
    }
    const winner=avail[Math.floor(Math.random()*avail.length)];
    calledIds.push(winner.id);
    currentWinner=winner;
    animateWinner(winner,avail);
  }

  function animateWinner(winner,pool){
    const name=document.getElementById('lhWheelName');
    const sub=document.getElementById('lhWheelSub');
    const btn=document.getElementById('lhWheelSpin');
    if(!name||!btn)return;
    btn.disabled=true;
    name.classList.remove('winner-pop');
    let ticks=0;
    const timer=setInterval(()=>{
      const fake=pool[Math.floor(Math.random()*pool.length)];
      name.textContent=fake.name;
      ticks++;
      if(ticks>=14){
        clearInterval(timer);
        name.textContent=winner.name;
        if(sub)sub.textContent='🎉 Chúc mừng! Học sinh được gọi ngẫu nhiên.';
        name.classList.add('winner-pop');
        btn.disabled=false;
        renderCalled();
        playBeep();
      }
    },75);
  }

  function renderCalled(){
    const students=normalizeStudents();
    const list=document.getElementById('lhWheelCalled');
    const count=document.getElementById('lhWheelCount');
    const total=students.length;
    if(count)count.textContent=`Đã gọi ${calledIds.length}/${total} học sinh`;
    if(!list)return;
    const rows=calledIds.map((id,i)=>{
      const s=students.find(x=>x.id===id);return s?`<div class="lh-wheel-called-item"><span>${i+1}</span><b>${esc(s.name)}</b></div>`:'';
    }).join('');
    list.innerHTML=rows||'<div class="lh-wheel-empty">Chưa gọi học sinh nào.</div>';
  }

  function resetRound(){calledIds=[];currentWinner=null;const n=document.getElementById('lhWheelName');const s=document.getElementById('lhWheelSub');if(n)n.textContent='SẴN SÀNG';if(s)s.textContent='Nhấn “QUAY NGAY” để chọn học sinh';renderCalled();}

  function toast(msg){const t=document.createElement('div');t.className='lh-wheel-toast';t.textContent=msg;document.body.appendChild(t);setTimeout(()=>t.remove(),2200);}

  function playBeep(){try{const C=window.AudioContext||window.webkitAudioContext;if(!C)return;const c=new C();const o=c.createOscillator();const g=c.createGain();o.type='sine';o.frequency.value=880;g.gain.value=.05;o.connect(g);g.connect(c.destination);o.start();o.stop(c.currentTime+.18);setTimeout(()=>c.close(),300);}catch(e){}}

  function bindPage(){
    const sec=document.getElementById(PAGE);
    if(!sec)return false;
    const spin=document.getElementById('lhWheelSpin');
    const reset=document.getElementById('lhWheelReset');
    const scope=document.getElementById('lhWheelScope');
    if(spin)spin.onclick=choose;
    if(reset)reset.onclick=resetRound;
    if(scope)scope.onchange=()=>{resetRound();renderCalled();};
    renderCalled();
    return true;
  }

  function installMenu(){
    const nav=document.querySelector('.main-menu');if(!nav)return;
    const existing=nav.querySelector('[data-page="lucky-wheel"]');
    if(existing){existing.onclick=openPage;return;}
    const divider=document.createElement('div');divider.className='menu-divider lh-wheel-divider';
    const btn=document.createElement('button');btn.type='button';btn.id=APP;btn.className='menu-item';btn.dataset.page='lucky-wheel';
    btn.innerHTML='<i class="fa-solid fa-dharmachakra"></i><span>Vòng quay may mắn</span>';
    const utilities=nav.querySelector('#lhUtilitiesFinal');
    const settings=nav.querySelector('[data-page="settings"]');
    if(utilities){nav.insertBefore(divider,utilities);nav.insertBefore(btn,utilities);}else if(settings){nav.insertBefore(divider,settings);nav.insertBefore(btn,settings);}else{nav.appendChild(divider);nav.appendChild(btn);}
    btn.onclick=openPage;
  }

  function openPage(){
    document.querySelectorAll('.page-section').forEach(s=>s.classList.remove('active'));
    let sec=document.getElementById(PAGE);
    if(!sec){
      sec=document.createElement('section');sec.id=PAGE;sec.className='page-section active';
      sec.innerHTML=`<div class="page-header"><div><span class="page-eyebrow"><i class="fa-solid fa-dharmachakra"></i> Hoạt động lớp học</span><h1>🎡 Vòng quay may mắn</h1><p>Gọi ngẫu nhiên học sinh để trả lời, phát biểu hoặc tham gia hoạt động. Không thay đổi dữ liệu gốc.</p></div></div><div class="lh-wheel-panel"><div class="lh-wheel-controls"><label>Phạm vi chọn<select id="lhWheelScope"><option value="all">👥 Toàn lớp</option><option value="to1">Tổ 1</option><option value="to2">Tổ 2</option><option value="to3">Tổ 3</option><option value="to4">Tổ 4</option></select></label><button type="button" class="button secondary" id="lhWheelReset"><i class="fa-solid fa-rotate-left"></i> Vòng mới</button></div><div class="lh-wheel-stage"><div class="lh-wheel-circle"><div class="lh-wheel-pointer">▼</div><div class="lh-wheel-center">🎡</div></div><div class="lh-wheel-result"><div class="lh-wheel-caption">HỌC SINH ĐƯỢC CHỌN</div><div class="lh-wheel-name" id="lhWheelName">SẴN SÀNG</div><div class="lh-wheel-sub" id="lhWheelSub">Nhấn “QUAY NGAY” để chọn học sinh</div><button type="button" class="button primary lh-wheel-spin" id="lhWheelSpin">🎯 QUAY NGAY</button><div class="lh-wheel-count" id="lhWheelCount">Đã gọi 0/0 học sinh</div></div></div><div class="lh-wheel-called-wrap"><div class="lh-wheel-called-head"><b>Danh sách đã gọi</b><span>Không lặp trong cùng một vòng</span></div><div id="lhWheelCalled" class="lh-wheel-called"><div class="lh-wheel-empty">Chưa gọi học sinh nào.</div></div></div></div>`;
      document.getElementById('mainContent').appendChild(sec);
    }
    sec.classList.add('active');
    const title=document.getElementById('pageTitle');if(title)title.textContent='Vòng quay may mắn';
    bindPage();
  }

  function css(){
    if(document.getElementById('lhWheelStyle'))return;
    const s=document.createElement('style');s.id='lhWheelStyle';s.textContent=`.lh-wheel-panel{max-width:1050px;margin:0 auto}.lh-wheel-controls{display:flex;justify-content:space-between;gap:14px;align-items:end;margin-bottom:18px}.lh-wheel-controls label{display:flex;flex-direction:column;gap:6px;font-weight:600;color:#334155}.lh-wheel-controls select{min-width:190px;padding:10px 12px;border:1px solid #cbd5e1;border-radius:10px;background:#fff}.lh-wheel-stage{display:grid;grid-template-columns:1fr 1fr;gap:30px;align-items:center;background:#fff;border:1px solid #e2e8f0;border-radius:22px;padding:28px;box-shadow:0 10px 30px rgba(15,23,42,.08)}.lh-wheel-circle{position:relative;width:min(330px,70vw);aspect-ratio:1;margin:auto;border-radius:50%;background:conic-gradient(#2563eb 0 45deg,#f59e0b 45deg 90deg,#10b981 90deg 135deg,#ef4444 135deg 180deg,#8b5cf6 180deg 225deg,#06b6d4 225deg 270deg,#eab308 270deg 315deg,#ec4899 315deg 360deg);border:10px solid #fff;box-shadow:0 15px 40px rgba(15,23,42,.18);display:flex;align-items:center;justify-content:center;animation:lhWheelPulse 2.8s ease-in-out infinite}.lh-wheel-circle:before{content:'';position:absolute;inset:24px;border-radius:50%;border:2px dashed rgba(255,255,255,.75)}.lh-wheel-center{width:92px;height:92px;border-radius:50%;background:#fff;display:flex;align-items:center;justify-content:center;font-size:42px;box-shadow:0 5px 16px rgba(0,0,0,.16);z-index:2}.lh-wheel-pointer{position:absolute;top:-16px;left:50%;transform:translateX(-50%);z-index:3;font-size:34px;color:#111827;text-shadow:0 2px 2px rgba(0,0,0,.2)}.lh-wheel-result{text-align:center}.lh-wheel-caption{font-size:12px;font-weight:700;letter-spacing:.14em;color:#64748b}.lh-wheel-name{font-size:clamp(28px,4vw,44px);font-weight:900;margin:14px 0 8px;min-height:54px;display:flex;align-items:center;justify-content:center}.lh-wheel-name.winner-pop{animation:lhWinner .7s ease}.lh-wheel-sub{color:#64748b;min-height:24px}.lh-wheel-spin{margin-top:22px;min-width:210px;font-size:17px;font-weight:800}.lh-wheel-spin:disabled{opacity:.7}.lh-wheel-count{margin-top:12px;font-size:13px;color:#64748b}.lh-wheel-called-wrap{margin-top:18px;background:#fff;border:1px solid #e2e8f0;border-radius:18px;padding:18px}.lh-wheel-called-head{display:flex;justify-content:space-between;gap:10px;margin-bottom:12px}.lh-wheel-called-head span{font-size:12px;color:#64748b}.lh-wheel-called{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.lh-wheel-called-item{display:flex;gap:9px;align-items:center;padding:9px 11px;background:#f8fafc;border-radius:10px}.lh-wheel-called-item span{width:25px;height:25px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:#e2e8f0;font-size:12px}.lh-wheel-empty{text-align:center;color:#94a3b8;padding:20px}.lh-wheel-toast{position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:9999;background:#111827;color:#fff;padding:10px 16px;border-radius:999px;box-shadow:0 8px 25px rgba(0,0,0,.2);font-size:13px}@keyframes lhWinner{0%{transform:scale(.7);opacity:.2}70%{transform:scale(1.08)}100%{transform:scale(1);opacity:1}}@keyframes lhWheelPulse{0%,100%{transform:rotate(-2deg)}50%{transform:rotate(2deg)}}@media(max-width:800px){.lh-wheel-stage{grid-template-columns:1fr;padding:20px}.lh-wheel-controls{align-items:stretch;flex-direction:column}.lh-wheel-called{grid-template-columns:1fr}.lh-wheel-circle{width:min(300px,75vw)}}`;
    document.head.appendChild(s);
  }

  function start(){css();installMenu();bindPage();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
