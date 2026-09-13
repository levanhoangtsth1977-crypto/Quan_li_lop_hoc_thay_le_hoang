/* STUDENT LINKS FAST FIX 1.0
 * Tạo link cá nhân song song, giảm thời gian chờ.
 * Mỗi nút Sao chép luôn tạo lại đúng link theo studentId của dòng.
 * Không sửa router/menu khác.
 */
(function(){
  'use strict';
  if(window.__LH_STUDENT_LINKS_FAST_FIX_10__) return;
  window.__LH_STUDENT_LINKS_FAST_FIX_10__=true;

  const TOKEN_PREFIX='LH_STUDENT_PROFILE_V3|2026-2027|5A3|';
  const PROFILE_PAGE='student-profile.html';
  const clean=v=>String(v??'').trim().replace(/\s+/g,' ');
  const esc=v=>clean(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  const getStudents=()=>{
    try{
      const a=typeof window.getGoogleStudentRoster==='function'?window.getGoogleStudentRoster():null;
      if(Array.isArray(a)&&a.length)return a;
      if(Array.isArray(window.GOOGLE_SHEETS_STUDENTS)&&window.GOOGLE_SHEETS_STUDENTS.length)return window.GOOGLE_SHEETS_STUDENTS;
      if(typeof window.getStudentsSafe==='function'){const b=window.getStudentsSafe();if(Array.isArray(b)&&b.length)return b;}
      return Array.isArray(window.students)?window.students:[];
    }catch(_){return[]}
  };
  async function token(id){
    const raw=TOKEN_PREFIX+clean(id);
    const d=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(raw));
    return Array.from(new Uint8Array(d),b=>b.toString(16).padStart(2,'0')).join('');
  }
  async function urlFor(id){
    const u=new URL(PROFILE_PAGE,window.location.href);u.search='';u.hash='';u.searchParams.set('t',await token(id));return u.href;
  }
  async function copy(text){
    if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(text);return;}
    const ta=document.createElement('textarea');ta.value=text;ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.focus();ta.select();if(!document.execCommand('copy'))throw Error('Không thể sao chép tự động.');ta.remove();
  }
  async function render(){
    const page=document.querySelector('#page-student-links');if(!page)return;
    const list=getStudents().filter(s=>clean(s?.id)&&clean(s?.name));
    const body=document.getElementById('studentLinksTableBody');
    if(!body)return;
    body.innerHTML='<tr><td colspan="4"><div class="empty-state"><strong>Đang chuẩn bị link…</strong><p>Các link được tạo song song để tải nhanh hơn.</p></div></td></tr>';
    if(!list.length){body.innerHTML='<tr><td colspan="4"><div class="empty-state"><strong>Chưa có học sinh</strong></div></td></tr>';return;}
    const urls=await Promise.all(list.map(async s=>({s,url:await urlFor(s.id)})));
    body.innerHTML=urls.map((x,i)=>`<tr><td>${i+1}</td><td><strong>${esc(x.s.name)}</strong></td><td><input type="text" readonly value="${esc(x.url)}" aria-label="Link hồ sơ ${esc(x.s.name)}"></td><td><div class="student-link-actions"><button type="button" class="button secondary" data-copy-student-link-fast="${esc(x.s.id)}"><i class="fa-solid fa-copy"></i> Sao chép</button><a class="button primary" href="${esc(x.url)}" target="_blank" rel="noopener noreferrer"><i class="fa-solid fa-arrow-up-right-from-square"></i> Xem hồ sơ</a></div></td></tr>`).join('');
    body.querySelectorAll('[data-copy-student-link-fast]').forEach(btn=>btn.addEventListener('click',async()=>{
      const id=btn.getAttribute('data-copy-student-link-fast');
      try{const url=await urlFor(id);await copy(url);if(typeof window.showToast==='function')window.showToast('Đã sao chép đúng link hồ sơ của học sinh.','success');}catch(e){if(typeof window.showToast==='function')window.showToast(e?.message||'Không thể sao chép link.','error');}
    }));
  }
  function boot(){render();window.addEventListener('google-sheets-data-ready',()=>setTimeout(render,0));window.addEventListener('students-updated',()=>setTimeout(render,0));}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
