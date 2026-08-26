/* STUDENT PROFILE MENU 2.0 — PROFILE + ROBUST STUDENT PICKER */
(function(){
'use strict';
if(window.__LH_STUDENT_PROFILE_MENU_20__)return;
window.__LH_STUDENT_PROFILE_MENU_20__=true;
const $=id=>document.getElementById(id);
const clean=v=>String(v??'').trim().replace(/\s+/g,' ');
const esc=v=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
function arr(name){return Array.isArray(window[name])?window[name]:[]}
function students(){
 const g=window.GOOGLE_SHEETS_STUDENTS;
 if(Array.isArray(g)&&g.length)return g;
 const s=window.students;
 if(Array.isArray(s)&&s.length)return s;
 return Array.isArray(window.__LH_PROFILE_FALLBACK_STUDENTS__)?window.__LH_PROFILE_FALLBACK_STUDENTS__:[];
}
function getEvents(tab,name){const g=window.GOOGLE_SHEET_DATA?.tabs?.[tab];if(Array.isArray(g))return g;return arr(name)}
let rosterLoading=null;
async function ensureRoster(){
 if(students().length)return students();
 if(rosterLoading)return rosterLoading;
 rosterLoading=fetch('DANH_SACH_HOC_SINH_5C_2026_2027.json',{cache:'no-store'})
  .then(r=>{if(!r.ok)throw new Error('Không tải được danh sách học sinh');return r.json()})
  .then(data=>{
    const list=Array.isArray(data?.students)?data.students:[];
    const normalized=list.map((s,i)=>({...s,id:clean(s.id||s.studentCode||('HS'+String(i+1).padStart(2,'0')))}));
    window.__LH_PROFILE_FALLBACK_STUDENTS__=normalized;
    if(!Array.isArray(window.students)||!window.students.length)window.students=normalized;
    return normalized;
  })
  .catch(()=>students())
  .finally(()=>{rosterLoading=null});
 return rosterLoading;
}
function resetDetail(){
 const box=$('lhProfileDetail');
 if(!box)return;
 box.innerHTML='<div class="empty-state"><span class="empty-icon"><i class="fa-solid fa-user-graduate"></i></span><strong>Chọn một học sinh</strong><p>Hồ sơ chi tiết sẽ hiển thị tại đây.</p></div>';
}
function pickerState(){return window.__LH_PROFILE_PICKER_STATE__||(window.__LH_PROFILE_PICKER_STATE__={open:false})}
function closePicker(){const p=$('lhProfilePickerPanel');const a=$('lhProfilePickerArrow');if(p)p.hidden=true;if(a)a.textContent='▾';pickerState().open=false}
function selectProfile(id){
 const sid=clean(id);if(!sid)return;
 const label=$('lhProfilePickerLabel');
 const st=students().find(s=>clean(s.id)===sid);
 const value=st?clean(st.name):'Chọn học sinh';
 const hidden=$('profileStudent');if(hidden)hidden.value=sid;
 if(label)label.textContent=value;
 closePicker();
 renderProfile(sid);
}
function renderPicker(){
 const panel=$('lhProfilePickerPanel'),label=$('lhProfilePickerLabel');
 if(!panel||!label)return;
 const list=students();
 panel.replaceChildren();
 const head=document.createElement('div');head.className='lh-profile-picker-search';head.innerHTML='<i class="fa-solid fa-magnifying-glass"></i><input id="lhProfilePickerSearch" type="search" placeholder="Tìm học sinh..." autocomplete="off">';panel.appendChild(head);
 const items=document.createElement('div');items.id='lhProfilePickerItems';items.className='lh-profile-picker-items';panel.appendChild(items);
 const draw=q=>{
  const key=clean(q).toLocaleLowerCase('vi');
  const filtered=list.filter(s=>!key||clean(s.name).toLocaleLowerCase('vi').includes(key));
  items.innerHTML=filtered.map((s,i)=>`<button type="button" class="lh-profile-picker-option" data-id="${esc(s.id)}"><span class="picker-index">${i+1}</span><span>${esc(s.name)}</span></button>`).join('')||'<div class="lh-profile-picker-empty">Không tìm thấy học sinh</div>';
  items.querySelectorAll('[data-id]').forEach(b=>b.addEventListener('click',()=>selectProfile(b.dataset.id)));
 };
 const search=$('lhProfilePickerSearch');
 if(search)search.addEventListener('input',()=>draw(search.value));
 draw('');
}
function syncPicker(){
 const label=$('lhProfilePickerLabel'),hidden=$('profileStudent');
 if(!label)return;
 const sid=clean(hidden?.value);
 const st=students().find(s=>clean(s.id)===sid);
 label.textContent=st?clean(st.name):'Chọn học sinh';
 renderPicker();
}
function ensureMenu(){
 const nav=document.querySelector('.main-menu');
 if(!nav||document.getElementById('lhStudentProfileMenu'))return;
 const anchor=[...nav.querySelectorAll('.menu-item')].find(x=>x.dataset?.page==='students');
 const b=document.createElement('button');
 b.type='button';b.className='menu-item';b.id='lhStudentProfileMenu';b.dataset.page='student-profiles';
 b.innerHTML='<i class="fa-solid fa-id-card"></i><span>Hồ sơ học sinh</span>';
 if(anchor)anchor.insertAdjacentElement('afterend',b);else nav.prepend(b);
 b.addEventListener('click',openPage);
}
function ensurePage(){
 const main=$('mainContent');
 if(!main)return;
 if(!$('page-student-profiles')){
  const sec=document.createElement('section');sec.className='page-section';sec.id='page-student-profiles';sec.dataset.pageSection='student-profiles';
  sec.innerHTML='<div class="page-header"><div><span class="page-eyebrow"><i class="fa-solid fa-id-card"></i> Hồ sơ</span><h1>Hồ sơ học sinh</h1><p>Tổng hợp thông tin và quá trình học tập, chuyên cần, vi phạm, khen thưởng, nhận xét.</p></div><div class="lh-profile-picker" id="lhProfilePicker"><button type="button" class="lh-profile-picker-trigger" id="lhProfilePickerTrigger"><span><i class="fa-solid fa-user-graduate"></i><b id="lhProfilePickerLabel">Chọn học sinh</b></span><span id="lhProfilePickerArrow">▾</span></button><input type="hidden" id="profileStudent" value=""><div class="lh-profile-picker-panel" id="lhProfilePickerPanel" hidden></div></div></div><div class="profile-layout"><aside class="profile-list-panel"><div class="toolbar-search"><i class="fa-solid fa-magnifying-glass"></i><input id="lhProfileSearch" type="search" placeholder="Tìm học sinh..."></div><div id="lhProfileStudentList" class="profile-student-list"></div></aside><article id="lhProfileDetail" class="profile-detail"><div class="empty-state"><span class="empty-icon"><i class="fa-solid fa-user-graduate"></i></span><strong>Chọn một học sinh</strong><p>Hồ sơ chi tiết sẽ hiển thị tại đây.</p></div></article></div>';
  main.appendChild(sec);
  $('lhProfileSearch')?.addEventListener('input',()=>renderList($('lhProfileSearch').value));
  $('lhProfilePickerTrigger')?.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();const st=pickerState();st.open=!st.open;const p=$('lhProfilePickerPanel'),a=$('lhProfilePickerArrow');if(p)p.hidden=!st.open;if(a)a.textContent=st.open?'▴':'▾';if(st.open)renderPicker()});
  $('lhProfilePickerPanel')?.addEventListener('click',e=>e.stopPropagation());
  document.addEventListener('click',e=>{const w=$('lhProfilePicker');if(w&&!w.contains(e.target))closePicker()},{passive:true});
 }
 syncPicker();renderList($('lhProfileSearch')?.value||'');
}
function renderList(q){
 const box=$('lhProfileStudentList');if(!box)return;
 const key=clean(q).toLocaleLowerCase('vi');
 const list=students().filter(s=>!key||clean(s.name).toLocaleLowerCase('vi').includes(key));
 box.innerHTML=list.map((s,i)=>`<button type="button" class="profile-student-row" data-profile-id="${esc(s.id)}"><span class="profile-index">${i+1}</span><span class="profile-student-name">${esc(s.name)}</span></button>`).join('')||'<div class="empty-state"><strong>Không tìm thấy học sinh</strong></div>';
 box.querySelectorAll('[data-profile-id]').forEach(b=>b.addEventListener('click',()=>selectProfile(b.dataset.profileId)));
}
function renderProfile(id){
 const sid=clean(id),s=students().find(x=>clean(x.id)===sid),box=$('lhProfileDetail');
 if(!s||!box)return;
 const att=getEvents('DIEM_DANH','attendanceRecords').filter(r=>clean(r.studentId)===sid);
 const vio=getEvents('VI_PHAM','violationRecords').filter(r=>clean(r.studentId)===sid);
 const rew=getEvents('KHEN_THUONG','rewardRecords').filter(r=>clean(r.studentId)===sid);
 const learn=getEvents('HOC_TAP','learningRecords').filter(r=>clean(r.studentId)===sid);
 const comments=getEvents('NHAN_XET','commentRecords').filter(r=>clean(r.studentId)===sid);
 const tiendo=getEvents('TIEN_BO','progressRecords').filter(r=>clean(r.studentId)===sid);
 const present=att.filter(r=>/có mặt|present/i.test(clean(r.status))).length;
 box.innerHTML=`<div class="profile-head"><div class="profile-avatar-large">${esc(clean(s.name).split(/\s+/).map(x=>x[0]).slice(-2).join(''))}</div><div><span class="page-eyebrow">Học sinh</span><h2>${esc(s.name)}</h2><p>${esc(s.gender||'')} ${s.birthDate?'· '+esc(s.birthDate):''}</p></div></div><div class="profile-stats"><div><strong>${att.length}</strong><span>Điểm danh</span></div><div><strong>${present}</strong><span>Có mặt</span></div><div><strong>${vio.length}</strong><span>Vi phạm</span></div><div><strong>${rew.length}</strong><span>Khen thưởng</span></div><div><strong>${learn.length}</strong><span>Học tập</span></div><div><strong>${tiendo.length}</strong><span>Tiến bộ</span></div></div><div class="profile-sections"><section><h3><i class="fa-solid fa-calendar-check"></i> Chuyên cần</h3>${att.length?'<p>'+esc(att.slice(-5).map(r=>(r.date||'')+' — '+(r.status||'')).join(' · '))+'</p>':'<p class="muted">Chưa có dữ liệu.</p>'}</section><section><h3><i class="fa-solid fa-triangle-exclamation"></i> Vi phạm</h3>${vio.length?'<p>'+esc(vio.slice(-5).map(r=>(r.date||'')+' — '+(r.type||'')).join(' · '))+'</p>':'<p class="muted">Chưa có dữ liệu.</p>'}</section><section><h3><i class="fa-solid fa-trophy"></i> Khen thưởng</h3>${rew.length?'<p>'+esc(rew.slice(-5).map(r=>(r.date||'')+' — '+(r.type||'')).join(' · '))+'</p>':'<p class="muted">Chưa có dữ liệu.</p>'}</section><section><h3><i class="fa-solid fa-book-open"></i> Học tập</h3>${learn.length?'<p>'+esc(learn.slice(-5).map(r=>(r.date||'')+' — '+(r.subject||r.result||'')).join(' · '))+'</p>':'<p class="muted">Chưa có dữ liệu.</p>'}</section><section><h3><i class="fa-solid fa-arrow-trend-up"></i> Tiến bộ</h3>${tiendo.length?'<p>'+esc(tiendo.slice(-5).map(r=>(r.date||'')+' — '+(r.category||r.level||'')).join(' · '))+'</p>':'<p class="muted">Chưa có dữ liệu.</p>'}</section><section><h3><i class="fa-solid fa-pen-to-square"></i> Nhận xét</h3>${comments.length?'<p>'+esc(comments.slice(-5).map(r=>(r.date||'')+' — '+(r.content||'')).join(' · '))+'</p>':'<p class="muted">Chưa có dữ liệu.</p>'}</section></div>`;
 const hidden=$('profileStudent');if(hidden)hidden.value=sid;const label=$('lhProfilePickerLabel');if(label)label.textContent=clean(s.name);
}
function openPage(){
 ensurePage();
 document.querySelectorAll('.page-section').forEach(s=>s.classList.remove('active'));
 const sec=$('page-student-profiles');if(sec)sec.classList.add('active');
 document.querySelectorAll('.main-menu .menu-item').forEach(x=>x.classList.toggle('active',x.id==='lhStudentProfileMenu'));
 const t=$('pageTitle');if(t)t.textContent='Hồ sơ học sinh';
 const sidebar=$('sidebar');if(sidebar&&window.innerWidth<900)sidebar.classList.remove('open');
 ensureRoster().then(()=>{syncPicker();renderList($('lhProfileSearch')?.value||'')});
}
function style(){
 if($('lhStudentProfileStyle'))return;
 const s=document.createElement('style');s.id='lhStudentProfileStyle';
 s.textContent='.profile-layout{display:grid;grid-template-columns:280px 1fr;gap:20px}.profile-list-panel,.profile-detail{background:var(--card-bg,#fff);border:1px solid rgba(0,0,0,.08);border-radius:16px;padding:16px}.profile-student-list{margin-top:12px;display:grid;gap:6px;max-height:620px;overflow:auto}.profile-student-row{display:flex;align-items:center;gap:10px;border:0;background:transparent;padding:10px;border-radius:10px;text-align:left;cursor:pointer}.profile-student-row:hover{background:rgba(37,99,235,.08)}.profile-index{width:28px;color:#64748b}.profile-student-name{font-weight:600}.lh-profile-picker{position:relative;min-width:280px}.lh-profile-picker-trigger{width:100%;min-height:46px;padding:10px 14px;border:1px solid #d1d5db;border-radius:10px;background:#fff;display:flex;align-items:center;justify-content:space-between;cursor:pointer;font-size:14px;box-shadow:0 1px 2px rgba(0,0,0,.04)}.lh-profile-picker-trigger:hover{border-color:#2563eb}.lh-profile-picker-trigger>span:first-child{display:flex;gap:9px;align-items:center;min-width:0}.lh-profile-picker-trigger b{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.lh-profile-picker-panel{position:absolute;left:0;right:0;top:calc(100% + 6px);z-index:6000;background:#fff;border:1px solid #d1d5db;border-radius:12px;box-shadow:0 12px 30px rgba(0,0,0,.18);overflow:hidden}.lh-profile-picker-search{display:flex;align-items:center;gap:8px;padding:9px;border-bottom:1px solid #e5e7eb}.lh-profile-picker-search i{color:#64748b}.lh-profile-picker-search input{width:100%;border:0;outline:0;background:transparent}.lh-profile-picker-items{max-height:320px;overflow:auto;padding:5px}.lh-profile-picker-option{display:flex;align-items:center;gap:9px;width:100%;padding:9px 10px;border:0;background:#fff;border-radius:8px;text-align:left;cursor:pointer}.lh-profile-picker-option:hover{background:#eff6ff}.picker-index{width:28px;color:#64748b}.lh-profile-picker-empty{padding:12px;color:#64748b;text-align:center}.profile-head{display:flex;gap:16px;align-items:center}.profile-avatar-large{width:64px;height:64px;border-radius:50%;display:grid;place-items:center;background:#2563eb;color:#fff;font-weight:800;font-size:20px}.profile-stats{display:grid;grid-template-columns:repeat(6,minmax(80px,1fr));gap:10px;margin:20px 0}.profile-stats>div{padding:14px;border-radius:12px;background:rgba(37,99,235,.06);text-align:center}.profile-stats strong{display:block;font-size:22px}.profile-stats span{font-size:12px;color:#64748b}.profile-sections{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.profile-sections section{padding:14px;border:1px solid rgba(0,0,0,.08);border-radius:12px}.profile-sections h3{margin:0 0 8px;font-size:15px}.profile-sections p{margin:0;line-height:1.5}.muted{color:#64748b}@media(max-width:900px){.profile-layout{grid-template-columns:1fr}.lh-profile-picker{min-width:100%}.profile-stats{grid-template-columns:repeat(3,1fr)}.profile-sections{grid-template-columns:1fr}}';
 document.head.appendChild(s);
}
async function init(){style();ensureMenu();ensurePage();await ensureRoster();syncPicker();renderList('')}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
window.addEventListener('google-sheets-data-ready',async()=>{await ensureRoster();ensurePage();syncPicker();renderList($('lhProfileSearch')?.value||'')});
})();
