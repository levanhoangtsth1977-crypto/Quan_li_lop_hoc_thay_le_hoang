/* EVENTS FIXED STATIC 3.0 — SINGLE OWNER
 * Vi phạm/Khen thưởng: một nguồn hiển thị, một luồng CRUD.
 * - Không gom nhiều bản ghi thành 1 dòng.
 * - Không tự tạo dòng cho học sinh không có ghi nhận.
 * - Khử trùng hiển thị theo ID/fingerprint nhưng không tự xóa dữ liệu.
 * - Có Xóa từng bản ghi và Xóa tất cả.
 * - Xác minh lại Google Sheets sau thao tác xóa.
 * - Dùng danh mục nhanh mới từ window.LH_BEHAVIOR_QUICK_OPTIONS khi có.
 * - Không can thiệp Điểm danh/Học tập/SMAS.
 */
(function(){
  'use strict';
  if(window.__LH_EVENTS_FIXED_STATIC_V30__) return;
  window.__LH_EVENTS_FIXED_STATIC_V30__=true;

  const API=()=>String(window.GOOGLE_API_CONFIG?.url||'').trim();
  const S=v=>String(v??'').trim();
  const E=v=>S(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\"/g,'&quot;').replace(/'/g,'&#039;');
  const N=v=>S(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ');
  const today=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
  const fmt=v=>{const s=S(v);const m=s.match(/^(\d{4})[-\/]([0-9]{1,2})[-\/]([0-9]{1,2})/);return m?`${m[3].padStart(2,'0')}/${m[2].padStart(2,'0')}/${m[1]}`:s};
  const stableId=r=>S(r?.id||r?.eventId||r?.recordId);
  const fingerprint=r=>[S(r?.studentId),S(r?.date),N(r?.type||r?.content||r?.noiDung),N(r?.level),N(r?.status),N(r?.action||r?.resolution),N(r?.formType),N(r?.note||r?.description)].join('|');
  let students=[];let V=[];let R=[];

  async function api(action,params={}){
    const base=API();
    if(!base) throw Error('Chưa có cấu hình Google Apps Script.');
    const r=await fetch(base+'?'+new URLSearchParams({action,...params}),{cache:'no-store'});
    if(!r.ok) throw Error('Máy chủ trả HTTP '+r.status);
    const j=await r.json();
    if(!j?.ok) throw Error(j?.error||'Máy chủ trả lỗi');
    return j;
  }

  function cleanStudents(list){return (Array.isArray(list)?list:[]).filter(x=>S(x?.id));}
  function isReal(r){return !!(S(r?.id)&&S(r?.studentId)&&S(r?.type||r?.content||r?.noiDung));}
  function dedupe(records){
    const seen=new Set();const out=[];
    for(const r of records){const key=stableId(r)||fingerprint(r);if(seen.has(key))continue;seen.add(key);out.push(r)}
    return out;
  }
  async function load(){
    const [a,b]=await Promise.all([api('get_students'),api('get_events')]);
    students=cleanStudents(a?.students);
    const ids=new Set(students.map(x=>S(x.id)));
    V=dedupe((Array.isArray(b?.VI_PHAM)?b.VI_PHAM:[]).filter(isReal).filter(x=>ids.has(S(x.studentId))));
    R=dedupe((Array.isArray(b?.KHEN_THUONG)?b.KHEN_THUONG:[]).filter(isReal).filter(x=>ids.has(S(x.studentId))));
  }
  function studentName(id){return S(students.find(s=>S(s.id)===S(id))?.name)||'Học sinh';}
  function badge(){
    const a=document.getElementById('violationBadge'),b=document.getElementById('rewardBadge');
    if(a)a.textContent=String(V.length);if(b)b.textContent=String(R.length);
  }
  function section(kind){return document.getElementById(kind==='V'?'page-violations':'page-rewards');}
  function body(kind){return document.getElementById(kind==='V'?'violationTableBody':'rewardTableBody');}
  function activate(kind){
    const target=kind==='V'?'violations':'rewards';
    document.querySelectorAll('[data-page-section]').forEach(x=>{const on=x.dataset.pageSection===target;x.classList.toggle('active',on);x.hidden=!on});
    document.querySelectorAll('.main-menu [data-page]').forEach(x=>x.classList.toggle('active',x.dataset.page===target));
    const t=document.getElementById('pageTitle');if(t)t.textContent=kind==='V'?'Vi phạm':'Khen thưởng';
    window.scrollTo?.({top:0,behavior:'smooth'});
  }
  function ensureControls(kind){
    const p=section(kind);if(!p)return;
    let bar=p.querySelector('.lh-events-toolbar');
    if(!bar){
      bar=document.createElement('div');bar.className='lh-events-toolbar';
      bar.innerHTML=`<div class="lh-events-toolbar-left"><span class="lh-events-count" data-lh-count></span><input class="lh-events-search" type="search" placeholder="Tìm học sinh hoặc nội dung..." aria-label="Tìm kiếm"></div><div class="lh-events-toolbar-right"><button type="button" class="button secondary" data-lh-refresh>↻ Làm mới</button><button type="button" class="button danger" data-lh-clear>Xóa tất cả</button></div>`;
      const anchor=p.querySelector('.info-banner,.table-container');if(anchor)anchor.parentNode.insertBefore(bar,anchor);else p.appendChild(bar);
      bar.querySelector('[data-lh-refresh]').onclick=async()=>{try{await load();renderAll();toast('Đã làm mới dữ liệu.','success')}catch(e){toast(e.message,'error')}};
      bar.querySelector('[data-lh-clear]').onclick=()=>clearAll(kind);
      bar.querySelector('.lh-events-search').addEventListener('input',()=>render(kind));
    }
  }
  function ensureTable(kind){
    const p=section(kind);if(!p)return null;
    let table=kind==='V'?p.querySelector('#violationTable'):p.querySelector('#rewardTable');
    if(!table){
      const wrap=document.createElement('div');wrap.className='table-container';
      const id=kind==='V'?'violationTable':'rewardTable';wrap.innerHTML=`<table class="data-table" id="${id}"><thead></thead><tbody id="${kind==='V'?'violationTableBody':'rewardTableBody'}"></tbody></table>`;
      p.appendChild(wrap);table=wrap.querySelector('table');
    }
    table.querySelector('thead').innerHTML=kind==='V'?'<tr><th>STT</th><th>Họ tên học sinh</th><th>Ngày vi phạm</th><th>Nội dung vi phạm</th><th>Hình thức xử lý</th><th>Thao tác</th></tr>':'<tr><th>STT</th><th>Họ tên học sinh</th><th>Ngày khen thưởng</th><th>Nội dung khen thưởng</th><th>Hình thức khen thưởng</th><th>Thao tác</th></tr>';
    return table;
  }
  function currentList(kind){
    const data=kind==='V'?V:R;const p=section(kind);const q=N(p?.querySelector('.lh-events-search')?.value);return data.filter(r=>{if(!q)return true;return N(studentName(r.studentId)).includes(q)||N(r.type||r.content||r.note).includes(q)}).sort((a,b)=>S(b.date).localeCompare(S(a.date))||S(b.createdAt).localeCompare(S(a.createdAt)));
  }
  function render(kind){
    ensureControls(kind);const table=ensureTable(kind);if(!table)return;const b=body(kind);if(!b)return;const list=currentList(kind);
    const countEl=section(kind)?.querySelector('[data-lh-count]');if(countEl)countEl.textContent=`${list.length} bản ghi`;
    const span=kind==='V'?6:6;
    if(!list.length){b.innerHTML=`<tr><td colspan="${span}"><div class="empty-state"><strong>${kind==='V'?'Chưa có dữ liệu vi phạm':'Chưa có dữ liệu khen thưởng'}</strong><p>Chỉ các bản ghi thực tế mới xuất hiện tại đây.</p></div></td></tr>`;badge();return;}
    b.innerHTML=list.map((r,i)=>{const id=E(stableId(r));const content=E(r.type||r.content||r.noiDung||'—');const form=E(kind==='V'?(r.action||r.resolution||r.handling||r.level||'—'):(r.formType||r.form||r.category||'—'));return `<tr><td>${i+1}</td><td><strong>${E(studentName(r.studentId))}</strong></td><td>${E(fmt(r.date))}</td><td>${content}</td><td>${form}</td><td><button type="button" class="icon-button" title="Sửa" data-lh-edit="${id}">✎</button><button type="button" class="icon-button danger" title="Xóa" data-lh-delete="${id}">🗑</button></td></tr>`}).join('');
    b.querySelectorAll('[data-lh-delete]').forEach(btn=>btn.onclick=()=>deleteOne(kind,btn.dataset.lhDelete));
    b.querySelectorAll('[data-lh-edit]').forEach(btn=>btn.onclick=()=>{const arr=kind==='V'?V:R;const rec=arr.find(x=>stableId(x)===S(btn.dataset.lhEdit));showForm(kind,rec)});
    badge();
  }
  function renderAll(){render('V');render('R');renderAIHook();}
  function selectedQuick(kind){
    const data=window.LH_BEHAVIOR_QUICK_OPTIONS;
    return kind==='V'?(data?.VIOLATIONS||[]):(data?.REWARDS||[]);
  }
  function opts(items,val){return items.map(([v,l])=>`<option value="${E(v)}" ${S(v)===S(val)?'selected':''}>${E(l)}</option>`).join('')}
  function showForm(kind,rec={}){
    const isV=kind==='V';const m=document.createElement('div');m.className='ev-static-modal';
    const items=selectedQuick(kind);const fallback=isV?selectedQuick('V'):[ ];
    m.innerHTML=`<div class="ev-static-dialog ev-wide"><div class="ev-static-head"><h3>${rec.id?'Chỉnh sửa':'Ghi nhận'} ${isV?'vi phạm':'khen thưởng'}</h3><button type="button" data-close>✕</button></div><div class="form-grid"><label>Ngày<input id="eDate" type="date" value="${E(rec.date||today())}"></label><label>Học sinh<select id="eStudent"><option value="">Chọn học sinh</option>${students.map(s=>`<option value="${E(s.id)}" ${S(s.id)===S(rec.studentId)?'selected':''}>${E(s.name)}</option>`).join('')}</select></label><label class="full">${isV?'Nội dung vi phạm':'Nội dung khen thưởng'}<select id="eType"><option value="">Chọn nội dung</option>${opts(items,rec.type)}</select></label>${isV?`<label>Mức độ<select id="eLevel">${opts([['light','Nhẹ'],['attention','Cần lưu ý'],['serious','Nghiêm trọng']],rec.level||'light')}</select></label><label>Trạng thái<select id="eStatus">${opts([['monitoring','Đang theo dõi'],['resolved','Đã khắc phục']],rec.status||'monitoring')}</select></label><label>Hình thức xử lý<select id="eAction">${opts([['Nhắc nhở','Nhắc nhở'],['Trao đổi','Trao đổi'],['Hỗ trợ','Hỗ trợ'],['Tư vấn','Tư vấn'],['Phối hợp phụ huynh','Phối hợp phụ huynh']],rec.action||'Nhắc nhở')}</select></label>`:`<label>Hình thức khen thưởng<select id="eForm">${opts([['praise','Tuyên dương'],['certificate','Giấy khen'],['reward','Phần thưởng'],['other','Khác']],rec.formType||'praise')}</select></label>`}<label class="full">Ghi chú<textarea id="eNote" rows="3">${E(rec.note||'')}</textarea></label></div><div class="ev-static-actions"><button type="button" class="button secondary" data-close>Hủy</button><button type="button" class="button primary" id="eSave">Lưu</button></div></div>`;
    document.body.appendChild(m);m.querySelectorAll('[data-close]').forEach(x=>x.onclick=()=>m.remove());
    m.querySelector('#eSave').onclick=async()=>{const studentId=S(m.querySelector('#eStudent').value),type=S(m.querySelector('#eType').value);if(!studentId||!type){toast('Vui lòng chọn học sinh và nội dung.','warning');return}const rec2={id:S(rec.id),studentId,date:S(m.querySelector('#eDate').value)||today(),type,note:S(m.querySelector('#eNote').value)};if(isV){rec2.level=S(m.querySelector('#eLevel').value);rec2.status=S(m.querySelector('#eStatus').value);rec2.action=S(m.querySelector('#eAction').value)}else rec2.formType=S(m.querySelector('#eForm').value);try{await api('save_event',{payload:JSON.stringify({sheet:isV?'VI_PHAM':'KHEN_THUONG',record:rec2})});await load();m.remove();renderAll();toast('Đã lưu thành công.','success')}catch(e){toast('Lưu thất bại: '+e.message,'error')}};
  }
  async function deleteOne(kind,id){if(!S(id)){toast('Không xác định được ID bản ghi.','error');return}if(!confirm('Xóa đúng bản ghi này trên Google Sheets?'))return;const sheet=kind==='V'?'VI_PHAM':'KHEN_THUONG';try{await api('delete_event',{sheet,id,eventId:id,recordId:id});const after=await api('get_events');if((Array.isArray(after?.[sheet])?after[sheet]:[]).some(x=>stableId(x)===S(id)))throw Error('Google Sheets chưa xác nhận đã xóa.');await load();renderAll();toast('Đã xóa bản ghi.','success')}catch(e){toast('Xóa thất bại: '+e.message,'error')}}
  async function clearAll(kind){const sheet=kind==='V'?'VI_PHAM':'KHEN_THUONG';let raw=[];try{const x=await api('get_events');raw=(Array.isArray(x?.[sheet])?x[sheet]:[]).filter(isReal);if(!raw.length){toast('Không có dữ liệu để xóa.','warning');return}if(!confirm(`Xóa toàn bộ ${raw.length} bản ghi ${kind==='V'?'vi phạm':'khen thưởng'} trên Google Sheets?\n\nThao tác này không thể hoàn tác.`))return;for(const r of raw){const id=stableId(r);if(id)await api('delete_event',{sheet,id,eventId:id,recordId:id})}const after=await api('get_events');const left=(Array.isArray(after?.[sheet])?after[sheet]:[]).filter(isReal);if(left.length)throw Error(`Còn ${left.length} bản ghi chưa xóa được trên Google Sheets.`);await load();renderAll();toast(`Đã xóa toàn bộ ${kind==='V'?'vi phạm':'khen thưởng'}.`,'success')}catch(e){toast('Xóa tất cả thất bại: '+e.message,'error')}}
  function renderAIHook(){if(window.__LH_BEHAVIOR_AI_API__?.refresh)try{window.__LH_BEHAVIOR_AI_API__.refresh()}catch(e){console.warn(e)}}
  function toast(msg,type){if(typeof window.showToast==='function')window.showToast(msg,type);else alert(msg)}
  function css(){if(document.getElementById('lhEventsV30Css'))return;const s=document.createElement('style');s.id='lhEventsV30Css';s.textContent=`.lh-events-toolbar{display:flex;justify-content:space-between;gap:12px;align-items:center;margin:14px 0;padding:12px 14px;border:1px solid #e2e8f0;border-radius:12px;background:#f8fafc}.lh-events-toolbar-left,.lh-events-toolbar-right{display:flex;align-items:center;gap:8px}.lh-events-search{width:min(360px,42vw);padding:9px 12px;border:1px solid #dbe3ef;border-radius:9px}.lh-events-count{font-size:13px;font-weight:700;color:#475569}.ev-static-modal{position:fixed;inset:0;background:rgba(15,23,42,.5);z-index:100000;display:flex;align-items:center;justify-content:center;padding:18px}.ev-static-dialog{background:#fff;border-radius:18px;padding:20px;width:min(760px,100%);max-height:92vh;overflow:auto}.ev-wide{width:min(980px,100%)}.ev-static-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px}.ev-static-head button{border:0;background:none;font-size:22px;cursor:pointer}.ev-static-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:16px}@media(max-width:700px){.lh-events-toolbar{flex-direction:column;align-items:stretch}.lh-events-toolbar-left,.lh-events-toolbar-right{justify-content:space-between}.lh-events-search{width:100%}}`;document.head.appendChild(s)}
  function intercept(){
    const v=document.querySelector('.main-menu [data-page="violations"]'),r=document.querySelector('.main-menu [data-page="rewards"]');
    const av=document.querySelector('#page-violations [data-action="add-violation"]'),ar=document.querySelector('#page-rewards [data-action="add-reward"]');
    if(v)v.addEventListener('click',async e=>{e.preventDefault();e.stopImmediatePropagation();activate('V');try{await load();render('V')}catch(err){toast(err.message,'error')}},{capture:true});
    if(r)r.addEventListener('click',async e=>{e.preventDefault();e.stopImmediatePropagation();activate('R');try{await load();render('R')}catch(err){toast(err.message,'error')}},{capture:true});
    if(av)av.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();activate('V');showForm('V')},{capture:true});
    if(ar)ar.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();activate('R');showForm('R')},{capture:true});
  }
  async function start(){css();intercept();try{await load();renderAll()}catch(e){console.warn('[EVENTS 3.0]',e);renderAll()}}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();