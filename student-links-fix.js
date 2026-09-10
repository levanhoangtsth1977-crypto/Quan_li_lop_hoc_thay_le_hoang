/* STUDENT LINKS 6.0 — shared website URL
 * Menu “Link học sinh” quản lý 01 link website dùng chung cho cả lớp.
 * Không tạo link riêng theo studentId tại menu này.
 * Deep-link cá nhân (nếu hệ thống cần) do cơ chế hồ sơ riêng quản lý.
 */
(function(){
  'use strict';
  if(window.__LH_STUDENT_LINKS_SHARED_60__) return;
  window.__LH_STUDENT_LINKS_SHARED_60__=true;

  const PAGE_SELECTOR='#page-student-links,[data-page-section="student-links"]';
  const CACHE_KEY='__LH_SHARED_STUDENT_WEBSITE_URL__';

  function baseUrl(){
    try{
      const u=new URL(window.location.href);
      u.search='';
      u.hash='';
      return u.href;
    }catch{return window.location.href.split('?')[0].split('#')[0];}
  }
  function esc(v){return String(v??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}
  function toast(message,type='info'){if(typeof window.showToast==='function')window.showToast(message,type);else console.info(message);}

  async function copyText(value){
    if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(value);return;}
    const ta=document.createElement('textarea');
    ta.value=value;ta.readOnly=true;ta.style.position='fixed';ta.style.left='-9999px';
    document.body.appendChild(ta);ta.select();
    if(!document.execCommand('copy'))throw new Error('copy_failed');
    ta.remove();
  }

  function render(){
    const page=document.querySelector(PAGE_SELECTOR);
    if(!page)return;
    const url=baseUrl();
    try{sessionStorage.setItem(CACHE_KEY,url);}catch{}
    page.innerHTML=`
      <div class="page-header">
        <div>
          <span class="page-eyebrow"><i class="fa-solid fa-link"></i> Website dùng chung</span>
          <h1>Link học sinh</h1>
          <p>Một đường link website dùng chung cho học sinh và phụ huynh truy cập hệ thống.</p>
        </div>
      </div>
      <div class="info-banner">
        <i class="fa-solid fa-shield-halved"></i>
        <div>
          <strong>🌐 Link website dùng chung</strong>
          <p>Đây là đường dẫn chung của hệ thống. Không tạo link riêng theo từng học sinh tại mục này.</p>
        </div>
      </div>
      <section class="dashboard-panel" id="sharedStudentWebsitePanel">
        <div class="panel-header">
          <div>
            <h3>Đường dẫn website lớp</h3>
            <p>Học sinh/phụ huynh dùng cùng một địa chỉ để truy cập website.</p>
          </div>
        </div>
        <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
          <input id="sharedStudentWebsiteUrl" type="text" readonly value="${esc(url)}" aria-label="Link website dùng chung">
          <button type="button" class="button secondary" id="copySharedStudentWebsite"><i class="fa-solid fa-copy"></i> Sao chép link</button>
          <a class="button primary" id="openSharedStudentWebsite" href="${esc(url)}" target="_blank" rel="noopener noreferrer"><i class="fa-solid fa-arrow-up-right-from-square"></i> Mở website</a>
        </div>
      </section>`;

    const copyBtn=document.getElementById('copySharedStudentWebsite');
    if(copyBtn)copyBtn.addEventListener('click',async()=>{
      try{await copyText(url);toast('Đã sao chép link website dùng chung.','success');}
      catch{toast('Không thể sao chép link.','error');}
    });
  }

  function boot(){
    render();
    document.addEventListener('click',event=>{
      const menu=event.target.closest?.('.menu-item[data-page="student-links"]');
      if(menu)setTimeout(render,0);
    },false);
    window.addEventListener('google-sheets-data-ready',()=>setTimeout(render,0),false);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();