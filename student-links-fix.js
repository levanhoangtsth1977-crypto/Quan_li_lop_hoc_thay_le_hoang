/* STUDENT WEBSITE LINK 2.1
 * "Link học sinh" = ONE shared website URL for the whole class.
 * Student-specific deep links remain owned by student-profile features.
 */
(function(){
  'use strict';
  const VERSION='2.1.0';
  const SELECTOR='[data-page-section="student-links"],#page-student-links';

  function findPage(){
    return document.querySelector(SELECTOR)
      || Array.from(document.querySelectorAll('section')).find(el=>{
        const h=el.querySelector('h1,h2,h3');
        return /^\s*Link học sinh\s*$/i.test((h?.textContent||'').trim());
      });
  }

  function sharedUrl(){
    const u=new URL(window.location.href);
    u.search='';
    u.hash='';
    return u.href;
  }

  function esc(v){
    return String(v).replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  }

  async function copyText(value){
    if(navigator.clipboard?.writeText){
      await navigator.clipboard.writeText(value);
      return;
    }
    const ta=document.createElement('textarea');
    ta.value=value;
    ta.setAttribute('readonly','');
    ta.style.position='fixed';
    ta.style.left='-9999px';
    document.body.appendChild(ta);
    ta.select();
    if(!document.execCommand('copy')) throw new Error('copy_failed');
    ta.remove();
  }

  function toast(msg,type){
    if(typeof window.showToast==='function') window.showToast(msg,type);
  }

  function render(){
    const page=findPage();
    if(!page) return;
    const url=sharedUrl();

    page.innerHTML=`
      <div class="page-header">
        <div>
          <span class="page-eyebrow"><i class="fa-solid fa-link"></i> Truy cập học sinh</span>
          <h1>Link học sinh</h1>
          <p>Đường dẫn website dùng chung cho toàn bộ học sinh lớp 5A3.</p>
        </div>
      </div>
      <section class="dashboard-panel" style="margin-top:18px">
        <div class="panel-header">
          <div>
            <h3>🌐 Link website dùng chung</h3>
            <p>Tất cả học sinh sử dụng cùng một đường dẫn này để truy cập website.</p>
          </div>
        </div>
        <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-top:16px">
          <input id="lhSharedStudentWebsiteUrl" type="text" readonly value="${esc(url)}" aria-label="Link website học sinh dùng chung" style="flex:1;min-width:220px;padding:11px 13px;border:1px solid #dbe3ef;border-radius:10px;background:#f8fafc">
          <button type="button" class="button secondary" id="lhCopySharedStudentWebsite"><i class="fa-solid fa-copy"></i> Sao chép link</button>
          <a class="button primary" id="lhOpenSharedStudentWebsite" href="${esc(url)}" target="_blank" rel="noopener noreferrer"><i class="fa-solid fa-arrow-up-right-from-square"></i> Mở website</a>
        </div>
        <div style="margin-top:14px;padding:11px 13px;border-radius:10px;background:#f8fafc;color:#64748b;font-size:13px">
          <strong>Chú ý:</strong> đây là <strong>một link website chung</strong>, không phải 42 link riêng. Các link hồ sơ cá nhân, nếu có, chỉ được sử dụng tại khu vực hồ sơ học sinh.
        </div>
      </section>`;

    const btn=page.querySelector('#lhCopySharedStudentWebsite');
    btn?.addEventListener('click',async()=>{
      try{await copyText(url);toast('Đã sao chép link website học sinh dùng chung','success');}
      catch(_){toast('Không thể sao chép link','error');}
    },{once:true});

    window.__LH_STUDENT_SHARED_WEBSITE_URL__=url;
    window.__LH_STUDENT_LINK_VERSION__=VERSION;
    console.info(`[StudentWebsiteLink ${VERSION}] shared URL ready`,url);
  }

  function boot(){
    render();
    window.addEventListener('pageshow',render,{once:true});
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();