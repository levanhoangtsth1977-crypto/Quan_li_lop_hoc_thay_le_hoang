/* STUDENT LINKS SHARED OVERRIDE 1.0
 * Canonical rule: menu Link học sinh = one shared website URL.
 * Overrides any legacy private-link renderer without touching student records.
 */
(function(){
  'use strict';
  if(window.__LH_STUDENT_LINKS_SHARED_OVERRIDE_10__) return;
  window.__LH_STUDENT_LINKS_SHARED_OVERRIDE_10__=true;

  function cleanUrl(){
    const u=new URL(window.location.href);
    u.search='';
    u.hash='';
    return u.href;
  }
  function toast(message,type='info'){
    if(typeof window.showToast==='function') window.showToast(message,type);
    else console.info(message);
  }
  async function copyText(value){
    if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(value);return;}
    const ta=document.createElement('textarea');ta.value=value;ta.readOnly=true;ta.style.position='fixed';ta.style.left='-9999px';document.body.appendChild(ta);ta.select();if(!document.execCommand('copy'))throw new Error('copy_failed');ta.remove();
  }
  function render(){
    const page=document.querySelector('#page-student-links,[data-page-section="student-links"]');
    if(!page)return;
    const url=cleanUrl();
    page.innerHTML=`<div class="page-header"><div><span class="page-eyebrow"><i class="fa-solid fa-link"></i> Truy cập website</span><h1>Link học sinh</h1><p>Website dùng chung cho học sinh và phụ huynh lớp 5A3. Tất cả sử dụng cùng một địa chỉ website.</p></div></div><div class="info-banner"><i class="fa-solid fa-globe"></i><div><strong>🌐 Một link website dùng chung</strong><p>Không tạo link riêng theo từng học sinh tại mục này. Liên kết cá nhân, nếu có, được quản lý độc lập ở hồ sơ học sinh.</p></div></div><section class="dashboard-panel" id="sharedStudentWebsiteLinkPanel"><div class="panel-header"><div><h3>Website lớp 5A3</h3><p>Địa chỉ website hiện tại của hệ thống quản lý lớp học.</p></div></div><div style="display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:center"><input id="sharedStudentWebsiteLink" type="text" readonly value="${url.replace(/"/g,'&quot;')}" aria-label="Link website dùng chung"><div style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" class="button secondary" id="copySharedStudentWebsiteLink"><i class="fa-solid fa-copy"></i> Sao chép</button><a class="button primary" href="${url.replace(/"/g,'&quot;')}" target="_blank" rel="noopener noreferrer"><i class="fa-solid fa-arrow-up-right-from-square"></i> Mở website</a></div></div></section>`;
    document.getElementById('copySharedStudentWebsiteLink')?.addEventListener('click',async()=>{try{await copyText(url);toast('Đã sao chép link website dùng chung.','success')}catch{toast('Không thể sao chép link website.','error')}});
    window.__LH_STUDENT_LINK_MODE__='shared';
  }
  function boot(){
    render();
    document.addEventListener('click',e=>{if(e.target.closest?.('.menu-item[data-page="student-links"]'))setTimeout(render,0)},false);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
