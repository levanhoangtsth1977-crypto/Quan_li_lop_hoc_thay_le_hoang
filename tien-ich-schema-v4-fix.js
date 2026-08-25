/* TIỆN ÍCH SCHEMA V4 — SAFE ROUTER
   Mẫu: STT | Họ và tên | Giới tính | Xếp loại | Ghi chú
   T/H dùng để cân bằng xếp tổ. Không ghi dữ liệu Google Sheets.
*/
(function(){
'use strict';
if(window.__LH_UTIL_SAFE_V4__) return;
window.__LH_UTIL_SAFE_V4__=true;

const LABELS={dashboard:'Trang chủ',students:'Học sinh',attendance:'Điểm danh',violations:'Vi phạm',rewards:'Khen thưởng',learning:'Học tập',comments:'Nhận xét',statistics:'Thống kê','student-links':'Link học sinh',ai:'AI giáo viên','lucky-wheel':'Vòng quay may mắn',settings:'Cài đặt',utilities:'Tiện ích'};
const esc=v=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const norm=v=>String(v??'').trim().replace(/\s+/g,' ').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d');

function closeMobile(){if(innerWidth>900)return;document.getElementById('sidebar')?.classList.remove('open');document.getElementById('sidebarOverlay')?.classList.remove('active');}
function show(page){
  if(page==='utilities') return openUtilities();
  const t=document.querySelector('[data-page-section="'+page+'"]');
  if(!t) return false;
  document.querySelectorAll('[data-page-section]').forEach(x=>{x.hidden=true;x.classList.remove('active');});
  t.hidden=false;t.classList.add('active');
  document.querySelectorAll('.main-menu .menu-item[data-page]').forEach(b=>b.classList.toggle('active',b.dataset.page===page));
  const title=document.getElementById('pageTitle');if(title)title.textContent=LABELS[page]||page;
  closeMobile();
  if(page==='lucky-wheel')window.dispatchEvent(new Event('pagechange'));
  return true;
}
function splitLine(line){
  let s=String(line??'').trim();
  if(s.startsWith('|'))s=s.slice(1);if(s.endsWith('|'))s=s.slice(0,-1);
  if(s.includes('\t'))return s.split('\t').map(x=>x.trim());
  if(s.includes('|'))return s.split('|').map(x=>x.trim());
  if(s.includes(';'))return s.split(';').map(x=>x.trim());
  const out=[];let cur='',q=false;
  for(let i=0;i<s.length;i++){const c=s[i];if(c==='"'){q=!q;}else if(c===','&&!q){out.push(cur.trim());cur='';}else cur+=c;}out.push(cur.trim());return out;
}
function parse(text){
  const rows=String(text||'').replace(/^\uFEFF/,'').replace(/\r/g,'').split('\n').filter(x=>x.trim()).map(splitLine);
  if(!rows.length)throw Error('Tệp không có dữ liệu.');
  const h=rows[0].map(norm);
  const find=(names,def)=>{const i=h.findIndex(x=>names.some(n=>x===n||x.includes(n)));return i>=0?i:def;};
  const ni=find(['ho va ten','ho ten','hoc sinh','name'],1),gi=find(['gioi tinh'],2),li=find(['xep loai','trinh do','hoc luc','level'],3),oi=find(['ghi chu','note'],4);
  const start=h.some(x=>x.includes('ho ten')||x.includes('hoc sinh')||x==='name')?1:0;
  const out=[];
  for(let i=start;i<rows.length;i++){
    const r=rows[i],name=String(r[ni]||'').trim();
    if(!name||/^---/.test(name))continue;
    out.push({name,gender:String(r[gi]||'').trim(),level:String(r[li]||'').trim()||'H',note:String(r[oi]||'').trim()});
  }
  if(!out.length)throw Error('Không tìm thấy học sinh theo mẫu 5 cột.');
  return out;
}
function rank(v){const s=norm(v);return s==='t'||/tot|gioi|xuat sac/.test(s)?2:s==='h'||/hoan thanh|kha|dat/.test(s)?1:1;}
function makeUtilities(){
  let sec=document.getElementById('page-utilities-final');
  if(!sec){
    sec=document.createElement('section');sec.id='page-utilities-final';sec.dataset.pageSection='utilities';sec.className='page-section';
    sec.innerHTML='<div class="page-header"><div><span class="page-eyebrow"><i class="fa-solid fa-toolbox"></i> Công cụ giáo viên</span><h1>Tiện ích</h1><p>Chỉ dùng để tải danh sách trình độ và xếp sơ đồ lớp/xếp tổ; không sửa dữ liệu gốc.</p></div></div><div class="quick-actions"><button type="button" class="quick-action" id="lhSafeUpload"><span class="quick-action-icon">📤</span><span><strong>Tải lên</strong><small>STT · Họ và tên · Giới tính · Xếp loại · Ghi chú</small></span></button><button type="button" class="quick-action" id="lhSafeLayout"><span class="quick-action-icon">📐</span><span><strong>Tạo sơ đồ lớp học</strong><small>4 tổ · 2 HS/bàn · cân bằng T/H</small></span></button></div><div id="lhSafeStatus" style="margin:12px 0;padding:10px;border:1px dashed #cbd5e1;border-radius:10px">Chưa tải danh sách.</div><div id="lhSafePreview"></div><div id="lhSafeLayout" style="margin-top:14px"></div>';
    document.getElementById('mainContent')?.appendChild(sec);
  }
  return sec;
}
function openUtilities(){
  const sec=makeUtilities();
  document.querySelectorAll('[data-page-section]').forEach(x=>{x.hidden=true;x.classList.remove('active');});
  sec.hidden=false;sec.classList.add('active');
  document.querySelectorAll('.main-menu .menu-item[data-page]').forEach(b=>b.classList.toggle('active',b.dataset.page==='utilities'));
  const title=document.getElementById('pageTitle');if(title)title.textContent='Tiện ích';closeMobile();
  let input=document.getElementById('lhSafeFile');
  if(!input){input=document.createElement('input');input.type='file';input.id='lhSafeFile';input.accept='.csv,.tsv,.txt';input.hidden=true;document.body.appendChild(input);}
  const up=document.getElementById('lhSafeUpload');if(up&&!up.__safe){up.__safe=true;up.onclick=()=>input.click();}
  if(!input.__safe){input.__safe=true;input.onchange=async()=>{const f=input.files?.[0];input.value='';if(!f)return;try{window.__LH_SAFE_UTIL_DATA__=parse(await f.text());const a=window.__LH_SAFE_UTIL_DATA__;document.getElementById('lhSafeStatus').innerHTML='Đã tải <b>'+a.length+'</b> học sinh · mẫu 5 cột';document.getElementById('lhSafePreview').innerHTML='<div style="overflow:auto;margin-top:12px"><table class="data-table"><thead><tr><th>STT</th><th>Họ và tên</th><th>Giới tính</th><th>Xếp loại</th><th>Ghi chú</th></tr></thead><tbody>'+a.map((s,i)=>'<tr><td>'+(i+1)+'</td><td>'+esc(s.name)+'</td><td>'+esc(s.gender)+'</td><td>'+esc(s.level)+'</td><td>'+esc(s.note)+'</td></tr>').join('')+'</tbody></table></div>';}catch(e){alert(e.message||'Tệp không hợp lệ.');}};}
  const lay=document.getElementById('lhSafeLayout');if(lay&&!lay.__safe){lay.__safe=true;lay.onclick=()=>{const a=window.__LH_SAFE_UTIL_DATA__||[];if(!a.length){alert('Hãy tải lên danh sách trước.');return;}const w=a.slice().sort(()=>Math.random()-.5),pairs=[];while(w.length){const first=w.shift();let bi=0,bd=99;w.forEach((s,i)=>{const d=Math.abs(rank(first.level)-rank(s.level));if(d<bd){bd=d;bi=i;}});pairs.push([first,w.length?w.splice(bi,1)[0]:null]);}const cols=[[],[],[],[]];pairs.forEach((p,i)=>cols[i%4].push(p));document.getElementById('lhSafeLayout').innerHTML='<div style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px">'+cols.map((c,i)=>'<div style="padding:10px;border:1px solid #e2e8f0;border-radius:12px;background:#f8fafc"><b>Tổ '+(i+1)+'</b>'+c.map((p,j)=>'<div style="margin-top:6px;padding:7px;background:#fff;border-radius:8px">'+(j+1)+'. '+esc(p[0].name)+' · '+esc(p[0].level)+(p[1]?' / '+esc(p[1].name)+' · '+esc(p[1].level):'')+'</div>').join('')+'</div>').join('')+'</div>';};}
  return true;
}

// CAPTURE AT WINDOW: runs before document-level legacy handlers.
function safeMenuEvent(e){
  const btn=e.target.closest?.('.main-menu .menu-item[data-page]');
  if(!btn)return;
  const page=btn.getAttribute('data-page');
  if(show(page)){e.preventDefault();e.stopImmediatePropagation();}
}
window.addEventListener('click',safeMenuEvent,true);
window.addEventListener('touchend',safeMenuEvent,{capture:true,passive:false});
window.addEventListener('DOMContentLoaded',()=>{const nav=document.querySelector('.main-menu');if(nav&&!nav.querySelector('[data-page="utilities"]')){const b=document.createElement('button');b.type='button';b.className='menu-item';b.dataset.page='utilities';b.innerHTML='<i class="fa-solid fa-toolbox"></i><span>Tiện ích</span>';const s=nav.querySelector('[data-page="settings"]');if(s)nav.insertBefore(b,s);else nav.appendChild(b);}}, {once:true});
})();
