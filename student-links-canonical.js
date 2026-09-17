/* STUDENT LINKS CANONICAL 1.0
 * Active Link học sinh page only.
 * Reconciles the visible links against the current Google HOC_SINH roster.
 * Does not change routing, storage, or any other menu.
 * 1 student = 1 canonical URL: /student-profile-v5.html?t=<SHA-256>
 */
(function(){
  'use strict';
  if(window.__LH_STUDENT_LINKS_CANONICAL_10__)return;
  window.__LH_STUDENT_LINKS_CANONICAL_10__=true;

  const PREFIX='LH_STUDENT_PROFILE_V3|2026-2027|5A3|';
  const ROSTER_TTL=60*1000;
  let rosterCache=null;
  let rosterAt=0;
  let queued=false;
  let running=false;

  const clean=v=>String(v??'').trim().replace(/\s+/g,' ');
  const fold=v=>clean(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').toLocaleLowerCase('vi');
  const esc=v=>clean(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\"/g,'&quot;').replace(/'/g,'&#039;');

  function onLinksPage(){
    return (location.hash||'').split('?')[0]==='#links' || !!document.getElementById('linkRows');
  }

  async function getRoster(){
    const now=Date.now();
    if(rosterCache && now-rosterAt<ROSTER_TTL)return rosterCache;
    const r=await fetch('/api/google?action=get_students&_='+now,{cache:'no-store',credentials:'same-origin'});
    const d=await r.json().catch(()=>null);
    if(!r.ok||!d?.ok||!Array.isArray(d.students))throw Error(d?.error||'Không lấy được danh sách học sinh từ Google Sheets.');
    rosterCache=d.students.filter(s=>clean(s?.id)&&clean(s?.name));
    rosterAt=now;
    return rosterCache;
  }

  async function tokenFor(id){
    if(!window.crypto?.subtle||!window.TextEncoder)throw Error('Trình duyệt không hỗ trợ tạo liên kết hồ sơ an toàn.');
    const bytes=new TextEncoder().encode(PREFIX+clean(id));
    const digest=await crypto.subtle.digest('SHA-256',bytes);
    return Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
  }

  function canonicalUrl(token){
    return new URL('student-profile-v5.html?t='+encodeURIComponent(token),window.location.href).href;
  }

  async function repair(){
    if(running||!onLinksPage())return;
    const tbody=document.getElementById('linkRows');
    if(!tbody)return;
    const rows=Array.from(tbody.querySelectorAll(':scope > tr')).filter(tr=>tr.children.length>=4);
    if(!rows.length)return;
    running=true;
    try{
      const roster=await getRoster();
      const byName=new Map(roster.map(s=>[fold(s.name),s]));
      await Promise.all(rows.map(async tr=>{
        const name=clean(tr.children[1]?.textContent||'');
        const remote=byName.get(fold(name));
        const linkCell=tr.children[2];
        const actionCell=tr.children[3];
        if(!remote||!linkCell||!actionCell)return;
        const token=await tokenFor(remote.id);
        const url=canonicalUrl(token);
        if(tr.dataset.lhCanonicalUrl===url)return;
        tr.dataset.lhCanonicalUrl=url;
        tr.dataset.lhCanonicalStudentId=clean(remote.id);
        linkCell.innerHTML='<a class="link-url" href="'+esc(url)+'" target="_blank" rel="noopener" title="'+esc(url)+'">🔗 Link cá nhân</a>';
        actionCell.innerHTML='<div class="link-actions"><button class="mini" data-action="copy-link" data-url="'+esc(url)+'">Sao chép</button><a class="mini" href="'+esc(url)+'" target="_blank" rel="noopener">Mở</a></div>';
      }));
    }catch(e){
      console.warn('[student-links-canonical]',e?.message||e);
    }finally{
      running=false;
    }
  }

  function schedule(){
    if(queued)return;
    queued=true;
    setTimeout(()=>{
      queued=false;
      void repair();
    },60);
  }

  function boot(){
    schedule();
    window.addEventListener('hashchange',schedule,{passive:true});
    const main=document.getElementById('mainContent');
    if(main){
      const mo=new MutationObserver(schedule);
      mo.observe(main,{childList:true,subtree:true});
    }
    window.addEventListener('google-sheets-data-ready',()=>{rosterCache=null;rosterAt=0;schedule()},{passive:true});
    window.addEventListener('data-changed',schedule,{passive:true});
    window.addEventListener('students-updated',schedule,{passive:true});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
