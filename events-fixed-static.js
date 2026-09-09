/* EVENTS FIXED STATIC — CANONICAL EVENTS MENU V2
 * Vi phạm/Khen thưởng chỉ hiển thị bản ghi thực sự có dữ liệu.
 * Không tạo dòng cho học sinh không có vi phạm.
 * Xóa phải xác định đúng ID bản ghi trên Google Sheets và xác minh sau xóa.
 */
(function(){
  'use strict';
  if(window.__LH_EVENTS_FIXED_STATIC_V2__) return;
  window.__LH_EVENTS_FIXED_STATIC_V2__=true;
  const API=()=>String(window.GOOGLE_API_CONFIG?.url||'').trim();
  const S=v=>String(v??'').trim();
  const E=v=>S(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\"/g,'&quot;').replace(/'/g,'&#039;');
  const N=v=>S(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ');
  const today=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
  const fmt=v=>{const m=S(v).match(/^(\d{4})-(\d{2})-(\d{2})/);return m?`${m[3]}/${m[2]}/${m[1]}`:S(v)};
  let students=[];let V=[];let R=[];
  const vTypes=['Đi học muộn','Chưa chuẩn bị bài','Chưa hoàn thành bài','Chưa hoàn thành nhiệm vụ','Quên đồ dùng','Mất trật tự','Chưa thực hiện nhiệm vụ nhóm','Vi phạm nội quy','Hành vi chưa phù hợp','Khác'];
  const vLevels=['Nhẹ','Trung bình','Nặng'];
  const vStatus=['Đang theo dõi','Đã xử lý'];
  const vActions=['Nhắc nhở','Trao đổi','Hỗ trợ','Tư vấn','Phối hợp phụ huynh'];
  const rTypes=['Việc tốt','Học tập','Thành tích','Tuyên dương','Khác'];
  const rForms=['Tuyên dương','Giấy khen','Phần thưởng','Ghi nhận'];
  async function api(action,params={}){
    const base=API();if(!base)throw Error('Chưa có cấu hình Google Apps Script.');
    const r=await fetch(base+'?'+new URLSearchParams({action,...params}),{cache:'no-store'});
    const j=await r.json();if(!j?.ok)throw Error(j?.error||'Máy chủ trả lỗi');return j;
  }
  function isRealViolation(x){
    if(!x||!S(x.id)||!S(x.studentId))return false;
    const type=S(x.type||x.violationType||x.content||x.noiDung);if(!type)return false;
    const forbidden=new Set(['all','none','null','undefined','present','absent','excused','active','inactive','đang học','không còn học']);
    return !forbidden.has(N(type));
  }
  function validStudentsMap(){const m=new Map();students.forEach(s=>{const id=S(s?.id||s?.studentId);if(id)m.set(id,s)});return m;}
  async function load(){
    const [a,b]=await Promise.all([api('get_students'),api('get_events')]);
    students=Array.isArray(a.students)?a.students:[];const map=validStudentsMap();
    V=(Array.isArray(b?.VI_PHAM)?b.VI_PHAM:[]).filter(isRealViolation).filter(x=>map.has(S(x.studentId)));
    R=(Array.isArray(b?.KHEN_THUONG)?b.KHEN_THUONG:[]).filter(x=>S(x?.id)&&S(x?.studentId)&&map.has(S(x.studentId))&&S(x?.type));
  }
  function name(id){const x=students.find(s=>S(s?.id)===S(id));return S(x?.name)||S(id)||'Học sinh';}
  function badge(){const a=document.getElementById('violationBadge'),b=document.getElementById('rewardBadge');if(a)a.textContent=String(V.length);if(b)b.textContent=String(R.length);}
  function activateSection(kind){
    const page=kind==='V'?'page-violations':'page-rewards';
    document.querySelectorAll('[data-page-section]').forEach(x=>{const active=x.id===page;x.classList.toggle('active',active);x.hidden=!active});
    document.querySelectorAll('.main-menu [data-page]').forEach(x=>x.classList.toggle('active',x.dataset.page===(kind==='V'?'violations':'rewards')));
    const t=document.getElementById('pageTitle');if(t)t.textContent=kind==='V'?'Vi phạm':'Khen thưởng';
  }
  function open(kind){activateSection(kind);render(kind);}
  function render(kind){
    const isV=kind==='V',arr=isV?V:R,body=document.getElementById(isV?'violationTableBody':'rewardTableBody');if(!body)return;
    if(isV){const table=body.closest('table'),thead=table?.querySelector('thead');if(thead)thead.innerHTML='<tr><th>STT</th><th>Học sinh</th><th>Số lượt</th><th>Gần nhất</th><th>Nội dung</th><th>Trạng thái</th><th>Thao tác</th></tr>'}
    const map=new Map();arr.forEach(x=>{const sid=S(x.studentId);if(!sid)return;if(!map.has(sid))map.set(sid,{id:sid,name:name(sid),n:0,last:x});const item=map.get(sid);item.n++;if(S(x.date)>S(item.last.date))item.last=x});
    const rows=[...map.values()].sort((a,b)=>S(b.last.date).localeCompare(S(a.last.date))||b.n-a.n);
    if(!rows.length){body.innerHTML=`<tr><td colspan="7"><div class="empty-state"><strong>${isV?'Chưa có dữ liệu vi phạm':'Chưa có dữ liệu khen thưởng'}</strong><p>Chỉ các bản ghi thực tế mới xuất hiện tại đây.</p></div></td></tr>`;badge();return;}
    body.innerHTML=rows.map((x,i)=>`<tr><td>${i+1}</td><td><strong>${E(x.name)}</strong></td><td>${x.n}</td><td>${E(fmt(x.last.date))}</td><td>${E(x.last.type||'—')}</td><td>${E(isV?(x.last.status||'Đang theo dõi'):(x.last.formType||'—'))}</td><td><button type="button" class="button small" data-lh-detail="${E(x.id)}">Chi tiết</button></td></tr>`).join('');
    body.querySelectorAll('[data-lh-detail]').forEach(b=>b.addEventListener('click',()=>details(kind,b.dataset.lhDetail)));badge();
  }
  function options(list,val){return list.map(x=>`<option value="${E(x)}" ${S(x)===S(val)?'selected':''}>${E(x)}</option>`).join('');}
  function show(kind,rec={}){
    const isV=kind==='V',m=document.createElement('div');m.className='ev-static-modal';
    m.innerHTML=`<div class="ev-static-dialog"><div class="ev-static-head"><h3>${rec.id?'Chỉnh sửa':'Ghi nhận'} ${isV?'vi phạm':'khen thưởng'}</h3><button type="button" id="lhClose" aria-label="Đóng">✕</button></div><div class="form-grid"><label>Ngày<input id="lhDate" type="date" value="${E(rec.date||today())}"></label><label>Học sinh<select id="lhStudent"><option value="">Chọn học sinh</option>${students.map(s=>`<option value="${E(s.id)}" ${S(s.id)===S(rec.studentId)?'selected':''}>${E(s.name)}</option>`).join('')}</select></label><label>${isV?'Nội dung':'Thành tích'}<select id="lhType"><option value="">Chọn</option>${options(isV?vTypes:rTypes,rec.type)}</select></label>${isV?`<label>Mức độ<select id="lhLevel">${options(vLevels,rec.level||'Nhẹ')}</select></label><label>Trạng thái<select id="lhStatus">${options(vStatus,rec.status||'Đang theo dõi')}</select></label><label>Biện pháp<select id="lhAction">${options(vActions,rec.action||'Nhắc nhở')}</select></label>`:`<label>Hình thức<select id="lhForm">${options(rForms,rec.formType||'Tuyên dương')}</select></label>`}<label class="full">Ghi chú<textarea id="lhNote" rows="3">${E(rec.note||'')}</textarea></label></div><div class="ev-static-actions"><button type="button" id="lhCancel" class="button secondary">Hủy</button><button type="button" id="lhSave" class="button primary">Lưu</button></div></div>`;
    document.body.appendChild(m);const close=()=>m.remove();m.querySelector('#lhClose').onclick=close;m.querySelector('#lhCancel').onclick=close;
    m.querySelector('#lhSave').onclick=async()=>{
      const id=S(m.querySelector('#lhStudent').value),type=S(m.querySelector('#lhType').value);if(!id||!type){alert('Vui lòng chọn học sinh và nội dung.');return;}
      const rec2={id:rec.id||'',studentId:id,date:S(m.querySelector('#lhDate').value)||today(),type,note:S(m.querySelector('#lhNote').value)};
      if(isV){rec2.level=S(m.querySelector('#lhLevel').value);rec2.status=S(m.querySelector('#lhStatus').value);rec2.action=S(m.querySelector('#lhAction').value)}else rec2.formType=S(m.querySelector('#lhForm').value);
      try{await api('save_event',{payload:JSON.stringify({sheet:isV?'VI_PHAM':'KHEN_THUONG',record:rec2})});await load();close();open(kind)}catch(e){alert('Lưu thất bại: '+e.message)}
    };
  }
  function same(a,b){return N(a)===N(b)}
  function matchRecord(x,rec){if(!x||!rec)return false;if(S(x.id)&&S(rec.id)&&same(x.id,rec.id))return true;return S(x.studentId)===S(rec.studentId)&&same(x.date,rec.date)&&same(x.type,rec.type)&&same(x.level,rec.level)&&same(x.status,rec.status)&&same(x.action,rec.action)&&same(x.note,rec.note)}
  async function deleteRecord(kind,rec){
    const sheet=kind==='V'?'VI_PHAM':'KHEN_THUONG';const events=await api('get_events');const list=Array.isArray(events?.[sheet])?events[sheet]:[];const target=list.find(x=>matchRecord(x,rec));const realId=S(target?.id||rec.id);if(!realId)throw Error('Không xác định được ID bản ghi cần xóa.');
    const result=await api('delete_event',{sheet,id:realId,recordId:realId,eventId:realId});if(result?.deleted!==true&&Number(result?.deletedCount||0)<1)throw Error(result?.error||'Google Sheets không xác nhận đã xóa.');
    const after=await api('get_events');if(Array.isArray(after?.[sheet])&&after[sheet].some(x=>S(x.id)===realId))throw Error('Bản ghi vẫn còn trên Google Sheets sau khi xóa.');
  }
  function details(kind,id){
    const isV=kind==='V',arr=(isV?V:R).filter(x=>S(x.studentId)===S(id)).sort((a,b)=>S(b.date).localeCompare(S(a.date))||S(b.createdAt).localeCompare(S(a.createdAt)));
    const m=document.createElement('div');m.className='ev-static-modal';
    m.innerHTML=`<div class="ev-static-dialog ev-wide"><div class="ev-static-head"><h3>${isV?'Vi phạm':'Khen thưởng'} — ${E(name(id))}</h3><button type="button" id="dClose" aria-label="Đóng">✕</button></div><table class="data-table"><thead><tr><th>Ngày</th><th>${isV?'Nội dung':'Thành tích'}</th><th>${isV?'Mức độ':'Hình thức'}</th><th>${isV?'Trạng thái':'Ghi chú'}</th><th>Thao tác</th></tr></thead><tbody>${arr.map(x=>`<tr><td>${E(fmt(x.date))}</td><td>${E(x.type)}</td><td>${E(isV?(x.level||'Nhẹ'):(x.formType||'—'))}</td><td>${E(isV?(x.status||'Đang theo dõi'):(x.note||'—'))}</td><td><button type="button" class="button small" data-ed="${E(x.id)}">Sửa</button> <button type="button" class="button small danger" data-del="${E(x.id)}">Xóa</button></td></tr>`).join('')}</tbody></table></div>`;
    document.body.appendChild(m);m.querySelector('#dClose').onclick=()=>m.remove();
    m.querySelectorAll('[data-ed]').forEach(b=>b.onclick=()=>{const x=arr.find(z=>S(z.id)===S(b.dataset.ed));m.remove();show(kind,x)});
    m.querySelectorAll('[data-del]').forEach(b=>b.onclick=async()=>{const rec=arr.find(x=>S(x.id)===S(b.dataset.ed||b.dataset.del));if(!rec)return;if(!confirm('Xóa đúng lượt này trên Google Sheets?'))return;try{await deleteRecord(kind,rec);await load();m.remove();open(kind)}catch(e){alert('Xóa thất bại: '+e.message)}});
  }
  function css(){if(document.getElementById('lhStaticEventCssV2'))return;const s=document.createElement('style');s.id='lhStaticEventCssV2';s.textContent='.ev-static-modal{position:fixed;inset:0;background:rgba(15,23,42,.5);z-index:100000;display:flex;align-items:center;justify-content:center;padding:18px}.ev-static-dialog{background:#fff;border-radius:18px;padding:20px;width:min(760px,100%);max-height:92vh;overflow:auto}.ev-wide{width:min(1050px,100%)}.ev-static-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px}.ev-static-head button{border:0;background:none;font-size:22px;cursor:pointer}.ev-static-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:16px}';document.head.appendChild(s)}
  function install(){
    const v=document.querySelector('.main-menu [data-page="violations"]'),r=document.querySelector('.main-menu [data-page="rewards"]'),av=document.querySelector('[data-action="add-violation"]'),ar=document.querySelector('[data-action="add-reward"]');
    if(v)v.onclick=e=>{e.preventDefault();e.stopPropagation();open('V')};if(r)r.onclick=e=>{e.preventDefault();e.stopPropagation();open('R')};if(av)av.onclick=e=>{e.preventDefault();e.stopPropagation();activateSection('V');show('V')};if(ar)ar.onclick=e=>{e.preventDefault();e.stopPropagation();activateSection('R');show('R')};badge();
  }
  async function start(){css();try{await load()}catch(e){console.error('[EVENTS V2]',e)}install();badge();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();