/* VI PHẠM - MENU RIÊNG
   Chỉ render #page-violations / #violationTableBody.
   Không đụng Điểm danh, Khen thưởng, Thống kê hay CSDL.
*/
(function(){
'use strict';
if(window.__LH_VIOLATIONS_MENU_FINAL__) return;
window.__LH_VIOLATIONS_MENU_FINAL__=true;

const S=v=>String(v??'').trim();
const N=v=>S(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const E=v=>S(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
const MAP={preparation:'Chưa chuẩn bị bài',assignment:'Chưa hoàn thành nhiệm vụ','school-supplies':'Quên đồ dùng',discipline:'Mất trật tự',late:'Đi học muộn','group-work':'Chưa thực hiện nhiệm vụ nhóm',rules:'Vi phạm nội quy',other:'Khác',light:'Nhẹ',minor:'Nhẹ',low:'Nhẹ',medium:'Trung bình',major:'Nặng',high:'Nặng',severe:'Nghiêm trọng',warning:'Nhắc nhở',reminder:'Nhắc nhở',monitoring:'Đang theo dõi',resolved:'Đã khắc phục',counseling:'Tư vấn',support:'Hỗ trợ','parent-contact':'Trao đổi với phụ huynh'};
const VI=v=>MAP[N(v)]||S(v);

function records(){
  try{if(typeof violationRecords!=='undefined' && Array.isArray(violationRecords)) return violationRecords.slice();}catch(e){}
  try{if(typeof APP_DATA!=='undefined' && Array.isArray(APP_DATA.violations)) return APP_DATA.violations.slice();}catch(e){}
  try{if(typeof getViolationRecords==='function'){const x=getViolationRecords();if(Array.isArray(x))return x.slice();}}catch(e){}
  if(Array.isArray(window.violationRecords)) return window.violationRecords.slice();
  if(Array.isArray(window.APP_DATA?.violations)) return window.APP_DATA.violations.slice();
  return [];
}
function studentsList(){
  try{if(typeof students!=='undefined'&&Array.isArray(students))return students;}catch(e){}
  try{if(typeof APP_DATA!=='undefined'&&Array.isArray(APP_DATA.students))return APP_DATA.students;}catch(e){}
  return Array.isArray(window.students)?window.students:[];
}
function studentName(r){
  const id=S(r.studentId??r.student_id??r.idHocSinh??r.studentID??r.student);
  const a=studentsList();
  const x=a.find(s=>S(s?.id??s?.studentId)===id);
  return x?S(x.name??x.fullName??x.hoTen):S(r.studentName??r.hocSinh??r.name??id??'Học sinh');
}
function dateValue(r){return r?.date??r?.ngay??r?.createdAt??r?.created_at??r?.timestamp??'';}
function dateText(v){const s=S(v),m=s.match(/^(\d{4})-(\d{2})-(\d{2})/);return m?`${m[3]}/${m[2]}/${m[1]}`:s;}
function body(){return document.querySelector('#page-violations #violationTableBody')||document.querySelector('#violationTableBody');}
function render(){
  const b=body(); if(!b)return;
  let rows=records();
  const page=document.querySelector('#page-violations');
  const search=N(page?.querySelector('#violationSearch')?.value);
  const type=N(page?.querySelector('#violationTypeFilter')?.value);
  const period=N(page?.querySelector('#violationPeriodFilter')?.value);
  if(search) rows=rows.filter(r=>N(studentName(r)).includes(search)||N(r.type??r.content??r.violationType??r.noiDung??r.note).includes(search));
  if(type&&type!=='all') rows=rows.filter(r=>N(r.type??r.content??r.violationType??r.noiDung)===type);
  if(period&&period!=='all'){
    const now=new Date(); rows=rows.filter(r=>{const d=new Date(dateValue(r));if(isNaN(d))return false;if(period==='week'){const x=new Date(now);const day=x.getDay()||7;x.setHours(0,0,0,0);x.setDate(x.getDate()-day+1);return d>=x;}if(period==='month')return d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear();return true;});
  }
  rows.sort((a,b)=>String(dateValue(b)).localeCompare(String(dateValue(a))));
  if(!rows.length){b.innerHTML='<tr><td colspan="7"><div class="empty-state"><strong>Chưa có dữ liệu vi phạm</strong><p>Các lượt vi phạm đã ghi nhận sẽ xuất hiện tại đây.</p></div></td></tr>';return;}
  b.innerHTML=rows.map(r=>{
    const id=S(r.id??r.violationId??r.ID);
    const typeText=VI(r.type??r.content??r.violationType??r.noiDung??r.note)||'Khác';
    const level=VI(r.level??r.severity??r.mucDo)||'Nhẹ';
    const action=VI(r.action??r.measure??r.bienPhap)||'Chưa ghi';
    const status=VI(r.status??r.trangThai)||'Đang theo dõi';
    return `<tr><td>${E(dateText(dateValue(r)))}</td><td><strong>${E(studentName(r))}</strong></td><td>${E(typeText)}</td><td>${E(level)}</td><td>${E(action)}</td><td>${E(status)}</td><td>${id?`<button type="button" class="icon-button danger" data-violation-delete="${E(id)}" title="Xóa lượt vi phạm"><i class="fa-solid fa-trash"></i></button>`:''}</td></tr>`;
  }).join('');
}
document.addEventListener('click',e=>{const x=e.target.closest?.('[data-violation-delete]');if(!x)return;e.preventDefault();e.stopPropagation();const id=x.dataset.violationDelete;if(!confirm('Xóa đúng lượt vi phạm này?'))return;try{const f=window.deleteViolation||window.removeViolation;if(typeof f==='function')Promise.resolve(f(id)).then(render);}catch(err){}},true);
document.addEventListener('input',e=>{if(e.target.closest?.('#page-violations'))render();});
document.addEventListener('change',e=>{if(e.target.closest?.('#page-violations'))render();});
document.addEventListener('click',e=>{if(e.target.closest?.('[data-page="violations"]'))setTimeout(render,50);});
const start=()=>{render();[100,500,1000,2000].forEach(x=>setTimeout(render,x));};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
setInterval(render,1000);
window.__LH_VIOLATIONS_MENU_API__={refresh:render};

/* ============================================================
   DELETE ALL — VI PHAM + KHEN THUONG
   Dùng API backend nếu có; không xóa HOC_SINH/DIEM_DANH.
   ============================================================ */
function apiUrl(){ return 'https://script.google.com/macros/s/AKfycbxTPwf-jhrR8JOoKY5ZLuzlsDgcv3nWILtDPTrYNWZCEPpm2rkpXTn-sPAdFaUyy0z_uw/exec'; }
async function callDeleteAll(sheet){
  const url=apiUrl();
  if(!url) throw new Error('Chưa cấu hình URL Google Apps Script.');
  const target=sheet==='VI_PHAM'?'VI_PHAM':'KHEN_THUONG';
  const r=await fetch(url+'?action=delete_all_events&sheet='+encodeURIComponent(target),{method:'GET',cache:'no-store'});
  const data=await r.json();
  if(!data.ok) throw new Error(data.error||'API xóa tất cả thất bại.');
  return data;
}
function injectDeleteAllButton(){ return; // disabled: final bridge below is the single source of truth

  const page=document.querySelector('#page-violations');
  if(!page) return;
  const host=page.querySelector('.page-actions')||page.querySelector('.page-header');
  if(!host || host.querySelector('#lhDeleteAllViolations')) return;
  const b=document.createElement('button');
  b.type='button';b.id='lhDeleteAllViolations';b.className='button danger';
  b.innerHTML='<i class="fa-solid fa-trash-can"></i> Xóa tất cả';
  b.addEventListener('click',async()=>{
    const count=records().length;
    if(!count){alert('Không có lượt vi phạm để xóa.');return;}
    if(!confirm(`Xóa TOÀN BỘ ${count} lượt vi phạm?\n\nKhông xóa học sinh và điểm danh.`))return;
    b.disabled=true;
    try{const result=await callDeleteAll('VI_PHAM');alert(`Đã xóa ${Number(result.deleted||0)} lượt vi phạm.`);location.reload();}
    catch(err){alert('Không thể xóa tất cả — '+(err.message||err));b.disabled=false;}
  });
  host.appendChild(b);
}
const inject=()=>{injectDeleteAllButton();};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',inject,{once:true});else inject();
setInterval(inject,1000);

})();

/* ============================================================
   HỌC TẬP — GIAI ĐOẠN 1
   1 lượt kết quả = 1 dòng
   Bảng riêng HOC_TAP, liên kết bằng studentId.
   Không đụng Điểm danh / Vi phạm / Khen thưởng / Thống kê.
   ============================================================ */
(function(){
'use strict';
if(window.__LH_LEARNING_PHASE1__) return;
window.__LH_LEARNING_PHASE1__=true;

const S=v=>String(v??'').trim();
const E=v=>S(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
const today=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
const fmt=v=>{const s=S(v);const m=s.match(/^(\d{4})-(\d{2})-(\d{2})/);return m?`${m[3]}/${m[2]}/${m[1]}`:s;};
function getStudents(){try{if(typeof students!=='undefined'&&Array.isArray(students))return students;}catch(e){}try{if(typeof APP_DATA!=='undefined'&&Array.isArray(APP_DATA.students))return APP_DATA.students;}catch(e){}return Array.isArray(window.students)?window.students:[];}
function getLearning(){try{if(typeof learningRecords!=='undefined'&&Array.isArray(learningRecords))return learningRecords;}catch(e){}try{if(typeof APP_DATA!=='undefined'&&Array.isArray(APP_DATA.learning))return APP_DATA.learning;}catch(e){}return Array.isArray(window.learningRecords)?window.learningRecords:[];}
function studentName(id){const x=getStudents().find(s=>S(s?.id??s?.studentId)===S(id));return x?S(x.name??x.fullName??x.hoTen):S(id);}
function saveData(){try{if(typeof syncAppDataReferences==='function')syncAppDataReferences();if(typeof saveClassData==='function')return saveClassData();}catch(e){console.error('[HỌC TẬP]',e);}return false;}
function ensurePage(){const page=document.getElementById('page-learning');if(!page)return null;if(page.dataset.phase1Ready==='1')return page;page.dataset.phase1Ready='1';page.innerHTML=`<div class="page-header"><div><span class="page-eyebrow"><i class="fa-solid fa-book-open"></i> Theo dõi học tập</span><h1>Tình hình học tập</h1><p>Ghi nhận kết quả học tập và theo dõi từng lượt đánh giá.</p></div><div class="page-actions"><button type="button" class="button primary" id="lhLearningAdd"><i class="fa-solid fa-plus"></i> Ghi nhận kết quả</button></div></div><div class="toolbar"><div class="toolbar-search"><i class="fa-solid fa-magnifying-glass"></i><input type="search" id="lhLearningSearch" placeholder="Tìm học sinh hoặc nội dung..."></div><select id="lhLearningSubject"><option value="">Tất cả môn học</option><option>Toán</option><option>Tiếng Việt</option><option>Khoa học</option><option>Lịch sử và Địa lí</option><option>Công nghệ</option><option>Tin học</option><option>Ngoại ngữ</option></select><select id="lhLearningPeriod"><option value="">Tất cả thời gian</option><option value="week">Tuần này</option><option value="month">Tháng này</option><option value="semester">Học kỳ</option></select></div><div class="table-container"><table class="data-table"><thead><tr><th>STT</th><th>Ngày</th><th>Học sinh</th><th>Môn</th><th>Nội dung</th><th>Kết quả</th><th>Nhận xét</th><th>Thao tác</th></tr></thead><tbody id="lhLearningBody"></tbody></table></div><div id="lhLearningFormWrap" hidden style="margin-top:18px"><section class="dashboard-panel"><div class="panel-header"><div><h3>Ghi nhận kết quả</h3><p>Mỗi lần đánh giá được lưu thành một dòng dữ liệu.</p></div></div><div class="form-grid"><label>Ngày<input type="date" id="lhDate" value="${today()}"></label><label>Học sinh<select id="lhStudent"><option value="">Chọn học sinh</option></select></label><label>Môn học<select id="lhSubject"><option value="">Chọn môn học</option><option>Toán</option><option>Tiếng Việt</option><option>Khoa học</option><option>Lịch sử và Địa lí</option><option>Công nghệ</option><option>Tin học</option><option>Ngoại ngữ</option></select></label><label>Loại kết quả<select id="lhResultType"><option value="DIEM">Điểm</option><option value="MUC_DAT">Mức đạt</option><option value="NHAN_XET">Nhận xét</option></select></label><label>Nội dung<input type="text" id="lhContent" placeholder="Ví dụ: Phân số"></label><label>Điểm<input type="number" id="lhScore" min="0" max="10" step="0.1" placeholder="0–10"></label><label>Mức đạt<select id="lhLevel"><option value="">Chọn mức đạt</option><option>Tốt</option><option>Đạt</option><option>Chưa đạt</option></select></label><label>Nhận xét<input type="text" id="lhComment" placeholder="Nhận xét ngắn"></label><label>Ghi chú<input type="text" id="lhNote" placeholder="Ghi chú thêm"></label></div><div class="page-actions" style="margin-top:16px"><button type="button" class="button secondary" id="lhLearningCancel">Hủy</button><button type="button" class="button primary" id="lhLearningSave"><i class="fa-solid fa-floppy-disk"></i> Lưu kết quả</button></div></section></div>`;populateStudents();bindPageEvents();return page;}
function populateStudents(){const s=document.getElementById('lhStudent');if(!s)return;const old=s.value;s.innerHTML='<option value="">Chọn học sinh</option>';getStudents().slice().sort((a,b)=>S(a.name).localeCompare(S(b.name),'vi')).forEach(x=>{const o=document.createElement('option');o.value=S(x.id??x.studentId);o.textContent=S(x.name??x.fullName??x.hoTen);s.appendChild(o);});s.value=old;}
function renderLearning(){const page=ensurePage();if(!page)return;populateStudents();const body=document.getElementById('lhLearningBody');if(!body)return;let rows=getLearning().slice();const q=S(document.getElementById('lhLearningSearch')?.value).toLocaleLowerCase('vi');const subject=S(document.getElementById('lhLearningSubject')?.value);const period=S(document.getElementById('lhLearningPeriod')?.value);if(q)rows=rows.filter(r=>`${studentName(r.studentId)} ${S(r.content)} ${S(r.comment)}`.toLocaleLowerCase('vi').includes(q));if(subject)rows=rows.filter(r=>S(r.subject)===subject);if(period){const now=new Date();rows=rows.filter(r=>{const d=new Date(S(r.date));if(isNaN(d))return false;if(period==='month')return d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear();if(period==='week'){const x=new Date(now);const day=x.getDay()||7;x.setHours(0,0,0,0);x.setDate(x.getDate()-day+1);return d>=x;}return true;});}rows.sort((a,b)=>S(b.date).localeCompare(S(a.date)));if(!rows.length){body.innerHTML='<tr><td colspan="8"><div class="empty-state"><span class="empty-icon"><i class="fa-solid fa-book-open"></i></span><strong>Chưa có dữ liệu học tập</strong><p>Hãy bấm “Ghi nhận kết quả” để bắt đầu.</p></div></td></tr>';return;}body.innerHTML=rows.map((r,i)=>{const result=r.resultType==='DIEM'?S(r.score):S(r.level)||S(r.comment)||'—';return `<tr><td>${i+1}</td><td>${E(fmt(r.date))}</td><td><strong>${E(studentName(r.studentId))}</strong></td><td>${E(r.subject)}</td><td>${E(r.content)}</td><td>${E(result)}</td><td>${E(r.comment)}</td><td><button type="button" class="icon-button danger" data-learning-delete="${E(r.id)}" title="Xóa lượt ghi nhận"><i class="fa-solid fa-trash"></i></button></td></tr>`;}).join('');}
function bindPageEvents(){if(window.__LH_LEARNING_EVENTS__)return;window.__LH_LEARNING_EVENTS__=true;document.addEventListener('click',e=>{const add=e.target.closest?.('#lhLearningAdd');if(add){document.getElementById('lhLearningFormWrap').hidden=false;populateStudents();return;}const cancel=e.target.closest?.('#lhLearningCancel');if(cancel){document.getElementById('lhLearningFormWrap').hidden=true;return;}const save=e.target.closest?.('#lhLearningSave');if(save){saveLearning();return;}const del=e.target.closest?.('[data-learning-delete]');if(del){deleteLearning(del.dataset.learningDelete);return;}if(e.target.closest?.('[data-page="learning"]'))setTimeout(renderLearning,50);});['input','change'].forEach(ev=>document.addEventListener(ev,e=>{if(e.target.closest?.('#page-learning'))renderLearning();}));}
function saveLearning(){let arr=getLearning();const studentId=S(document.getElementById('lhStudent')?.value);const subject=S(document.getElementById('lhSubject')?.value);const content=S(document.getElementById('lhContent')?.value);const date=S(document.getElementById('lhDate')?.value)||today();const resultType=S(document.getElementById('lhResultType')?.value);const score=S(document.getElementById('lhScore')?.value);const level=S(document.getElementById('lhLevel')?.value);const comment=S(document.getElementById('lhComment')?.value);const note=S(document.getElementById('lhNote')?.value);if(!studentId||!subject||!content){alert('Vui lòng chọn học sinh, môn học và nhập nội dung.');return;}if(resultType==='DIEM'&&(score===''||Number(score)<0||Number(score)>10)){alert('Điểm phải từ 0 đến 10.');return;}const rec={id:`HT_${Date.now()}_${Math.random().toString(36).slice(2,8)}`,studentId,date,subject,content,resultType,score:resultType==='DIEM'?Number(score):'',level:resultType==='MUC_DAT'?level:'',comment,note,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()};try{arr.push(rec);if(!saveData()){alert('Không lưu được dữ liệu học tập.');arr.pop();return;}const wrap=document.getElementById('lhLearningFormWrap');if(wrap)wrap.hidden=true;['lhContent','lhScore','lhComment','lhNote'].forEach(id=>{const x=document.getElementById(id);if(x)x.value='';});document.getElementById('lhStudent').value='';document.getElementById('lhSubject').value='';renderLearning();if(typeof window.refreshAll==='function')window.refreshAll();if(typeof window.showToast==='function')window.showToast('Đã lưu kết quả học tập.','success');}catch(err){console.error(err);alert('Lỗi khi lưu kết quả học tập.');}}
function deleteLearning(id){if(!id||!confirm('Xóa đúng lượt ghi nhận học tập này?'))return;const arr=getLearning();const i=arr.findIndex(r=>S(r.id)===S(id));if(i<0)return;const old=arr.splice(i,1)[0];if(!saveData()){arr.splice(i,0,old);alert('Không xóa được dữ liệu học tập.');return;}renderLearning();if(typeof window.showToast==='function')window.showToast('Đã xóa lượt học tập.','success');}
window.renderLearning=renderLearning;const init=()=>{ensurePage();renderLearning();};if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();

/* ============================================================
   EVENT DELETE ALL BRIDGE
   Bổ sung cho giao diện hiện tại; không ảnh hưởng các module khác.
   ============================================================ */
(function(){
'use strict';
if(window.__LH_EVENT_DELETE_ALL_BRIDGE__) return;
window.__LH_EVENT_DELETE_ALL_BRIDGE__=true;
const S=v=>String(v??'').trim();
const API=()=>"https://script.google.com/macros/s/AKfycbxTPwf-jhrR8JOoKY5ZLuzlsDgcv3nWILtDPTrYNWZCEPpm2rkpXTn-sPAdFaUyy0z_uw/exec";
const endpoint=(action,sheet)=>{const u=API();return u?u+'?action='+encodeURIComponent(action)+'&sheet='+encodeURIComponent(sheet):'';};
async function removeOne(sheet,id){
  const u=endpoint('delete_event',sheet);if(!u)throw new Error('Thiếu URL Google Apps Script.');
  const r=await fetch(u+'&id='+encodeURIComponent(id),{cache:'no-store'});const d=await r.json();if(!d.ok)throw new Error(d.error||'Không xóa được lượt.');return d;
}
async function removeAll(sheet){
  const u=endpoint('delete_all_events',sheet);if(!u)throw new Error('Thiếu URL Google Apps Script.');
  const r=await fetch(u,{cache:'no-store'});const d=await r.json();if(!d.ok)throw new Error(d.error||'Không xóa được tất cả.');return d;
}
function addButton(pageId,sheet,label,id){
  const page=document.getElementById(pageId);if(!page)return;
  const host=page.querySelector('.page-actions')||page.querySelector('.page-header');if(!host||host.querySelector('#'+id))return;
  const b=document.createElement('button');b.type='button';b.id=id;b.className='button danger';b.innerHTML='<i class="fa-solid fa-trash-can"></i> '+label;
  b.onclick=async()=>{if(!confirm('Xóa TOÀN BỘ dữ liệu '+(sheet==='VI_PHAM'?'vi phạm':'khen thưởng')+'?\n\nKhông xóa học sinh và điểm danh.'))return;b.disabled=true;try{const d=await removeAll(sheet);alert('Đã xóa '+Number(d.deleted||0)+' lượt.');location.reload();}catch(e){alert('Không thể xóa tất cả — '+(e.message||e));b.disabled=false;}};
  host.appendChild(b);
}
function scan(){addButton('page-violations','VI_PHAM','Xóa tất cả','lhDeleteAllViolationsFinal');addButton('page-rewards','KHEN_THUONG','Xóa tất cả','lhDeleteAllRewardsFinal');}
window.LH_DELETE_EVENT={removeOne,removeAll,scan};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',scan,{once:true});else scan();
setInterval(scan,1000);
})();