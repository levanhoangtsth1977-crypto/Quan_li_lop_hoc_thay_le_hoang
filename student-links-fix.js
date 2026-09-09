/* STUDENT LINKS 5.0 — one student = one private deep link
 * Menu “Link học sinh” generates one unique URL per student.
 * Personal link format: same website + ?student=<studentId>.
 * Does not change student records or other menus.
 */
(function(){
  'use strict';
  if(window.__LH_STUDENT_LINKS_PERSONAL_50__) return;
  window.__LH_STUDENT_LINKS_PERSONAL_50__=true;

  const PAGE_SELECTOR='#page-student-links,[data-page-section="student-links"]';
  const PARAM='student';

  function students(){
    try{
      if(typeof window.getStudentsSafe==='function') return window.getStudentsSafe()||[];
      return Array.isArray(window.students)?window.students:[];
    }catch{return[];}
  }

  function baseUrl(){
    const u=new URL(window.location.href);
    u.search='';
    u.hash='';
    return u;
  }

  function linkFor(student){
    const u=baseUrl();
    u.searchParams.set(PARAM,String(student.id||''));
    return u.href;
  }

  function esc(v){return String(v??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}
  function toast(message,type='info'){if(typeof window.showToast==='function')window.showToast(message,type);else console.info(message);}

  async function copyText(value){
    if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(value);return;}
    const ta=document.createElement('textarea');ta.value=value;ta.readOnly=true;ta.style.position='fixed';ta.style.left='-9999px';document.body.appendChild(ta);ta.select();
    if(!document.execCommand('copy')) throw new Error('copy_failed');
    ta.remove();
  }

  function render(){
    const page=document.querySelector(PAGE_SELECTOR);
    if(!page)return;
    const list=students();
    page.innerHTML=`
      <div class="page-header">
        <div>
          <span class="page-eyebrow"><i class="fa-solid fa-link"></i> Liên kết cá nhân</span>
          <h1>Link học sinh</h1>
          <p>Mỗi học sinh có <strong>01 link riêng</strong> để truy cập đúng dữ liệu được phép chia sẻ của mình.</p>
        </div>
      </div>
      <div class="info-banner">
        <i class="fa-solid fa-shield-halved"></i>
        <div>
          <strong>🔐 1 học sinh = 1 link riêng</strong>
          <p>Link được tạo từ mã học sinh và không dùng chung giữa các em.</p>
        </div>
      </div>
      <div class="table-container">
        <table class="data-table" id="studentPersonalLinksTable">
          <thead><tr><th>STT</th><th>Họ tên học sinh</th><th>Link riêng</th><th>Thao tác</th></tr></thead>
          <tbody id="studentPersonalLinksBody"></tbody>
        </table>
      </div>`;

    const body=document.getElementById('studentPersonalLinksBody');
    if(!body)return;
    if(!list.length){
      body.innerHTML='<tr><td colspan="4"><div class="empty-state"><strong>Chưa có học sinh</strong><p>Link riêng sẽ xuất hiện sau khi có danh sách học sinh.</p></div></td></tr>';
      return;
    }
    body.innerHTML=list.map((s,i)=>{
      const url=linkFor(s);
      return `<tr>
        <td>${i+1}</td>
        <td><strong>${esc(s.name||s.studentName||'Học sinh')}</strong></td>
        <td><input type="text" readonly value="${esc(url)}" aria-label="Link riêng của ${esc(s.name||'học sinh')}"></td>
        <td><div style="display:flex;gap:8px;flex-wrap:wrap">
          <button type="button" class="button secondary" data-copy-student-link="${esc(s.id)}"><i class="fa-solid fa-copy"></i> Sao chép</button>
          <a class="button primary" href="${esc(url)}" target="_blank" rel="noopener noreferrer"><i class="fa-solid fa-arrow-up-right-from-square"></i> Mở</a>
        </div></td>
      </tr>`;
    }).join('');

    body.querySelectorAll('[data-copy-student-link]').forEach(btn=>{
      btn.addEventListener('click',async()=>{
        const s=list.find(x=>String(x.id)===String(btn.dataset.copyStudentLink));
        if(!s)return;
        try{await copyText(linkFor(s));toast('Đã sao chép link riêng của '+(s.name||'học sinh')+'.','success');}
        catch{toast('Không thể sao chép link.','error');}
      });
    });
  }

  function boot(){
    render();
    document.addEventListener('click',event=>{
      const menu=event.target.closest?.('.menu-item[data-page="student-links"]');
      if(menu)setTimeout(render,0);
    },false);
    ['google-sheets-data-ready','data-changed','students-updated','records-updated','class-data-updated'].forEach(ev=>window.addEventListener(ev,()=>setTimeout(render,0),false));
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
