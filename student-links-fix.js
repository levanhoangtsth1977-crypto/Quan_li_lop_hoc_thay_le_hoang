/* STUDENT WEBSITE LINK 2.0
 * The "Link học sinh" menu represents the shared student-facing website URL.
 * It must NOT generate one URL per student.
 * Student-specific profile URLs remain available only through student profile/deep-link features.
 */
(function(){
  'use strict';
  const VERSION='2.0.0';
  const PAGE_SELECTORS='[data-page-section="student-links"],#page-student-links';

  function findPage(){
    return document.querySelector(PAGE_SELECTORS)
      || Array.from(document.querySelectorAll('section'))
        .find(el=>/\bLink học sinh\b/i.test(el.textContent||''));
  }

  function sharedWebsiteUrl(){
    const u=new URL(window.location.href);
    u.search='';
    u.hash='';
    return u.href;
  }

  function copyText(value){
    if(navigator.clipboard&&navigator.clipboard.writeText){
      return navigator.clipboard.writeText(value);
    }
    const ta=document.createElement('textarea');
    ta.value=value;ta.setAttribute('readonly','');
    ta.style.position='fixed';ta.style.opacity='0';
    document.body.appendChild(ta);ta.select();
    try{document.execCommand('copy');}finally{ta.remove();}
    return Promise.resolve();
  }

  function render(){
    const page=findPage();
    if(!page)return;

    const url=sharedWebsiteUrl();
    page.innerHTML=`
      <div class="page-header">
        <div>
          <span class="page-eyebrow"><i class="fa-solid fa-link"></i> Truy cập học sinh</span>
          <h1>Link học sinh</h1>
          <p>Đây là <strong>một link website chung</strong> để học sinh truy cập hệ thống. Không tạo link riêng theo từng học sinh.</p>
        </div>
      </div>
      <section class="dashboard-panel" style="margin-top:18px">
        <div class="panel-header">
          <div>
            <h3>🌐 Link website dùng chung</h3>
            <p>Gửi cùng một đường dẫn này cho tất cả học sinh trong lớp 5A3.</p>
          </div>
        </div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-top:16px">
          <input id="lhSharedStudentWebsiteUrl" type="text" readonly value="${escapeHtml(url)}" style="flex:1;min-width:220px;padding:11px 13px;border:1px solid #dbe3ef;border-radius:10px;background:#f8fafc">
          <button type="button" class="button secondary" id="lhCopySharedStudentWebsite"><i class="fa-solid fa-copy"></i> Sao chép link</button>
          <a class="button primary" id="lhOpenSharedStudentWebsite" href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer"><i class="fa-solid fa-arrow-up-right-from-square"></i> Mở trang web</a>
        </div>
        <div style="margin-top:12px;padding:10px 12px;border-radius:10px;background:#f8fafc;color:#64748b;font-size:13px">
          <strong>Phạm vi:</strong> link trên là link website chung. Việc xem dữ liệu riêng của từng học sinh, nếu được dùng, phải đi qua cơ chế hồ sơ riêng và không được thay đổi link website chung.
        </div>
      </section>`;

    const copyBtn=page.querySelector('#lhCopySharedStudentWebsite');
    if(copyBtn&&!copyBtn.dataset.bound){
      copyBtn.dataset.bound='1';
      copyBtn.addEventListener('click',()=>{
        copyText(url).then(()=>{
          if(typeof window.showToast==='function')window.showToast('Đã sao chép link website học sinh','success');
        }).catch(()=>{
          if(typeof window.showToast==='function')window.showToast('Không thể sao chép link.','error');
        });
      });
    }
    console.info(`[StudentWebsiteLink ${VERSION}] shared URL ready`);
  }

  function escapeHtml(v){
    return String(v).replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  }

  function boot(){
    render();
    window.addEventListener('pageshow',render,{once:true});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
  window.__LH_STUDENT_SHARED_WEBSITE_URL__=sharedWebsiteUrl;
  window.__LH_STUDENT_LINK_VERSION__=VERSION;
})();