/* FINAL SPECIAL MENU CONTROLLER */
(function(){
'use strict';
if(window.__LH_SPECIAL_MENU_FIX__)return;window.__LH_SPECIAL_MENU_FIX__=true;
const LABELS={comments:'Nhận xét',statistics:'Thống kê','student-links':'Link học sinh',ai:'AI giáo viên','lucky-wheel':'Vòng quay may mắn',utilities:'Tiện ích',game:'Triệu Phú Học Đường'};
function closeMobile(){if(window.innerWidth<=900){const s=document.getElementById('sidebar'),o=document.getElementById('sidebarOverlay');if(s)s.classList.remove('open');if(o)o.classList.remove('active')}}
function section(page){
 const t=document.querySelector('[data-page-section="'+page+'"]');
 if(!t)return false;
 document.querySelectorAll('[data-page-section]').forEach(x=>{x.hidden=true;x.classList.remove('active')});
 t.hidden=false;t.classList.add('active');
 document.querySelectorAll('.main-menu .menu-item[data-page]').forEach(x=>x.classList.toggle('active',x.getAttribute('data-page')===page));
 const h=document.getElementById('pageTitle');if(h)h.textContent=LABELS[page]||page;
 closeMobile();
 if(page==='lucky-wheel')window.dispatchEvent(new Event('pagechange'));
 return true;
}
function utilities(){
 let p=document.getElementById('page-utilities-final');
 if(!p){
  p=document.createElement('section');p.id='page-utilities-final';p.className='page-section';p.innerHTML='<div class="page-header"><div><span class="page-eyebrow"><i class="fa-solid fa-toolbox"></i> Công cụ giáo viên</span><h1>Tiện ích</h1><p>Chỉ phục vụ tải danh sách trình độ và xếp sơ đồ lớp/xếp tổ.</p></div></div><div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px"><button class="quick-action" id="lhSpecialUpload" type="button"><span class="quick-action-icon">📤</span><span><strong>Tải lên</strong><small>TT · Họ tên HS · Xếp loại</small></span></button><button class="quick-action" id="lhSpecialLayout" type="button"><span class="quick-action-icon">📐</span><span><strong>Tạo sơ đồ lớp học</strong><small>4 tổ · 2 HS/bàn</small></span></button></div><div id="lhSpecialWorkspace" style="margin-top:18px"></div>';
  document.getElementById('mainContent')?.appendChild(p);
 }
 section('utilities');
 const up=document.getElementById('lhSpecialUpload');if(up&&!up.__b){up.__b=1;up.onclick=()=>{let i=document.getElementById('lhSpecialFile');if(!i){i=document.createElement('input');i.type='file';i.accept='.csv,.tsv,.txt';i.id='lhSpecialFile';i.style.display='none';document.body.appendChild(i);i.onchange=async()=>{const f=i.files?.[0];i.value='';if(!f)return;const text=await f.text();const rows=text.replace(/\r/g,'').split('\n').filter(Boolean).map(x=>x.includes('\t')?x.split('\t'):x.split(/[|,;]/));const start=/ho\s*ten|hoc\s*sinh/i.test(rows[0]?.join(' '))?1:0;const data=rows.slice(start).map(r=>({name:String(r[1]||r[0]||'').trim(),level:String(r[2]||'Chưa xác định').trim()})).filter(x=>x.name);window.__LH_UPLOAD_STUDENTS__=data;const w=document.getElementById('lhSpecialWorkspace');if(w)w.innerHTML='<div style="padding:12px;border:1px solid #e2e8f0;border-radius:12px;background:#f8fafc"><b>Đã tải '+data.length+' học sinh.</b><div style="margin-top:8px">'+data.slice(0,10).map((x,n)=>(n+1)+'. '+x.name+' — '+x.level).join('<br>')+'</div></div>';};document.body.appendChild(i)}i.click()}}};
 const lay=document.getElementById('lhSpecialLayout');if(lay&&!lay.__b){lay.__b=1;lay.onclick=()=>{const all=window.__LH_UPLOAD_STUDENTS__||[];const src=all.length?all:(Array.isArray(window.students)?window.students:[]);const w=document.getElementById('lhSpecialWorkspace');if(!src.length){if(w)w.textContent='Chưa có dữ liệu học sinh. Hãy tải lên danh sách trình độ.';return}const arr=src.slice();for(let i=arr.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[arr[i],arr[j]]=[arr[j],arr[i]]}const cols=Array.from({length:4},()=>[]);arr.forEach((s,i)=>cols[i%4].push(s));if(w)w.innerHTML='<div style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px">'+cols.map((c,i)=>'<div style="border:1px solid #e2e8f0;border-radius:12px;padding:10px;background:#f8fafc"><b>Tổ '+(i+1)+'</b>'+c.map((s,n)=>'<div style="margin-top:7px;padding:7px;border-radius:8px;background:#fff">'+(n+1)+'. '+(s.name||s.name)+'</div>').join('')+'</div>').join('')+'</div>'}};
}
function profile(){
 if(document.getElementById('lhTeacherProfile'))return;
 const m=document.createElement('div');m.id='lhTeacherProfile';m.style='position:fixed;inset:0;background:rgba(15,23,42,.45);z-index:10000;display:grid;place-items:center;padding:20px';m.innerHTML='<div style="width:min(420px,100%);background:#fff;border-radius:18px;padding:24px;box-shadow:0 20px 50px rgba(0,0,0,.2)"><div style="display:flex;justify-content:space-between;align-items:center"><h2 style="margin:0">👨‍🏫 Thầy Lê Hoàng</h2><button id="lhTeacherClose" type="button" style="font-size:22px;background:none">✕</button></div><p style="margin-top:18px">Giáo viên chủ nhiệm · Lớp 5C · Năm học 2026–2027</p><div style="padding:12px;border-radius:12px;background:#f8fafc">Quản lý lớp học, học sinh, điểm danh, học tập và các hoạt động giáo dục.</div></div>';document.body.appendChild(m);m.onclick=e=>{if(e.target===m)m.remove()};document.getElementById('lhTeacherClose').onclick=()=>m.remove()}
function handle(page,text){
 const t=(text||'').toLowerCase();
 if(page==='game'||page==='trieu-phu'||t.includes('triệu phú học đường')||t.includes('triệu phú')){location.href='game/index.html';return true}
 if(page==='utilities'||t.includes('tiện ích')){utilities();return true}
 if(section(page))return true;
 if(page==='materials'&&document.querySelector('[data-page-section="materials"]'))return section('materials');
 return false;
}
function bind(){
 document.addEventListener('click',function(e){
  const btn=e.target.closest?.('.main-menu .menu-item[data-page], .main-menu [data-page], #teacherMenuButton, .teacher-card');
  if(!btn)return;
  if(btn.id==='teacherMenuButton'||btn.classList.contains('teacher-card')){e.preventDefault();e.stopImmediatePropagation();profile();closeMobile();return}
  const page=btn.getAttribute('data-page');
  if(page && handle(page,btn.textContent)){e.preventDefault();e.stopImmediatePropagation();}
 },true);
 document.addEventListener('touchend',function(e){
  const btn=e.target.closest?.('.main-menu .menu-item[data-page], .main-menu [data-page]');if(!btn)return;
  const page=btn.getAttribute('data-page');if(page&&handle(page,btn.textContent)){e.preventDefault();e.stopImmediatePropagation();}
 },{capture:true,passive:false});
}
function boot(){bind();closeMobile()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
window.LHSpecialMenu=handle;
})();