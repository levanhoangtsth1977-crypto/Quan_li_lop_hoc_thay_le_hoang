/* STUDENT LINKS 8.0 — shared + per-student profile links
 * Menu “Link học sinh” có 01 link website chung + danh sách link riêng từng học sinh.
 * Link riêng mở thẳng student-profile.html?t=<SHA-256 token> của đúng học sinh.
 * Token phải khớp cơ chế xác thực trong student-profile.html và api/student-data.js.
 */
(function(){
  'use strict';
  if(window.__LH_STUDENT_LINKS_SHARED_80__) return;
  window.__LH_STUDENT_LINKS_SHARED_80__=true;

  const PAGE_SELECTOR='#page-student-links,[data-page-section="student-links"]';
  const TOKEN_PREFIX='LH_STUDENT_PROFILE_V3|2026-2027|5A3|';
  const PROFILE_PAGE='student-profile.html';
  const esc=v=>String(v??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const toast=(message,type='info')=>{if(typeof window.showToast==='function')window.showToast(message,type);else console.info(message)};
  const getStudents=()=>{try{return typeof window.getStudentsSafe==='function'?(window.getStudentsSafe()||[]):(Array.isArray(window.students)?window.students:[])}catch{return[]}};

  function baseUrl(){
    try{const u=new URL(window.location.href);u.search='';u.hash='';return u}
    catch{return new URL(window.location.origin+window.location.pathname)}
  }

  async function sha256Hex(value){
    if(!window.crypto?.subtle||!window.TextEncoder){
      throw new Error('Trình duyệt không hỗ trợ tạo mã liên kết cá nhân an toàn.');
    }
    const bytes=new TextEncoder().encode(String(value));
    const digest=await crypto.subtle.digest('SHA-256',bytes);
    return Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
  }

  async function studentUrl(studentId){
    const token=await sha256Hex(TOKEN_PREFIX+String(studentId??'').trim().replace(/\s+/g,' '));
    const current=baseUrl();
    const u=new URL(PROFILE_PAGE,current);
    u.search='';
    u.hash='';
    u.searchParams.set('t',token);
    return u.href;
  }

  async function copyText(value){
    if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(value);return}
    const ta=document.createElement('textarea');ta.value=value;ta.readOnly=true;ta.style.position='fixed';ta.style.left='-9999px';
    document.body.appendChild(ta);ta.select();if(!document.execCommand('copy'))throw new Error('copy_failed');ta.remove();
  }

  async function render(){
    const page=document.querySelector(PAGE_SELECTOR);if(!page)return;
    const students=getStudents().filter(s=>s&&String(s.id??'').trim()&&String(s.name??'').trim());
    page.innerHTML=`
      <div class="page-header">
        <div>
          <span class="page-eyebrow"><i class="fa-solid fa-link"></i> Liên kết học sinh</span>
          <h1>Link học sinh</h1>
          <p>Link chung của lớp và link riêng mở thẳng trang tổng hợp của từng học sinh.</p>
        </div>
      </div>
      <section class="dashboard-panel" id="sharedStudentWebsitePanel">
        <div class="panel-header"><div><h3>🌐 Link website dùng chung của lớp</h3><p>Dùng chung cho tất cả học sinh và phụ huynh.</p></div></div>
        <div class="student-link-shared-row">
          <input id="sharedStudentWebsiteUrl" type="text" readonly value="${esc(baseUrl().href)}" aria-label="Link website dùng chung">
          <button type="button" class="button secondary" id="copySharedStudentWebsite"><i class="fa-solid fa-copy"></i> Sao chép</button>
          <a class="button primary" href="${esc(baseUrl().href)}" target="_blank" rel="noopener noreferrer"><i class="fa-solid fa-arrow-up-right-from-square"></i> Mở website</a>
        </div>
      </section>
      <section class="dashboard-panel" id="perStudentLinksPanel">
        <div class="panel-header">
          <div><h3>👤 Link riêng từng học sinh</h3><p>Mỗi link mở đúng trang tổng hợp của một học sinh.</p></div>
          <span class="mini-stat"><span>Học sinh</span><strong>${students.length}</strong></span>
        </div>
        <div class="table-container" style="overflow:auto">
          <table class="data-table" id="studentLinksTable">
            <thead><tr><th>STT</th><th>Họ tên học sinh</th><th>Link hồ sơ cá nhân</th><th>Thao tác</th></tr></thead>
            <tbody id="studentLinksTableBody"><tr><td colspan="4"><div class="empty-state"><span class="empty-icon"><i class="fa-solid fa-link"></i></span><strong>Đang tạo link cá nhân…</strong><p>Hệ thống đang tạo mã truy cập an toàn cho từng học sinh.</p></div></td></tr></tbody>
          </table>
        </div>
      </section>`;

    document.getElementById('copySharedStudentWebsite')?.addEventListener('click',async()=>{
      try{await copyText(baseUrl().href);toast('Đã sao chép link website chung của lớp.','success')}
      catch{toast('Không thể sao chép link.','error')}
    });

    const body=document.getElementById('studentLinksTableBody');
    if(!body)return;
    if(!students.length){
      body.innerHTML='<tr><td colspan="4"><div class="empty-state"><span class="empty-icon"><i class="fa-solid fa-users"></i></span><strong>Chưa có học sinh</strong><p>Link riêng sẽ được tạo sau khi có danh sách học sinh.</p></div></td></tr>';
      return;
    }

    try{
      const rows=[];
      for(let i=0;i<students.length;i++){
        const s=students[i];
        const url=await studentUrl(s.id);
        rows.push(`<tr><td>${i+1}</td><td><strong>${esc(s.name)}</strong></td><td><input type="text" readonly value="${esc(url)}" aria-label="Link hồ sơ ${esc(s.name)}"></td><td><div class="student-link-actions"><button type="button" class="button secondary" data-copy-student-link="${esc(s.id)}"><i class="fa-solid fa-copy"></i> Sao chép</button><a class="button primary" href="${esc(url)}" target="_blank" rel="noopener noreferrer"><i class="fa-solid fa-arrow-up-right-from-square"></i> Mở hồ sơ</a></div></td></tr>`);
      }
      body.innerHTML=rows.join('');

      body.querySelectorAll('[data-copy-student-link]').forEach(btn=>btn.addEventListener('click',async()=>{
        try{const url=await studentUrl(btn.dataset.copyStudentLink);await copyText(url);toast('Đã sao chép link hồ sơ riêng của học sinh.','success')}
        catch(error){toast(error?.message||'Không thể tạo hoặc sao chép link.','error')}
      }));
    }catch(error){
      body.innerHTML='<tr><td colspan="4"><div class="empty-state"><strong>Không tạo được link cá nhân</strong><p>'+esc(error?.message||'Vui lòng dùng trình duyệt hiện đại và thử lại.')+'</p></div></td></tr>';
      toast(error?.message||'Không tạo được link cá nhân.','error');
    }
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
