/* STUDENT LINKS FAST FIX 2.0 — single-owner exact links + fast open
 * - Link cá nhân luôn gắn đúng studentId của từng dòng.
 * - Sao chép dùng đúng URL đang hiển thị của chính dòng đó.
 * - Xem hồ sơ truyền thêm sid để student-profile.html không phải duyệt toàn bộ 42 HS.
 * - Tạo token song song và cache theo studentId.
 * - Không can thiệp router/menu khác.
 */
(function(){
  'use strict';
  if(window.__LH_STUDENT_LINKS_FAST_FIX_20__) return;
  window.__LH_STUDENT_LINKS_FAST_FIX_20__=true;
  window.__LH_STUDENT_LINKS_SINGLE_OWNER__=true;

  const TOKEN_PREFIX='LH_STUDENT_PROFILE_V3|2026-2027|5A3|';
  const PROFILE_PAGE='student-profile.html';
  const clean=v=>String(v??'').trim().replace(/\s+/g,' ');
  const esc=v=>clean(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  const cache=new Map();

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
    const key=clean(id);
    if(cache.has(key)) return cache.get(key);
    if(!window.crypto?.subtle||!window.TextEncoder) throw Error('Trình duyệt không hỗ trợ liên kết hồ sơ an toàn.');
    const raw=TOKEN_PREFIX+key;
    const d=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(raw));
    const value=Array.from(new Uint8Array(d),b=>b.toString(16).padStart(2,'0')).join('');
    cache.set(key,value);
    return value;
  }

  async function urlFor(id){
    const u=new URL(PROFILE_PAGE,window.location.href);
    u.search='';u.hash='';
    u.searchParams.set('sid',clean(id));
    u.searchParams.set('t',await token(id));
    return u.href;
  }

  async function copy(text){
    const value=String(text||'');
    if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(value);return true;}
    const ta=document.createElement('textarea');
    ta.value=value;ta.readOnly=true;ta.style.position='fixed';ta.style.left='-9999px';
    document.body.appendChild(ta);ta.focus();ta.select();
    const ok=document.execCommand('copy');ta.remove();
    if(!ok)throw Error('Không thể sao chép tự động.');
    return true;
  }

  function toast(msg,type){
    if(typeof window.showToast==='function')window.showToast(msg,type||'info');
    else if(typeof window.toast==='function')window.toast(msg,type||'info');
    else console.info(msg);
  }

  function page(){return document.querySelector('#page-student-links');}

  async function render(){
    const p=page();if(!p)return;
    const list=getStudents().filter(s=>clean(s?.id)&&clean(s?.name));
    const body=document.getElementById('studentLinksTableBody');
    if(!body)return;

    if(!list.length){
      body.innerHTML='<tr><td colspan="4"><div class="empty-state"><strong>Chưa có học sinh</strong></div></td></tr>';
      return;
    }

    /* Render tên trước để giao diện hiện ngay; link điền vào sau. */
    body.innerHTML=list.map((s,i)=>`<tr data-student-id="${esc(s.id)}"><td>${i+1}</td><td><strong>${esc(s.name)}</strong></td><td><input type="text" readonly data-student-url-input value="Đang tạo link…" aria-label="Link hồ sơ ${esc(s.name)}"></td><td><div class="student-link-actions"><button type="button" class="button secondary" data-copy-student-link-fast="${esc(s.id)}" disabled><i class="fa-solid fa-copy"></i> Sao chép</button><a class="button primary" data-open-student-link-fast href="#"><i class="fa-solid fa-arrow-up-right-from-square"></i> Xem hồ sơ</a></div></td></tr>`).join('');

    const urls=await Promise.all(list.map(async s=>({id:clean(s.id),url:await urlFor(s.id)})));
    urls.forEach(item=>{
      const tr=body.querySelector(`tr[data-student-id="${CSS.escape(item.id)}"]`);
      if(!tr)return;
      const input=tr.querySelector('[data-student-url-input]');
      const copyBtn=tr.querySelector('[data-copy-student-link-fast]');
      const openBtn=tr.querySelector('[data-open-student-link-fast]');
      if(input)input.value=item.url;
      if(copyBtn){copyBtn.disabled=false;copyBtn.dataset.url=item.url;}
      if(openBtn)openBtn.href=item.url;
    });

    body.querySelectorAll('[data-copy-student-link-fast]').forEach(btn=>{
      btn.addEventListener('click',async()=>{
        const url=btn.dataset.url||btn.closest('tr')?.querySelector('[data-student-url-input]')?.value;
        if(!url||url==='Đang tạo link…'){toast('Link chưa sẵn sàng, vui lòng chờ một chút.','warning');return;}
        try{await copy(url);toast('Đã sao chép đúng link của học sinh này.','success')}
        catch(e){toast(e?.message||'Không thể sao chép link.','error')}
      });
    });
  }

  function boot(){
    if(!window.__LH_STUDENT_LINKS_SINGLE_OWNER__)window.__LH_STUDENT_LINKS_SINGLE_OWNER__=true;
    render();
    window.addEventListener('google-sheets-data-ready',()=>setTimeout(render,0));
    window.addEventListener('students-updated',()=>setTimeout(render,0));
    window.addEventListener('data-changed',()=>setTimeout(render,0));
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
