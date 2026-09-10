/* STUDENT LINKS 7.0 — shared + per-student
 * Menu “Link học sinh” có 01 link website chung + danh sách link riêng từng học sinh.
 * Link riêng dùng ?student=<studentId> và mở đúng dữ liệu của học sinh đó.
 * Không thay đổi Data Engine; chỉ đọc students[] và cấu hình link hiện có.
 */
(function(){
  'use strict';
  if(window.__LH_STUDENT_LINKS_SHARED_70__) return;
  window.__LH_STUDENT_LINKS_SHARED_70__=true;

  const PAGE_SELECTOR='#page-student-links,[data-page-section="student-links"]';
  const esc=v=>String(v??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const toast=(message,type='info')=>{if(typeof window.showToast==='function')window.showToast(message,type);else console.info(message)};
  const getStudents=()=>{try{return typeof window.getStudentsSafe==='function'?(window.getStudentsSafe()||[]):(Array.isArray(window.students)?window.students:[])}catch{return[]}};

  function baseUrl(){
    try{const u=new URL(window.location.href);u.search='';u.hash='';return u.href}
    catch{return window.location.href.split('?')[0].split('#')[0]}
  }
  function studentUrl(studentId){
    const u=new URL(baseUrl());
    u.searchParams.set((window.STUDENT_LINK_CONFIG?.parameterName)||'student',String(studentId));
    return u.href;
  }
  async function copyText(value){
    if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(value);return}
    const ta=document.createElement('textarea');ta.value=value;ta.readOnly=true;ta.style.position='fixed';ta.style.left='-9999px';
    document.body.appendChild(ta);ta.select();if(!document.execCommand('copy'))throw new Error('copy_failed');ta.remove();
  }

  function render(){
    const page=document.querySelector(PAGE_SELECTOR);if(!page)return;
    const shared=baseUrl();
    const students=getStudents().filter(s=>s&&String(s.id??'').trim()&&String(s.name??'').trim());
    page.innerHTML=`
      <div class="page-header">
        <div>
          <span class="page-eyebrow"><i class="fa-solid fa-link"></i> Liên kết học sinh</span>
          <h1>Link học sinh</h1>
          <p>Quản lý link website chung của lớp và link riêng để mở đúng trang tổng hợp của từng học sinh.</p>
        </div>
      </div>
      <section class="dashboard-panel" id="sharedStudentWebsitePanel">
        <div class="panel-header"><div><h3>🌐 Link website dùng chung của lớp</h3><p>Dùng chung cho tất cả học sinh và phụ huynh.</p></div></div>
        <div class="student-link-shared-row">
          <input id="sharedStudentWebsiteUrl" type="text" readonly value="${esc(shared)}" aria-label="Link website dùng chung">
          <button type="button" class="button secondary" id="copySharedStudentWebsite"><i class="fa-solid fa-copy"></i> Sao chép</button>
          <a class="button primary" href="${esc(shared)}" target="_blank" rel="noopener noreferrer"><i class="fa-solid fa-arrow-up-right-from-square"></i> Mở website</a>
        </div>
      </section>
      <section class="dashboard-panel" id="perStudentLinksPanel">
        <div class="panel-header">
          <div><h3>👤 Link riêng từng học sinh</h3><p>Mỗi link mở đúng dữ liệu tổng hợp của một học sinh.</p></div>
          <span class="mini-stat"><span>Học sinh</span><strong>${students.length}</strong></span>
        </div>
        <div class="table-container" style="overflow:auto">
          <table class="data-table" id="studentLinksTable">
            <thead><tr><th>STT</th><th>Họ tên học sinh</th><th>Link riêng</th><th>Thao tác</th></tr></thead>
            <tbody id="studentLinksTableBody"></tbody>
          </table>
        </div>
      </section>`;

    const body=document.getElementById('studentLinksTableBody');
    if(!students.length){body.innerHTML='<tr><td colspan="4"><div class="empty-state"><span class="empty-icon"><i class="fa-solid fa-users"></i></span><strong>Chưa có học sinh</strong><p>Link riêng sẽ được tạo sau khi có danh sách học sinh.</p></div></td></tr>';return}
    body.innerHTML=students.map((s,i)=>{
      const url=studentUrl(s.id);
      return `<tr><td>${i+1}</td><td><strong>${esc(s.name)}</strong></td><td><input type="text" readonly value="${esc(url)}" aria-label="Link riêng ${esc(s.name)}"></td><td><div class="student-link-actions"><button type="button" class="button secondary" data-copy-student-link="${esc(s.id)}"><i class="fa-solid fa-copy"></i> Sao chép</button><a class="button primary" href="${esc(url)}" target="_blank" rel="noopener noreferrer"><i class="fa-solid fa-arrow-up-right-from-square"></i> Mở</a></div></td></tr>`;
    }).join('');

    document.getElementById('copySharedStudentWebsite')?.addEventListener('click',async()=>{try{await copyText(shared);toast('Đã sao chép link website chung.','success')}catch{toast('Không thể sao chép link.','error')}});
    body.querySelectorAll('[data-copy-student-link]').forEach(btn=>btn.addEventListener('click',async()=>{try{await copyText(studentUrl(btn.dataset.copyStudentLink));toast('Đã sao chép link riêng của học sinh.','success')}catch{toast('Không thể sao chép link.','error')}}));
  }

  function boot(){
    render();
    document.addEventListener('click',e=>{if(e.target.closest?.('.menu-item[data-page="student-links"]'))setTimeout(render,0)},false);
    window.addEventListener('google-sheets-data-ready',()=>setTimeout(render,0),false);
    window.addEventListener('students-updated',()=>setTimeout(render,0),false);
    window.addEventListener('data-changed',()=>setTimeout(render,0),false);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
