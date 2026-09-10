/* STUDENT PUBLIC LOCK 1.0
 * Khi URL có ?student=<ID>, chuyển ứng dụng sang chế độ xem cá nhân.
 * Chỉ hiển thị hồ sơ của học sinh được chỉ định; ẩn toàn bộ menu quản trị.
 * Lưu ý: đây là khóa giao diện phía trình duyệt, không thay thế xác thực backend.
 */
(function(){
  'use strict';
  if(window.__LH_STUDENT_PUBLIC_LOCK_10__)return;
  window.__LH_STUDENT_PUBLIC_LOCK_10__=true;

  const PARAM='student';
  const clean=v=>String(v??'').trim();
  const esc=v=>String(v??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const q=new URLSearchParams(window.location.search);
  const studentId=clean(q.get(PARAM));
  if(!studentId)return;

  function getStudents(){
    try{return typeof window.getStudentsSafe==='function'?(window.getStudentsSafe()||[]):(Array.isArray(window.students)?window.students:[])}catch{return[]}
  }
  function findStudent(){
    const list=getStudents();
    return list.find(s=>clean(s?.id)===studentId||clean(s?.studentCode)===studentId)||null;
  }
  function getRecords(name,legacy){
    try{
      const f=window[name];
      if(typeof f==='function')return f()||[];
      return Array.isArray(window[legacy])?window[legacy]:[];
    }catch{return[]}
  }
  function matches(r,s){
    const id=studentId;
    return clean(r?.studentId)===clean(s?.id)||clean(r?.studentCode)===clean(s?.studentCode)||clean(r?.studentId)===id;
  }
  function lockNavigation(){
    document.body.classList.add('lh-student-public-mode');
    document.querySelectorAll('.sidebar,.topbar,.footer,.sidebar-overlay').forEach(el=>el.style.display='none');
    const main=document.getElementById('mainContent');
    if(main){main.style.margin='0';main.style.maxWidth='1100px';main.style.width='100%';main.style.marginInline='auto';main.style.padding='24px'}
    document.querySelectorAll('.page-section').forEach(sec=>{sec.classList.remove('active');sec.hidden=true});
  }
  function render(){
    lockNavigation();
    const main=document.getElementById('mainContent');if(!main)return;
    const s=findStudent();
    if(!s){
      main.innerHTML='<section class="page-section active" style="display:block"><div class="empty-state"><span class="empty-icon">🔒</span><strong>Liên kết học sinh không hợp lệ</strong><p>Không tìm thấy hồ sơ được chỉ định.</p></div></section>';
      return;
    }
    const att=getRecords('getAttendanceRecords','attendanceRecords').filter(r=>matches(r,s));
    const vio=getRecords('getViolationRecords','violationRecords').filter(r=>matches(r,s));
    const rew=getRecords('getRewardRecords','rewardRecords').filter(r=>matches(r,s));
    const learn=getRecords('getLearningRecords','learningRecords').filter(r=>matches(r,s));
    const prog=getRecords('getProgressRecords','progressRecords').filter(r=>matches(r,s));
    const present=att.filter(r=>/present|có mặt/i.test(clean(r.status))).length;
    main.innerHTML=`<section class="page-section active" style="display:block"><div style="max-width:1000px;margin:0 auto"><div style="display:flex;align-items:center;gap:16px;padding:20px 0;border-bottom:1px solid #e2e8f0"><div style="width:56px;height:56px;border-radius:50%;display:grid;place-items:center;background:#eff6ff;color:#2563eb;font-weight:800;font-size:18px">${esc(clean(s.name).split(/\s+/).map(x=>x[0]).slice(-2).join(''))}</div><div><div style="font-size:12px;color:#64748b;font-weight:700;text-transform:uppercase">THÔNG TIN HỌC SINH</div><h1 style="margin:3px 0 2px;font-size:28px">${esc(s.name)}</h1><div style="color:#64748b">${esc(s.gender||'')} ${s.birthDate?' · '+esc(s.birthDate):''}</div></div></div><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin:20px 0"><div class="stat-card"><strong class="stat-number">${att.length}</strong><span class="stat-label">Lượt điểm danh</span></div><div class="stat-card"><strong class="stat-number">${present}</strong><span class="stat-label">Có mặt</span></div><div class="stat-card"><strong class="stat-number">${vio.length}</strong><span class="stat-label">Vi phạm</span></div><div class="stat-card"><strong class="stat-number">${rew.length}</strong><span class="stat-label">Khen thưởng</span></div><div class="stat-card"><strong class="stat-number">${learn.length}</strong><span class="stat-label">Học tập</span></div><div class="stat-card"><strong class="stat-number">${prog.length}</strong><span class="stat-label">Tiến bộ</span></div></div><div class="dashboard-columns"><section class="dashboard-panel"><h3>🔒 Thông tin được chia sẻ</h3><p>Chỉ hiển thị dữ liệu của học sinh này.</p></section><section class="dashboard-panel"><h3>📅 Chuyên cần</h3><p>${att.length?esc(att.slice(-10).map(r=>(r.date||'')+' — '+(r.status||'')).join(' · ')):'Chưa có dữ liệu.'}</p></section></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:16px"><section class="dashboard-panel"><h3>⚠️ Vi phạm</h3><p>${vio.length?esc(vio.slice(-10).map(r=>(r.date||'')+' — '+(r.type||'')).join(' · ')):'Chưa có dữ liệu.'}</p></section><section class="dashboard-panel"><h3>🏆 Khen thưởng</h3><p>${rew.length?esc(rew.slice(-10).map(r=>(r.date||'')+' — '+(r.type||'')).join(' · ')):'Chưa có dữ liệu.'}</p></section></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:16px"><section class="dashboard-panel"><h3>📚 Học tập</h3><p>${learn.length?esc(learn.slice(-10).map(r=>(r.date||'')+' — '+(r.subject||r.result||'')).join(' · ')):'Chưa có dữ liệu.'}</p></section><section class="dashboard-panel"><h3>📈 Tiến bộ</h3><p>${prog.length?esc(prog.slice(-10).map(r=>(r.date||'')+' — '+(r.category||r.result||'')).join(' · ')):'Chưa có dữ liệu.'}</p></section></div><div style="margin-top:20px;padding:12px 14px;background:#f8fafc;border-radius:10px;color:#64748b;font-size:12px">Liên kết này chỉ dành cho học sinh/phụ huynh của hồ sơ đang mở.</div></div></section>`;
    document.title='Hồ sơ học sinh - '+clean(s.name);
  }

  function boot(){
    if(!studentId)return;
    render();
    window.addEventListener('google-sheets-data-ready',render,{once:true});
    window.addEventListener('data-changed',render);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
