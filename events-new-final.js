/* EVENTS NEW FINAL — VI PHẠM + KHEN THƯỞNG
 * CRUD trực tiếp Google Apps Script.
 * Tổng hợp 1 học sinh = 1 dòng; xem chi tiết các lượt riêng.
 * Không phụ thuộc module cũ.
 */
(function(){'use strict';
if(window.__LH_EVENTS_NEW_FINAL__)return;window.__LH_EVENTS_NEW_FINAL__=true;
const API='https://script.google.com/macros/s/AKfycbxTPwf-jhrR8JOoKY5ZLuzlsDgcv3nWILtDPTrYNWZCEPpm2rkpXTn-sPAdFaUyy0z_uw/exec';
const S=v=>String(v??'').trim();
const E=v=>S(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
const today=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
const fmt=v=>{const s=S(v),m=s.match(/^(\d{4})-(\d{2})-(\d{2})/);return m?`${m[3]}/${m[2]}/${m[1]}`:s};
const slug=s=>S(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/[^a-z0-9]+/g,'-');
let students=[], data={VI_PHAM:[],KHEN_THUONG:[]};
const typesV=['Đi học muộn','Chưa hoàn thành bài','Quên đồ dùng','Mất trật tự','Chưa chuẩn bị bài','Vi phạm nội quy','Hành vi chưa phù hợp','Khác'];
const levelsV=['Nhẹ','Trung bình','Nặng'];
const statusV=['Đang theo dõi','Đã xử lý'];
const actionsV=['Nhắc nhở','Trao đổi','Hỗ trợ','Tư vấn','Phối hợp phụ huynh'];
const typesR=['Việc tốt','Học tập','Thành tích','Tuyên dương','Khác'];
const formsR=['Tuyên dương','Giấy khen','Phần thưởng','Ghi nhận'];
async function api(action,params={}){const q=new URLSearchParams({action,...params});const r=await fetch(API+'?'+q.toString(),{cache:'no-store'});const j=await r.json();if(!j.ok)throw Error(j.error||'Máy chủ trả lỗi');return j}
async function load(){
  const [s,e]=await Promise.all([api('get_students'),api('get_events')]);
  students=s.students||[];data.VI_PHAM=e.VI_PHAM||[];data.KHEN_THUONG=e.KHEN_THUONG||[];
}
function removeOldUI(){
  document.querySelectorAll('.main-menu [data-page="violations"],.main-menu [data-page="rewards"]').forEach(x=>x.remove());
  document.querySelectorAll('#page-violations,#page-rewards').forEach(x=>x.remove());
}
function installMenus(){
  const nav=document.querySelector('.main-menu');if(!nav)return;
  removeOldUI();
  if(!document.getElementById('lhMenuViolationNew')){
    const a=document.createElement('button');a.id='lhMenuViolationNew';a.type='button';a.className='menu-item';a.dataset.page='violations-new';a.innerHTML='<i class="fa-solid fa-triangle-exclamation"></i><span>Vi phạm</span><span class="menu-badge warning" id="lhViolationBadgeNew">0</span>';a.onclick=()=>open('violations');nav.insertBefore(a,nav.querySelector('[data-page="learning"]')||nav.lastElementChild);
  }
  if(!document.getElementById('lhMenuRewardNew')){
    const a=document.createElement('button');a.id='lhMenuRewardNew';a.type='button';a.className='menu-item';a.dataset.page='rewards-new';a.innerHTML='<i class="fa-solid fa-trophy"></i><span>Khen thưởng</span><span class="menu-badge success" id="lhRewardBadgeNew">0</span>';a.onclick=()=>open('rewards');nav.insertBefore(a,nav.querySelector('[data-page="learning"]')||nav.lastElementChild);
  }
  updateBadges();
}
function updateBadges(){const v=document.getElementById('lhViolationBadgeNew'),r=document.getElementById('lhRewardBadgeNew');if(v)v.textContent=data.VI_PHAM.length;if(r)r.textContent=data.KHEN_THUONG.length;}
function pageId(kind){return kind==='violations'?'page-violations-new':'page-rewards-new'}
function open(kind){
  document.querySelectorAll('.page-section').forEach(x=>x.classList.remove('active'));
  let p=document.getElementById(pageId(kind));
  if(!p){p=document.createElement('section');p.id=pageId(kind);p.className='page-section';document.getElementById('mainContent').appendChild(p);}
  p.classList.add('active');document.getElementById('pageTitle').textContent=kind==='violations'?'Vi phạm':'Khen thưởng';render(kind);
}
function selectOptions(items,val){return items.map(x=>`<option value="${E(x)}" ${S(x)===S(val)?'selected':''}>${E(x)}</option>`).join('')}
function header(kind){
  const v=kind==='violations';
  return `<div class="page-header"><div><span class="page-eyebrow"><i class="fa-solid ${v?'fa-triangle-exclamation':'fa-trophy'}"></i> ${v?'Theo dõi giáo dục':'Ghi nhận tích cực'}</span><h1>${v?'Vi phạm':'Khen thưởng'}</h1><p>${v?'Quản lý theo lượt và tổng hợp theo từng học sinh.':'Quản lý thành tích, việc tốt và các hình thức tuyên dương.'}</p></div><div class="page-actions"><button class="button secondary" id="evRefresh"><i class="fa-solid fa-rotate"></i> Làm mới</button><button class="button primary" id="evAdd"><i class="fa-solid fa-plus"></i> ${v?'Ghi nhận vi phạm':'Ghi nhận khen thưởng'}</button><button class="button danger" id="evClear"><i class="fa-solid fa-trash-can"></i> Xóa tất cả</button></div></div>`;
}
function form(kind,record={}){
 const v=kind==='violations';const sid=S(record.studentId);return `<div class="ev-modal" id="evModal"><div class="ev-dialog"><div class="ev-modal-head"><h3>${record.id?'Chỉnh sửa':'Ghi nhận'} ${v?'vi phạm':'khen thưởng'}</h3><button class="icon-button" id="evClose">✕</button></div><div class="form-grid"><label>Ngày<input type="date" id="evDate" value="${E(record.date||today())}"></label><label>Học sinh<select id="evStudent"><option value="">Chọn học sinh</option>${students.map(s=>`<option value="${E(s.id)}" ${S(s.id)===sid?'selected':''}>${E(s.name)}</option>`).join('')}</select></label><label>${v?'Nội dung':'Loại thành tích'}<select id="evType"><option value="">Chọn</option>${selectOptions(v?typesV:typesR,record.type)}</select></label>${v?`<label>Mức độ<select id="evLevel">${selectOptions(levelsV,record.level||'Nhẹ')}</select></label><label>Trạng thái<select id="evStatus">${selectOptions(statusV,record.status||'Đang theo dõi')}</select></label><label>Biện pháp<select id="evAction">${selectOptions(actionsV,record.action||'Nhắc nhở')}</select></label>`:`<label>Hình thức<select id="evFormType">${selectOptions(formsR,record.formType||'Tuyên dương')}</select></label>`}<label class="full">Ghi chú<textarea id="evNote" rows="3" placeholder="Nhập nội dung...">${E(record.note||'')}</textarea></label></div><div class="ev-modal-actions"><button class="button secondary" id="evCancel">Hủy</button><button class="button primary" id="evSave"><i class="fa-solid fa-floppy-disk"></i> Lưu</button></div></div></div>`;
}
function rows(kind){
 const v=kind==='violations', arr=v?data.VI_PHAM:data.KHEN_THUONG, map={};arr.forEach(r=>{const id=S(r.studentId);if(!map[id])map[id]={studentId:id,name:S(r.studentName)||name(id),count:0,last:'',lastType:'',status:'',items:[]};map[id].count++;map[id].items.push(r);if(!map[id].last||S(r.date)>S(map[id].last)){map[id].last=S(r.date);map[id].lastType=S(r.type);map[id].status=S(r.status)}});return Object.values(map).sort((a,b)=>b.count-a.count||a.name.localeCompare(b.name,'vi'));
}
function name(id){const s=students.find(x=>S(x.id)===S(id));return S(s?.name)||S(id)||'Học sinh'}
function render(kind){
 const p=document.getElementById(pageId(kind));if(!p)return;const v=kind==='violations';p.innerHTML=header(kind)+`<div class="toolbar"><div class="toolbar-search"><i class="fa-solid fa-magnifying-glass"></i><input id="evSearch" placeholder="Tìm học sinh..."></div><select id="evFilter"><option value="all">Tất cả</option>${(v?typesV:typesR).map(x=>`<option>${E(x)}</option>`).join('')}</select></div><div class="stats-grid ev-stats"><div class="stat-card"><strong class="stat-number">${arr(kind).length}</strong><span class="stat-label">Tổng lượt</span></div><div class="stat-card"><strong class="stat-number">${rows(kind).length}</strong><span class="stat-label">Học sinh</span></div><div class="stat-card"><strong class="stat-number">${new Set(arr(kind).map(r=>S(r.studentId))).size}</strong><span class="stat-label">HS có ghi nhận</span></div></div><div class="table-container"><table class="data-table"><thead><tr><th>STT</th><th>Học sinh</th><th>Số lần</th><th>Ngày gần nhất</th><th>${v?'Nội dung gần nhất':'Thành tích gần nhất'}</th><th>${v?'Trạng thái':'Hình thức'}</th><th>Thao tác</th></tr></thead><tbody>${rows(kind).map((r,i)=>`<tr><td>${i+1}</td><td><strong>${E(r.name)}</strong></td><td><strong>${r.count}</strong></td><td>${E(fmt(r.last))}</td><td>${E(r.lastType||'—')}</td><td>${E(v?(r.status||'Đang theo dõi'):(r.items.find(x=>S(x.date)===S(r.last))?.formType||'—'))}</td><td><button class="button small" data-detail="${E(r.studentId)}">Chi tiết</button></td></tr>`).join('')||`<tr><td colspan="7"><div class="empty-state"><strong>Chưa có dữ liệu</strong><p>Hãy bấm "${v?'Ghi nhận vi phạm':'Ghi nhận khen thưởng'}" để bắt đầu.</p></div></td></tr>`}</tbody></table></div>`;
 bind(kind);updateBadges();
}
function arr(kind){return kind==='violations'?data.VI_PHAM:data.KHEN_THUONG}
function bind(kind){
 const p=document.getElementById(pageId(kind)),v=kind==='violations';p.querySelector('#evAdd').onclick=()=>showForm(kind);p.querySelector('#evRefresh').onclick=async()=>{await reload();render(kind)};p.querySelector('#evClear').onclick=()=>clearAll(kind);p.querySelector('#evSearch').oninput=()=>filterTable(kind);p.querySelector('#evFilter').onchange=()=>filterTable(kind);p.querySelectorAll('[data-detail]').forEach(b=>b.onclick=()=>details(kind,b.dataset.detail));
}
function filterTable(kind){const p=document.getElementById(pageId(kind)),q=S(p.querySelector('#evSearch').value).toLowerCase(),f=S(p.querySelector('#evFilter').value).toLowerCase();p.querySelectorAll('tbody tr').forEach(tr=>{const t=tr.innerText.toLowerCase();tr.style.display=(!q||t.includes(q))&&(!f||f==='all'||t.includes(f))?'':'none'})}
function showForm(kind,record={}){const w=document.createElement('div');w.innerHTML=form(kind,record);document.body.appendChild(w.firstElementChild);const m=document.getElementById('evModal');const close=()=>m?.remove();m.querySelector('#evClose').onclick=close;m.querySelector('#evCancel').onclick=close;m.querySelector('#evSave').onclick=async()=>{const studentId=S(m.querySelector('#evStudent').value),t=S(m.querySelector('#evType').value);if(!studentId||!t){alert('Vui lòng chọn học sinh và nội dung.');return}const r={id:record.id||'',studentId,date:S(m.querySelector('#evDate').value)||today(),type:t,note:S(m.querySelector('#evNote').value)};if(kind==='violations'){r.level=S(m.querySelector('#evLevel').value);r.status=S(m.querySelector('#evStatus').value);r.action=S(m.querySelector('#evAction').value)}else r.formType=S(m.querySelector('#evFormType').value);const b=m.querySelector('#evSave');b.disabled=true;try{await api('save_event',{payload:JSON.stringify({sheet:kind==='violations'?'VI_PHAM':'KHEN_THUONG',record:r})});await reload();close();render(kind)}catch(e){alert('Lưu thất bại: '+e.message);b.disabled=false}}}
function details(kind,sid){const v=kind==='violations',items=arr(kind).filter(r=>S(r.studentId)===S(sid)).sort((a,b)=>S(b.date).localeCompare(S(a.date)));const w=document.createElement('div');w.innerHTML=`<div class="ev-modal"><div class="ev-dialog ev-wide"><div class="ev-modal-head"><h3>${v?'Vi phạm':'Khen thưởng'} — ${E(name(sid))}</h3><button class="icon-button" id="dtClose">✕</button></div><div class="table-container"><table class="data-table"><thead><tr><th>Ngày</th><th>${v?'Nội dung':'Thành tích'}</th><th>${v?'Mức độ':'Hình thức'}</th><th>${v?'Trạng thái':'Ghi chú'}</th><th>Thao tác</th></tr></thead><tbody>${items.map(r=>`<tr><td>${E(fmt(r.date))}</td><td>${E(r.type)}</td><td>${E(v?(r.level||'Nhẹ'):(r.formType||'—'))}</td><td>${E(v?(r.status||'Đang theo dõi'):(r.note||'—'))}</td><td><button class="icon-button" data-edit="${E(r.id)}">✏️</button><button class="icon-button danger" data-del="${E(r.id)}">🗑️</button></td></tr>`).join('')}</tbody></table></div></div></div>`;document.body.appendChild(w.firstElementChild);const m=document.querySelector('.ev-modal:last-of-type');m.querySelector('#dtClose').onclick=()=>m.remove();m.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>{const r=items.find(x=>S(x.id)===S(b.dataset.edit));m.remove();showForm(kind,r)});m.querySelectorAll('[data-del]').forEach(b=>b.onclick=async()=>{if(!confirm('Xóa đúng lượt này?'))return;try{await api('delete_event',{sheet:v?'VI_PHAM':'KHEN_THUONG',id:b.dataset.del});await reload();m.remove();render(kind)}catch(e){alert('Xóa thất bại: '+e.message)}})}
async function clearAll(kind){const a=arr(kind);if(!a.length){alert('Không có dữ liệu để xóa.');return}if(!confirm(`Xóa toàn bộ ${a.length} lượt ${kind==='violations'?'vi phạm':'khen thưởng'}?\n\nChỉ xóa sheet ${kind==='violations'?'VI_PHAM':'KHEN_THUONG'}.`))return;try{await api('delete_all_events',{sheet:kind==='violations'?'VI_PHAM':'KHEN_THUONG'});await reload();render(kind)}catch(e){alert('Xóa tất cả thất bại: '+e.message)}}
async function reload(){await load();updateBadges()}
function css(){if(document.getElementById('lhEventsNewCss'))return;const s=document.createElement('style');s.id='lhEventsNewCss';s.textContent='.ev-modal{position:fixed;inset:0;background:rgba(15,23,42,.48);z-index:99999;display:flex;align-items:center;justify-content:center;padding:18px}.ev-dialog{background:#fff;border-radius:18px;width:min(760px,100%);max-height:92vh;overflow:auto;padding:20px;box-shadow:0 20px 60px rgba(0,0,0,.2)}.ev-wide{width:min(1000px,100%)}.ev-modal-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px}.ev-modal-head h3{margin:0}.ev-modal-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:18px}.form-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.form-grid label{display:flex;flex-direction:column;gap:6px;font-size:13px;font-weight:600}.form-grid .full{grid-column:1/-1}.form-grid input,.form-grid select,.form-grid textarea{font:inherit;font-weight:400;border:1px solid #cbd5e1;border-radius:9px;padding:9px;background:#fff}.button.small{padding:5px 9px;font-size:12px}.ev-stats{margin-bottom:18px}@media(max-width:700px){.form-grid{grid-template-columns:1fr}.form-grid .full{grid-column:auto}.ev-dialog{padding:14px}.ev-stats{grid-template-columns:repeat(3,1fr)}}';document.head.appendChild(s)}
async function start(){css();removeOldUI();try{await load()}catch(e){console.error(e)}installMenus();['violations','rewards'].forEach(k=>{const p=document.getElementById(pageId(k));if(p)p.remove()});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
setInterval(()=>{installMenus();if(document.querySelector('#page-violations-new.active'))render('violations');if(document.querySelector('#page-rewards-new.active'))render('rewards')},5000);
window.LH_EVENTS_NEW={open,refresh:reload};
})();