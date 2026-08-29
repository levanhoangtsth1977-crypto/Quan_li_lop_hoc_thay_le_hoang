/* QUẢN LÝ LỚP HỌC THẦY LÊ HOÀNG
 * STUDENT PRIVATE LINKS 3.4.0
 * 1 học sinh = 1 link riêng dạng student-profile-v5.html?t=TOKEN
 */
(function () {
  'use strict';
  const VERSION='3.4.0';
  const PAGE_SELECTOR='#page-student-links,[data-page-section="student-links"]';
  const PROFILE_PATH='student-profile-v5.html';
  const SCHOOL_YEAR='2026-2027';
  const CLASS_NAME='5A3';
  const TOKEN_PREFIX=`LH_STUDENT_PROFILE_V3|${SCHOOL_YEAR}|${CLASS_NAME}|`;
  const MAX_RETRIES=40;
  const RETRY_MS=500;
  const esc=v=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
  const clean=v=>String(v??'').trim().replace(/\s+/g,' ');
  let retryTimer=null,retryCount=0;
  function getRoster(){
    const google=Array.isArray(window.GOOGLE_SHEETS_STUDENTS)?window.GOOGLE_SHEETS_STUDENTS:[];
    let app=[];try{if(typeof window.getStudentsSafe==='function'){const x=window.getStudentsSafe();if(Array.isArray(x))app=x}}catch(_){}
    if(!app.length&&Array.isArray(window.students))app=window.students;
    const source=google.length?google:app,seen=new Set();
    return source.map((item,index)=>({...item,id:clean(item?.id),name:clean(item?.name||item?.studentName),_stt:Number(item?.stt)||index+1}))
      .filter(item=>item.id&&item.name&&!seen.has(item.id)&&seen.add(item.id)).sort((a,b)=>a._stt-b._stt);
  }
  async function tokenForStudent(id){
    const raw=TOKEN_PREFIX+clean(id);
    if(window.crypto?.subtle){const bytes=new TextEncoder().encode(raw);const digest=await crypto.subtle.digest('SHA-256',bytes);return [...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,'0')).join('')}
    let h1=2166136261,h2=2166136261;for(let i=0;i<raw.length;i++){const c=raw.charCodeAt(i);h1^=c;h1=Math.imul(h1,16777619);h2^=c+i;h2=Math.imul(h2,16777619)}return (h1>>>0).toString(16).padStart(8,'0')+(h2>>>0).toString(16).padStart(8,'0')+clean(id).length.toString(16).padStart(4,'0');
  }
  function toast(message,type='info'){if(typeof window.showToast==='function')window.showToast(message,type);else console.info(message)}
  async function copyText(value){if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(value);return}const ta=document.createElement('textarea');ta.value=value;ta.setAttribute('readonly','');ta.style.position='fixed';ta.style.left='-9999px';document.body.appendChild(ta);ta.select();if(!document.execCommand('copy'))throw new Error('copy_failed');ta.remove()}
  function showLoading(page){page.innerHTML='<div class="page-header"><div><span class="page-eyebrow"><i class="fa-solid fa-link"></i> Truy cập học sinh</span><h1>Link học sinh</h1><p>Đang đồng bộ danh sách học sinh...</p></div></div><div class="info-banner"><i class="fa-solid fa-spinner fa-spin"></i><div><strong>Đang tải dữ liệu</strong><p>Hệ thống đang lấy danh sách lớp 5A3 từ nguồn dữ liệu chung.</p></div></div>'}
  async function render(){
    const page=document.querySelector(PAGE_SELECTOR);if(!page)return;const roster=getRoster();
    if(!roster.length){showLoading(page);retryLoad();return}
    retryCount=0;if(retryTimer){clearTimeout(retryTimer);retryTimer=null}
    const rows=await Promise.all(roster.map(async(student,index)=>{const token=await tokenForStudent(student.id);const url=new URL(PROFILE_PATH,window.location.href);url.searchParams.set('t',token);return `<div class="student-link-item" data-student-row><div class="student-link-info"><span class="student-link-index">${index+1}</span><div><strong>${esc(student.name)}</strong><small>${esc(student.studentCode||'')}</small></div></div><input type="text" readonly value="${esc(url.href)}" aria-label="Link cá nhân của ${esc(student.name)}"><div class="student-link-actions"><button type="button" class="button secondary" data-copy-private-link="${esc(url.href)}"><i class="fa-solid fa-copy"></i> Sao chép</button><a class="button primary" href="${esc(url.href)}" target="_blank" rel="noopener noreferrer"><i class="fa-solid fa-arrow-up-right-from-square"></i> Mở</a></div></div>`}));
    page.innerHTML=`<div class="page-header"><div><span class="page-eyebrow"><i class="fa-solid fa-link"></i> Truy cập học sinh</span><h1>Link học sinh</h1><p>Mỗi học sinh có <strong>01 link cá nhân riêng</strong>. Mở link là vào thẳng hồ sơ của đúng học sinh đó.</p></div></div><div class="info-banner"><i class="fa-solid fa-shield-halved"></i><div><strong>${roster.length} học sinh · ${roster.length} link cá nhân</strong><p>Token được tạo theo đúng năm học 2026–2027 và lớp 5A3.</p></div></div><div class="student-links-toolbar"><input id="privateStudentLinkSearch" type="search" placeholder="🔎 Tìm học sinh để lấy link..." autocomplete="off"></div><div class="student-links-list" id="privateStudentLinksList">${rows.join('')}</div>`;
    const list=page.querySelector('#privateStudentLinksList'),search=page.querySelector('#privateStudentLinkSearch');
    search?.addEventListener('input',()=>{const key=clean(search.value).toLocaleLowerCase('vi');list?.querySelectorAll('[data-student-row]').forEach(row=>row.hidden=!!key&&!clean(row.textContent).toLocaleLowerCase('vi').includes(key))});
    list?.addEventListener('click',async event=>{const btn=event.target.closest('[data-copy-private-link]');if(!btn)return;try{await copyText(btn.dataset.copyPrivateLink||'');toast('Đã sao chép link cá nhân học sinh.','success')}catch{toast('Không thể sao chép link.','error')}});
    window.__LH_PRIVATE_STUDENT_LINK_VERSION__=VERSION;
  }
  function retryLoad(){if(retryTimer||retryCount>=MAX_RETRIES)return;retryCount+=1;try{if(typeof window.loadGoogleSheetsMenuData==='function')window.loadGoogleSheetsMenuData()}catch(_){}retryTimer=setTimeout(()=>{retryTimer=null;render().catch(()=>{})},RETRY_MS)}
  function boot(){render();window.addEventListener('google-sheets-data-ready',render);document.addEventListener('click',event=>{const menu=event.target.closest('.menu-item[data-page="student-links"]');if(menu){retryCount=0;setTimeout(()=>render(),0)}});window.addEventListener('pageshow',()=>setTimeout(render,0),{once:true})}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();