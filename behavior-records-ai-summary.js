/* BEHAVIOR RECORDS + AI SUMMARY 1.2
 * Vi phạm và Khen thưởng có đúng một bảng riêng ở đúng menu.
 * AI chỉ đọc cùng nguồn dữ liệu; không tạo bản ghi mới.
 */
(function(){
  'use strict';
  if(window.__LH_BEHAVIOR_RECORDS_AI_SUMMARY_12__) return;
  window.__LH_BEHAVIOR_RECORDS_AI_SUMMARY_12__=true;

  const S=v=>String(v??'').trim();
  const norm=v=>S(v).replace(/\s+/g,' ').toLocaleLowerCase('vi');
  const esc=v=>S(v).replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const getStudents=()=>{try{return typeof window.getStudentsSafe==='function'?(window.getStudentsSafe()||[]):(Array.isArray(window.students)?window.students:[])}catch{return[]}};
  const getStudent=id=>{try{return typeof window.getStudentById==='function'?window.getStudentById(id):getStudents().find(s=>S(s.id)===S(id))}catch{return null}};
  const getRecords=kind=>{try{const fn=kind==='violation'?'getViolationRecords':'getRewardRecords';return typeof window[fn]==='function'?(window[fn]()||[]):[]}catch{return[]}};
  const date=v=>{const s=S(v);const m=s.match(/^(\d{4})[-\/]([0-9]{1,2})[-\/]([0-9]{1,2})/);return m?`${m[3].padStart(2,'0')}/${m[2].padStart(2,'0')}/${m[1]}`:s};
  const nameOf=id=>S(getStudent(id)?.name||getStudent(id)?.studentName||'Học sinh');
  function violationFields(r){return {date:r.date||r.createdAt||'',content:r.note||r.description||r.type||'',form:r.formType||r.action||r.resolution||r.handling||r.level||''}};
  function rewardFields(r){return {date:r.date||r.createdAt||'',content:r.note||r.description||r.type||r.achievement||'',form:r.formType||r.category||r.rewardType||r.level||''}};
  function rows(kind){return getRecords(kind).slice().sort((a,b)=>S(b.date||b.createdAt).localeCompare(S(a.date||a.createdAt))).map(r=>{const f=kind==='violation'?violationFields(r):rewardFields(r);return {...r,...f,studentName:nameOf(r.studentId)}})}
  function page(id){return document.getElementById(id)||document.querySelector(`[data-page-section="${id.replace('page-','')}"]`)}
  function isolateTables(){
    const vp=page('page-violations'), rp=page('page-rewards');
    if(vp&&rp){
      rp.querySelectorAll('#violationTableWrap,#violationTable').forEach(el=>el.remove());
      // Remove accidental violation wrapper/table nested in any descendant of rewards.
      rp.querySelectorAll('table').forEach(t=>{const h=norm(t.innerText||'');if(h.includes('ngày vi phạm')&&h.includes('nội dung vi phạm'))t.closest('#lhViolationTableWrap')?.remove()||t.remove()});
      // If a violation table lives elsewhere inside the main content, move one to Vi phạm.
      let vbody=vp.querySelector('#violationTableBody');
      if(!vbody){
        const rogue=[...document.querySelectorAll('#violationTableWrap,#violationTable')].find(el=>!vp.contains(el)&&!rp.contains(el));
        if(rogue) rogue.remove();
      }
      vbody=vp.querySelector('#violationTableBody');
      if(!vbody){
        const wrap=document.createElement('div');wrap.className='table-container';wrap.id='lhViolationTableWrap';
        wrap.innerHTML='<table class="data-table" id="violationTable"><thead></thead><tbody id="violationTableBody"></tbody></table>';
        const anchor=vp.querySelector('.info-banner.warning');if(anchor&&anchor.parentNode)anchor.parentNode.insertBefore(wrap,anchor.nextSibling);else vp.appendChild(wrap);
      }
    }
    return {vp,rp};
  }
  function renderTable(kind){
    const {vp,rp}=isolateTables();
    const p=kind==='violation'?vp:rp;if(!p)return;
    const selector=kind==='violation'?'#violationTableBody':'#rewardTableBody';
    const body=p.querySelector(selector);if(!body)return;
    const table=body.closest('table');if(!table)return;
    const thead=table.querySelector('thead');
    if(thead)thead.innerHTML=kind==='violation'?'<tr><th>STT</th><th>Họ tên học sinh</th><th>Ngày vi phạm</th><th>Nội dung vi phạm</th><th>Hình thức xử lý</th><th>Thao tác</th></tr>':'<tr><th>STT</th><th>Họ tên học sinh</th><th>Ngày khen thưởng</th><th>Nội dung khen thưởng</th><th>Hình thức khen thưởng</th><th>Thao tác</th></tr>';
    const data=rows(kind);
    if(!data.length){body.innerHTML='<tr><td colspan="6"><div class="empty-state"><strong>Chưa có dữ liệu</strong><p>Dữ liệu sẽ xuất hiện khi giáo viên ghi nhận.</p></div></td></tr>';return;}
    body.innerHTML=data.map((r,i)=>`<tr><td>${i+1}</td><td><strong>${esc(r.studentName)}</strong></td><td>${esc(date(r.date))||'—'}</td><td>${esc(r.content)||'—'}</td><td>${esc(r.form)||'—'}</td><td>${kind==='violation'?`<button type="button" class="icon-button danger" title="Xóa" data-violation-delete="${esc(r.id)}"><i class="fa-solid fa-trash"></i></button>`:`<button type="button" class="icon-button danger" title="Xóa" data-reward-delete="${esc(r.id)}"><i class="fa-solid fa-trash"></i></button>`}</td></tr>`).join('');
  }
  function aiSummaryData(){
    const v=rows('violation').map(r=>({loai:'Vi phạm',studentId:r.studentId,hoTen:r.studentName,ngay:date(r.date),noiDung:r.content,hinhThuc:r.form||'—'}));
    const k=rows('reward').map(r=>({loai:'Khen thưởng',studentId:r.studentId,hoTen:r.studentName,ngay:date(r.date),noiDung:r.content,hinhThuc:r.form||'—'}));
    return [...v,...k].sort((a,b)=>a.hoTen.localeCompare(b.hoTen,'vi')||a.ngay.split('/').reverse().join('').localeCompare(b.ngay.split('/').reverse().join('')));
  }
  function renderAI(){
    const p=page('page-ai');if(!p)return;
    let box=document.getElementById('lhBehaviorAISummary');
    if(!box){box=document.createElement('section');box.id='lhBehaviorAISummary';box.className='dashboard-panel';p.appendChild(box)}
    const data=aiSummaryData(),v=getRecords('violation'),k=getRecords('reward');
    box.innerHTML=`<div class="panel-header"><div><h3>📋 Bảng tổng hợp Vi phạm – Khen thưởng</h3><p>AI giáo viên sử dụng trực tiếp dữ liệu Vi phạm và Khen thưởng của hệ thống.</p></div></div><div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:14px"><span class="mini-stat"><span>⚠️ Vi phạm</span><strong>${v.length}</strong></span><span class="mini-stat"><span>🏆 Khen thưởng</span><strong>${k.length}</strong></span><span class="mini-stat"><span>👥 Học sinh có ghi nhận</span><strong>${new Set(data.map(x=>x.studentId).filter(Boolean)).size}</strong></span></div>${data.length?`<div class="table-container" style="overflow:auto"><table class="data-table"><thead><tr><th>STT</th><th>Họ tên</th><th>Loại</th><th>Ngày</th><th>Nội dung</th><th>Hình thức</th></tr></thead><tbody>${data.map((x,i)=>`<tr><td>${i+1}</td><td><strong>${esc(x.hoTen)}</strong></td><td>${esc(x.loai)}</td><td>${esc(x.ngay)||'—'}</td><td>${esc(x.noiDung)||'—'}</td><td>${esc(x.hinhThuc)||'—'}</td></tr>`).join('')}</tbody></table></div>`:'<div class="empty-state"><strong>Chưa có dữ liệu Vi phạm/Khen thưởng</strong><p>Khi có ghi nhận, bảng sẽ tự tổng hợp tại đây.</p></div>'}`;
  }
  function refresh(){isolateTables();renderTable('violation');renderTable('reward');renderAI();}
  document.addEventListener('click',e=>{const m=e.target.closest?.('[data-page="violations"],[data-page="rewards"],[data-page="ai"]');if(m)setTimeout(refresh,0)},false);
  window.addEventListener('google-sheet-record-saved',refresh);
  window.addEventListener('google-sheets-data-ready',refresh);
  window.addEventListener('google-sheets-refresh',refresh);
  window.__LH_BEHAVIOR_AI_API__={refresh,violations:()=>rows('violation'),rewards:()=>rows('reward'),summary:aiSummaryData};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(refresh,0),{once:true});else setTimeout(refresh,0);
})();
