/* THONG KE - HS XUAT SAC TOAN DIEN / FINAL */
(function () {
  'use strict';
  const PAGE = '#page-statistics';
  const BTN_ID = 'btnHSXuatSacToanDien';
  const PANEL_ID = 'hsXuatSacToanDienPanel';

  function root(){ return document.querySelector(PAGE); }
  function text(el){ return (el && el.textContent || '').replace(/\s+/g,' ').trim(); }
  function students(){
    const candidates = [
      window.students,
      window.classData && window.classData.students,
      window.appData && window.appData.students
    ];
    for(const a of candidates) if(Array.isArray(a)) return a;
    try { if(typeof window.getStudentsSafe === 'function') return window.getStudentsSafe() || []; } catch(e){}
    return [];
  }
  function records(){
    const names=['attendanceRecords','attendanceData','violations','violationRecords','rewards','rewardRecords','learningRecords','learningData','progressRecords','comments','commentRecords'];
    const out={};
    names.forEach(k=>out[k]=Array.isArray(window[k])?window[k]:[]);
    return out;
  }
  function sid(s){ return String(s && (s.id || s.studentId || s.studentCode || s.code) || '').trim(); }
  function nameOf(s){ return String(s && (s.name || s.fullName || s.hoTen || s.studentName) || '').trim(); }
  function countFor(arr,s){
    const id=sid(s), name=nameOf(s).toLowerCase();
    return arr.filter(r=>String(r && (r.studentId||r.studentCode||r.id||'')).trim()===id || String(r && (r.studentName||r.name||r.hoTen||'')).trim().toLowerCase()===name).length;
  }
  function learningScore(s){
    const arr=records().learningRecords.concat(records().learningData);
    const id=sid(s), name=nameOf(s).toLowerCase();
    const rs=arr.filter(r=>String(r && (r.studentId||r.studentCode||r.id||'')).trim()===id || String(r && (r.studentName||r.name||r.hoTen||'')).trim().toLowerCase()===name);
    const vals=rs.map(r=>Number(r.score ?? r.diem ?? r.average ?? r.avg ?? r.mark)).filter(Number.isFinite);
    return vals.length ? vals.reduce((a,b)=>a+b,0)/vals.length : 0;
  }
  function buildRows(limit){
    const r=records(), ss=students();
    const rows=ss.map(s=>{
      const absent=countFor(r.attendanceRecords.concat(r.attendanceData),s);
      const vio=countFor(r.violations.concat(r.violationRecords),s);
      const rew=countFor(r.rewards.concat(r.rewardRecords),s);
      const learn=learningScore(s);
      const score=(learn/10)*60 + Math.min(rew,10)*2 - Math.min(vio,10)*3 - Math.min(absent,10)*1.5;
      return {s,absent,vio,rew,learn,score};
    });
    return rows.sort((a,b)=>b.score-a.score || b.learn-a.learn || b.rew-a.rew || a.vio-b.vio || a.absent-b.absent).slice(0,limit);
  }
  function ensureButton(){
    const page=root(); if(!page) return;
    let b=document.getElementById(BTN_ID);
    if(!b){
      b=document.createElement('button');
      b.id=BTN_ID; b.type='button'; b.className='button primary';
      b.innerHTML='<i class="fa-solid fa-star"></i> HS xuất sắc toàn diện';
      b.addEventListener('click',showPanel);
      const tabs=[...page.querySelectorAll('button')].filter(x=>/HS vắng|HS vi phạm|HS khen thưởng/.test(text(x)));
      if(tabs.length) tabs[tabs.length-1].insertAdjacentElement('afterend',b);
      else {
        const h=page.querySelector('.page-header') || page.firstElementChild;
        if(h) h.appendChild(b); else page.insertBefore(b,page.firstChild);
      }
    }
  }
  function removeDuplicateFrame(){
    const page=root(); if(!page) return;
    const heads=[...page.querySelectorAll('h1,h2,h3,h4,p')];
    const h=heads.find(x=>text(x)==='Theo dõi toàn bộ quá trình');
    if(!h) return;
    let box=h.closest('.dashboard-panel,.panel,.card,.section,.statistics-section');
    if(box){ box.style.display='none'; return; }
    let el=h;
    for(let i=0;i<4 && el.parentElement;i++){
      el=el.parentElement;
      const t=text(el);
      if(t.includes('HS vắng') && t.includes('HS vi phạm') && t.includes('HS khen thưởng')){ el.style.display='none'; return; }
    }
  }
  function panel(){
    let p=document.getElementById(PANEL_ID);
    if(p) return p;
    p=document.createElement('section'); p.id=PANEL_ID; p.className='dashboard-panel'; p.style.marginTop='16px';
    return p;
  }
  function showPanel(){
    const page=root(); if(!page) return;
    const old=document.getElementById(PANEL_ID); if(old) old.remove();
    const p=panel();
    p.innerHTML='<div class="panel-header"><div><h3>🌟 Học sinh xuất sắc toàn diện</h3><p>Xếp hạng theo dữ liệu đã có trong hệ thống: học tập, chuyên cần, khen thưởng và vi phạm.</p></div><select id="hsXuatSacLimit" class="period-select"><option value="5">Top 5</option><option value="10">Top 10</option><option value="15">Top 15</option><option value="20">Top 20</option></select></div><div class="table-container"><table class="data-table"><thead><tr><th>Hạng</th><th>Học sinh</th><th>Điểm tổng hợp</th><th>Học tập</th><th>Vắng</th><th>Vi phạm</th><th>Khen thưởng</th></tr></thead><tbody id="hsXuatSacBody"></tbody></table></div>';
    const anchor=document.getElementById(BTN_ID);
    (anchor && anchor.parentElement ? anchor.parentElement : page).appendChild(p);
    function render(){
      const rows=buildRows(Number(document.getElementById('hsXuatSacLimit').value||5));
      const body=document.getElementById('hsXuatSacBody');
      if(!body) return;
      body.innerHTML=rows.length?rows.map((x,i)=>`<tr><td><strong>${i+1}</strong></td><td><strong>${esc(nameOf(x.s)||'Chưa xác định')}</strong></td><td><strong>${x.score.toFixed(1)}</strong></td><td>${x.learn?x.learn.toFixed(1):'—'}</td><td>${x.absent}</td><td>${x.vio}</td><td>${x.rew}</td></tr>`).join(''):'<tr><td colspan="7"><div class="empty-state"><strong>Chưa có dữ liệu học sinh</strong><p>Hệ thống không tự tạo hoặc đoán dữ liệu.</p></div></td></tr>';
    }
    document.getElementById('hsXuatSacLimit').addEventListener('change',render); render();
    p.scrollIntoView({behavior:'smooth',block:'start'});
  }
  function esc(v){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));}
  function init(){ ensureButton(); removeDuplicateFrame(); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init); else init();
  let last=''; setInterval(()=>{const r=root(); if(r && !r.hidden && !r.classList.contains('active')===false){const key=r.innerHTML.length+'|'+text(r.querySelector('h1')); if(key!==last){last=key;init();}}},1200);
  window.addEventListener('hashchange',init);
})();
