/* QUẢN LÝ LỚP HỌC — SINGLE MENU ROUTER + TIỆN ÍCH/CÀI ĐẶT */
(function(){
'use strict';
if(window.__LH_SINGLE_MENU_ROUTER__)return;
window.__LH_SINGLE_MENU_ROUTER__=true;

const labels={dashboard:'Trang chủ',students:'Học sinh',attendance:'Điểm danh',violations:'Vi phạm',rewards:'Khen thưởng',learning:'Học tập',comments:'Nhận xét',statistics:'Thống kê','student-links':'Link học sinh',ai:'AI giáo viên',materials:'Kho học liệu','lucky-wheel':'Vòng quay may mắn',settings:'Cài đặt',utilities:'Tiện ích'};

function closeMobile(){
 if(window.innerWidth>900)return;
 const s=document.getElementById('sidebar'),o=document.getElementById('sidebarOverlay');
 if(s)s.classList.remove('open');
 if(o)o.classList.remove('active');
}
function setActive(page){
 document.querySelectorAll('.main-menu .menu-item[data-page]').forEach(function(b){b.classList.toggle('active',b.getAttribute('data-page')===page);});
 const t=document.getElementById('pageTitle');if(t)t.textContent=labels[page]||page;
 closeMobile();
}
function show(page){
 const target=document.querySelector('[data-page-section="'+page+'"]');
 if(!target)return false;
 document.querySelectorAll('[data-page-section]').forEach(function(el){el.hidden=true;el.classList.remove('active');});
 target.hidden=false;target.classList.add('active');
 setActive(page);
 if(page==='lucky-wheel')window.dispatchEvent(new Event('pagechange'));
 return true;
}
function esc(v){return String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function norm(v){return String(v??'').trim().replace(/\s+/g,' ').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d');}
function parseText(text){
 const raw=String(text||'').replace(/^\uFEFF/,'').replace(/\r/g,'').split('\n').filter(x=>x.trim());
 if(!raw.length)throw new Error('Tệp không có dữ liệu.');
 function split(line){
  if(line.includes('\t'))return line.split('\t');
  if(line.includes('|'))return line.split('|');
  if(line.includes(';'))return line.split(';');
  return line.split(',');
 }
 const rows=raw.map(split).map(r=>r.map(x=>String(x??'').trim()));
 const h=rows[0].map(norm);
 const idx=(names,def)=>{const i=h.findIndex(x=>names.some(n=>x===n||x.includes(n)));return i>=0?i:def;};
 const nameI=idx(['ho va ten','ho ten','hoc sinh','name'],1);
 const genderI=idx(['gioi tinh'],2);
 const levelI=idx(['xep loai','xep loai thuc te','trinh do','hoc luc','level'],3);
 const noteI=idx(['ghi chu','note'],4);
 const start=h.some(x=>x.includes('ho ten')||x.includes('hoc sinh')||x==='name')?1:0;
 const out=[];
 for(let i=start;i<rows.length;i++){
  const r=rows[i];
  const name=String(r[nameI]||'').trim();
  if(!name)continue;
  out.push({id:'UP-'+String(i+1).padStart(3,'0'),name,gender:String(r[genderI]||'').trim(),level:String(r[levelI]||'').trim()||'Chưa xác định',note:String(r[noteI]||'').trim()});
 }
 if(!out.length)throw new Error('Không tìm thấy học sinh hợp lệ.');
 return out;
}
function rank(v){const s=norm(v);if(/^t$/.test(s)||/tot|gioi|xuat sac/.test(s))return 2;if(/^h$/.test(s)||/kha|dat/.test(s))return 1;return 0;}
function buildUtilities(){
 let sec=document.getElementById('page-utilities-final');
 if(!sec){
  sec=document.createElement('section');sec.id='page-utilities-final';sec.setAttribute('data-page-section','utilities');sec.className='page-section';
  sec.innerHTML='<div class="page-header"><div><span class="page-eyebrow"><i class="fa-solid fa-toolbox"></i> Công cụ giáo viên</span><h1>Tiện ích</h1><p>Chỉ phục vụ tải danh sách trình độ và xếp sơ đồ lớp/xếp tổ; không sửa dữ liệu gốc.</p></div></div><div class="quick-actions"><button type="button" class="quick-action" id="lhUtilUpload"><span class="quick-action-icon">📤</span><span><strong>Tải lên</strong><small>STT · Họ và tên · Giới tính · Xếp loại · Ghi chú</small></span></button><button type="button" class="quick-action" id="lhUtilLayout"><span class="quick-action-icon">📐</span><span><strong>Tạo sơ đồ lớp học</strong><small>4 tổ · 2 HS/bàn · cân bằng T/H</small></span></button></div><div id="lhUtilStatus" class="lh-upload-status">Chưa tải danh sách.</div><div id="lhUtilPreview"></div><div id="lhUtilLayout" style="margin-top:16px"></div>';
  document.getElementById('mainContent').appendChild(sec);
 }
 show('utilities');
 let fileInput=document.getElementById('lhUtilFile');
 if(!fileInput){
  fileInput=document.createElement('input');fileInput.type='file';fileInput.id='lhUtilFile';fileInput.accept='.csv,.tsv,.txt';fileInput.style.display='none';document.body.appendChild(fileInput);
 }
 const upload=document.getElementById('lhUtilUpload');
 if(upload&&!upload.__bound){upload.__bound=true;upload.onclick=()=>fileInput.click();}
 if(fileInput&&!fileInput.__bound){fileInput.__bound=true;fileInput.onchange=async()=>{const f=fileInput.files&&fileInput.files[0];fileInput.value='';if(!f)return;try{window.__LH_UTIL_DATA__=parseText(await f.text());document.getElementById('lhUtilStatus').innerHTML='Đã tải <b>'+window.__LH_UTIL_DATA__.length+'</b> học sinh từ '+esc(f.name);renderPreview();}catch(e){alert(e.message||'Tệp không hợp lệ.');}};}
 const layout=document.getElementById('lhUtilLayout');if(layout&&!layout.__bound){layout.__bound=true;layout.onclick=renderLayout;}
}
function renderPreview(){
 const a=window.__LH_UTIL_DATA__||[];const box=document.getElementById('lhUtilPreview');if(!box)return;
 box.innerHTML='<div style="overflow:auto;margin-top:14px"><table class="data-table"><thead><tr><th>STT</th><th>Họ và tên</th><th>Giới tính</th><th>Xếp loại</th><th>Ghi chú</th></tr></thead><tbody>'+a.map((s,i)=>'<tr><td>'+(i+1)+'</td><td>'+esc(s.name)+'</td><td>'+esc(s.gender)+'</td><td>'+esc(s.level)+'</td><td>'+esc(s.note)+'</td></tr>').join('')+'</tbody></table></div>';
}
function renderLayout(){
 const a=window.__LH_UTIL_DATA__||[];
 if(!a.length){alert('Hãy tải lên danh sách theo mẫu 5 cột trước.');return;}
 const work=a.slice().sort(()=>Math.random()-.5);const pairs=[];
 while(work.length){const first=work.shift();let best=0,bestD=99;for(let i=0;i<work.length;i++){const d=Math.abs(rank(first.level)-rank(work[i].level));if(d<bestD){best=i;bestD=d;if(d===0)break;}}pairs.push([first,work.length?work.splice(best,1)[0]:null]);}
 const cols=[[],[],[],[]];pairs.forEach((p,i)=>cols[i%4].push(p));
 const root=document.getElementById('lhUtilLayout');root.innerHTML='<div style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px">'+cols.map((c,i)=>'<div style="border:1px solid #e2e8f0;border-radius:12px;padding:10px;background:#f8fafc"><h3 style="margin:0 0 8px;text-align:center">Tổ '+(i+1)+'</h3>'+c.map((p,j)=>'<div style="display:grid;grid-template-columns:24px 1fr 1fr;gap:5px;margin:6px 0"><span style="display:flex;align-items:center;justify-content:center">'+(j+1)+'</span><div style="padding:7px;background:#fff;border:1px solid #cbd5e1;border-radius:8px"><b>'+esc(p[0].name)+'</b><small style="display:block">'+esc(p[0].level)+'</small></div><div style="padding:7px;background:#fff;border:1px solid #cbd5e1;border-radius:8px">'+(p[1]?'<b>'+esc(p[1].name)+'</b><small style="display:block">'+esc(p[1].level)+'</small>':'—')+'</div></div>').join('')+'</div>').join('')+'</div><p style="margin-top:12px;color:#64748b">Tiện ích độc lập: dữ liệu tải lên chỉ dùng cho việc xếp tổ/xếp sơ đồ.</p>';
}
function ensureUtilitiesMenu(){
 const nav=document.querySelector('.main-menu');if(!nav)return;
 if(nav.querySelector('[data-page="utilities"]'))return;
 const b=document.createElement('button');b.type='button';b.className='menu-item';b.setAttribute('data-page','utilities');b.innerHTML='<i class="fa-solid fa-toolbox"></i><span>Tiện ích</span>';
 const settings=nav.querySelector('[data-page="settings"]');if(settings)nav.insertBefore(b,settings);else nav.appendChild(b);
}
function bind(){
 ensureUtilitiesMenu();
 const menu=document.querySelector('.main-menu');
 if(menu&&!menu.__LH_SINGLE_BOUND__){
  menu.__LH_SINGLE_BOUND__=true;
  const handler=function(e){const btn=e.target.closest&&e.target.closest('.menu-item[data-page]');if(!btn)return;const page=btn.getAttribute('data-page');const ok=page==='utilities'?(buildUtilities(),true):show(page);if(ok){e.preventDefault();e.stopImmediatePropagation();}};
  menu.addEventListener('click',handler,true);menu.addEventListener('touchend',handler,{capture:true,passive:false});
 }
 const toggle=document.getElementById('sidebarToggle');if(toggle&&!toggle.__LH_SINGLE_BOUND__){toggle.__LH_SINGLE_BOUND__=true;toggle.addEventListener('click',function(e){e.preventDefault();e.stopImmediatePropagation();const s=document.getElementById('sidebar'),o=document.getElementById('sidebarOverlay');if(!s)return;const open=!s.classList.contains('open');s.classList.toggle('open',open);if(o)o.classList.toggle('active',open);},true);}
 const close=document.getElementById('sidebarClose');if(close&&!close.__LH_SINGLE_BOUND__){close.__LH_SINGLE_BOUND__=true;close.addEventListener('click',function(e){e.preventDefault();e.stopImmediatePropagation();closeMobile();},true);}
 const overlay=document.getElementById('sidebarOverlay');if(overlay&&!overlay.__LH_SINGLE_BOUND__){overlay.__LH_SINGLE_BOUND__=true;overlay.addEventListener('click',function(e){e.preventDefault();e.stopImmediatePropagation();closeMobile();},true);}
}
function boot(){bind();setTimeout(bind,300);setTimeout(bind,900);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
window.LHStableMenu=show;
})();
