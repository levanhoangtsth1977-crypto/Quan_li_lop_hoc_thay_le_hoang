/* STUDENT PROFILE REPAIR 1.0 — isolated, roster-safe UI */
(function(){
'use strict';
if(window.__LH_STUDENT_PROFILE_REPAIR_10__)return;
window.__LH_STUDENT_PROFILE_REPAIR_10__=true;
const $=id=>document.getElementById(id);
const clean=v=>String(v??'').trim().replace(/\s+/g,' ');
const esc=v=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
let roster=[];
let loaded=false;
const keyOf=(s,i)=>clean(s?.id||s?.studentCode)||('HS5C-'+String(s?.stt||i+1).padStart(3,'0'));
function normalize(list){
 const seen=new Set();
 return (Array.isArray(list)?list:[]).map((s,i)=>({...s,_uiId:keyOf(s,i),_uiStt:Number(s?.stt)||i+1})).filter(s=>{const k=s._uiId;if(seen.has(k))return false;seen.add(k);return !!clean(s.name)}).sort((a,b)=>a._uiStt-b._uiStt);
}
function getRoster(){
 const g=Array.isArray(window.GOOGLE_SHEETS_STUDENTS)&&window.GOOGLE_SHEETS_STUDENTS.length?window.GOOGLE_SHEETS_STUDENTS:null;
 const s=Array.isArray(window.students)&&window.students.length?window.students:null;
 return normalize(g||s||roster);
}
async function ensureRoster(){
 const now=getRoster();
 if(now.length){roster=now;loaded=true;return roster;}
 if(loaded)return roster;
 try{
  const r=await fetch('DANH_SACH_HOC_SINH_5C_2026_2027.json',{cache:'no-store'});
  if(!r.ok)throw new Error('roster');
  const data=await r.json();
  roster=normalize(data?.students||[]);loaded=true;
 }catch(e){roster=[];loaded=true;}
 return roster;
}
function events(tab,legacy){const a=window.GOOGLE_SHEET_DATA?.tabs?.[tab];return Array.isArray(a)?a:(Array.isArray(window[legacy])?window[legacy]:[])}
function studentMatches(r,s){
 const vals=[r?.studentId,r?.studentCode,r?.studentName,r?.name].map(clean).filter(Boolean);
 const ids=[s?._uiId,s?.id,s?.studentCode].map(clean).filter(Boolean);
 const names=[s?.name].map(clean).filter(Boolean);
 return vals.some(v=>ids.includes(v)||names.includes(v));
}
function closePicker(){const p=$('lhProfilePickerPanel'),a=$('lhProfilePickerArrow');if(p)p.hidden=true;if(a)a.textContent='▾'}
function resetDetail(){const b=$('lhProfileDetail');if(b)b.innerHTML='<div class="empty-state"><span class="empty-icon"><i class="fa-solid fa-user-graduate"></i></span><strong>Chọn một học sinh</strong><p>Hồ sơ chi tiết sẽ hiển thị tại đây.</p></div>'}
function renderProfile(s){
 const b=$('lhProfileDetail');if(!b||!s)return;
 const att=events('DIEM_DANH','attendanceRecords').filter(r=>studentMatches(r,s));
 const vio=events('VI_PHAM','violationRecords').filter(r=>studentMatches(r,s));
 const rew=events('KHEN_THUONG','rewardRecords').filter(r=>studentMatches(r,s));
 const learn=events('HOC_TAP','learningRecords').filter(r=>studentMatches(r,s));
 const comments=events('NHAN_XET','commentRecords').filter(r=>studentMatches(r,s));
 const prog=events('TIEN_BO','progressRecords').filter(r=>studentMatches(r,s));
 const present=att.filter(r=>/có mặt|present/i.test(clean(r.status))).length;
 b.innerHTML=`<div class="profile-head"><div class="profile-avatar-large">${esc(clean(s.name).split(/\s+/).map(x=>x[0]).slice(-2).join(''))}</div><div><span class="page-eyebrow">Học sinh</span><h2>${esc(s.name)}</h2><p>${esc(s.gender||'')} ${s.birthDate?'· '+esc(s.birthDate):''}</p></div></div><div class="profile-stats"><div><strong>${att.length}</strong><span>Điểm danh</span></div><div><strong>${present}</strong><span>Có mặt</span></div><div><strong>${vio.length}</strong><span>Vi phạm</span></div><div><strong>${rew.length}</strong><span>Khen thưởng</span></div><div><strong>${learn.length}</strong><span>Học tập</span></div><div><strong>${prog.length}</strong><span>Tiến bộ</span></div></div><div class="profile-sections"><section><h3><i class="fa-solid fa-calendar-check"></i> Chuyên cần</h3>${att.length?'<p>'+esc(att.slice(-5).map(r=>(r.date||'')+' — '+(r.status||'')).join(' · '))+'</p>':'<p class="muted">Chưa có dữ liệu.</p>'}</section><section><h3><i class="fa-solid fa-triangle-exclamation"></i> Vi phạm</h3>${vio.length?'<p>'+esc(vio.slice(-5).map(r=>(r.date||'')+' — '+(r.type||'')).join(' · '))+'</p>':'<p class="muted">Chưa có dữ liệu.</p>'}</section><section><h3><i class="fa-solid fa-trophy"></i> Khen thưởng</h3>${rew.length?'<p>'+esc(rew.slice(-5).map(r=>(r.date||'')+' — '+(r.type||'')).join(' · '))+'</p>':'<p class="muted">Chưa có dữ liệu.</p>'}</section><section><h3><i class="fa-solid fa-book-open"></i> Học tập</h3>${learn.length?'<p>'+esc(learn.slice(-5).map(r=>(r.date||'')+' — '+(r.subject||r.result||'')).join(' · '))+'</p>':'<p class="muted">Chưa có dữ liệu.</p>'}</section><section><h3><i class="fa-solid fa-arrow-trend-up"></i> Tiến bộ</h3>${prog.length?'<p>'+esc(prog.slice(-5).map(r=>(r.date||'')+' — '+(r.category||r.level||'')).join(' · '))+'</p>':'<p class="muted">Chưa có dữ liệu.</p>'}</section><section><h3><i class="fa-solid fa-pen-to-square"></i> Nhận xét</h3>${comments.length?'<p>'+esc(comments.slice(-5).map(r=>(r.date||'')+' — '+(r.content||'')).join(' · '))+'</p>':'<p class="muted">Chưa có dữ liệu.</p>'}</section></div>`;
 const label=$('lhProfilePickerLabel');if(label)label.textContent=clean(s.name);
 closePicker();
}
function selectStudent(id){const list=getRoster(),s=list.find(x=>x._uiId===clean(id));if(!s)return;const h=$('lhProfileSelectedStudentId');if(h)h.value=s._uiId;renderProfile(s)}
function renderPicker(q=''){
 const panel=$('lhProfilePickerPanel');if(!panel)return;
 const list=getRoster();
 panel.replaceChildren();
 const sw=document.createElement('div');sw.className='lh-profile-picker-search';sw.innerHTML='<i class="fa-solid fa-magnifying-glass"></i><input id="lhProfileRepairSearch" type="search" placeholder="Tìm học sinh..." autocomplete="off">';panel.appendChild(sw);
 const items=document.createElement('div');items.className='lh-profile-picker-items';panel.appendChild(items);
 const draw=query=>{const k=clean(query).toLocaleLowerCase('vi');const f=list.filter(s=>!k||clean(s.name).toLocaleLowerCase('vi').includes(k));items.innerHTML=f.map((s,i)=>`<button type="button" class="lh-profile-picker-option" data-id="${esc(s._uiId)}"><span class="picker-index">${s._uiStt}</span><span>${esc(s.name)}</span></button>`).join('')||'<div class="lh-profile-picker-empty">Không tìm thấy học sinh</div>';items.querySelectorAll('[data-id]').forEach(b=>b.addEventListener('click',()=>selectStudent(b.dataset.id)))};
 const input=$('lhProfileRepairSearch');if(input)input.addEventListener('input',()=>draw(input.value));draw(q);
}
function ensureMenu(){const nav=document.querySelector('.main-menu');if(!nav||document.getElementById('lhStudentProfileMenu'))return;const anchor=[...nav.querySelectorAll('.menu-item')].find(x=>x.dataset?.page==='students');const b=document.createElement('button');b.type='button';b.className='menu-item';b.id='lhStudentProfileMenu';b.dataset.page='student-profiles';b.innerHTML='<i class="fa-solid fa-id-card"></i><span>Hồ sơ học sinh</span>';if(anchor)anchor.insertAdjacentElement('afterend',b);else nav.prepend(b);b.addEventListener('click',openPage)}
function ensurePage(){const main=$('mainContent');if(!main)return;let sec=$('page-student-profiles');if(!sec){sec=document.createElement('section');sec.className='page-section';sec.id='page-student-profiles';sec.dataset.pageSection='student-profiles';sec.innerHTML='<div class="page-header"><div><span class="page-eyebrow"><i class="fa-solid fa-id-card"></i> Hồ sơ</span><h1>Hồ sơ học sinh</h1><p>Tổng hợp thông tin và quá trình học tập, chuyên cần, vi phạm, khen thưởng, nhận xét.</p></div><div class="lh-profile-picker" id="lhProfilePicker"><button type="button" class="lh-profile-picker-trigger" id="lhProfilePickerTrigger"><span><i class="fa-solid fa-user-graduate"></i><b id="lhProfilePickerLabel">Chọn học sinh</b></span><span id="lhProfilePickerArrow">▾</span></button><input type="hidden" id="lhProfileSelectedStudentId" value=""><div class="lh-profile-picker-panel" id="lhProfilePickerPanel" hidden></div></div></div><article id="lhProfileDetail" class="profile-detail"><div class="empty-state"><span class="empty-icon"><i class="fa-solid fa-user-graduate"></i></span><strong>Chọn một học sinh</strong><p>Hồ sơ chi tiết sẽ hiển thị tại đây.</p></div></article>';main.appendChild(sec);$('lhProfilePickerTrigger').addEventListener('click',e=>{e.preventDefault();e.stopPropagation();const p=$('lhProfilePickerPanel'),a=$('lhProfilePickerArrow');const open=p.hidden;p.hidden=!open;a.textContent=open?'▴':'▾';if(open)renderPicker('')});$('lhProfilePickerPanel').addEventListener('click',e=>e.stopPropagation());document.addEventListener('click',e=>{const w=$('lhProfilePicker');if(w&&!w.contains(e.target))closePicker()},{passive:true})} else {const oldList=sec.querySelector('.profile-list-panel');if(oldList)oldList.remove();const oldSearch=sec.querySelector('#lhProfileSearch');if(oldSearch)oldSearch.remove();const detail=$('lhProfileDetail');if(detail)detail.classList.add('profile-detail');}}
function openPage(){ensureMenu();ensurePage();document.querySelectorAll('.page-section').forEach(s=>s.classList.remove('active'));$('page-student-profiles')?.classList.add('active');document.querySelectorAll('.main-menu .menu-item').forEach(x=>x.classList.toggle('active',x.id==='lhStudentProfileMenu'));if($('pageTitle'))$('pageTitle').textContent='Hồ sơ học sinh';if($('sidebar')&&window.innerWidth<900)$('sidebar').classList.remove('open');ensureRoster().then(()=>{if(!getRoster().length)resetDetail();else{const first=clean($('lhProfileSelectedStudentId')?.value);const s=getRoster().find(x=>x._uiId===first);if(s)renderProfile(s)}})}
function style(){if($('lhStudentProfileRepairStyle'))return;const s=document.createElement('style');s.id='lhStudentProfileRepairStyle';s.textContent='#page-student-profiles .profile-detail{width:100%!important;box-sizing:border-box}.lh-profile-picker{position:relative;min-width:280px}.lh-profile-picker-trigger{width:100%;min-height:46px;padding:10px 14px;border:1px solid #d1d5db;border-radius:10px;background:#fff;display:flex;align-items:center;justify-content:space-between;cursor:pointer}.lh-profile-picker-panel{position:absolute;left:0;right:0;top:calc(100% + 6px);z-index:7000;background:#fff;border:1px solid #d1d5db;border-radius:12px;box-shadow:0 12px 30px rgba(0,0,0,.18);overflow:hidden}.lh-profile-picker-search{display:flex;align-items:center;gap:8px;padding:9px;border-bottom:1px solid #e5e7eb}.lh-profile-picker-search input{width:100%;border:0;outline:0;background:transparent}.lh-profile-picker-items{max-height:320px;overflow:auto;padding:5px}.lh-profile-picker-option{display:flex;align-items:center;gap:9px;width:100%;padding:9px 10px;border:0;background:#fff;border-radius:8px;text-align:left;cursor:pointer}.lh-profile-picker-option:hover{background:#eff6ff}.picker-index{width:28px;color:#64748b}.lh-profile-picker-empty{padding:12px;color:#64748b;text-align:center}';document.head.appendChild(s)}
function init(){style();ensureMenu();ensurePage();ensureRoster();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
window.addEventListener('google-sheets-data-ready',()=>ensureRoster().then(()=>{ensureMenu();ensurePage()}));
const mo=new MutationObserver(()=>{ensureMenu();ensurePage()});if(document.body)mo.observe(document.body,{childList:true,subtree:true});
})();
