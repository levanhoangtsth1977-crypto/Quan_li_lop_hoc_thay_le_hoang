// Unified V2 learning importer. Owns only SMAS learning import/storage and leaves the main app Router/Store untouched.
const KEY='LH_V2_2026_2027';
let selectedStage='GK1';
let currentMatch=null;

const $=(s,r=document)=>r.querySelector(s);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const toast=msg=>{const box=$('#toastStack');if(!box)return;const e=document.createElement('div');e.className='toast';e.textContent=msg;box.appendChild(e);setTimeout(()=>e.remove(),3200)};
const readData=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'null')}catch{return null}};
const writeData=d=>localStorage.setItem(KEY,JSON.stringify(d));
const canon=v=>String(v??'').replace(/\s+/g,' ').trim().toLocaleLowerCase('vi').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/[^a-z0-9]+/g,'');

function stageFromText(v=''){
  const x=canon(v);
  if(x.includes('giuaky1')||x.includes('giuakyi')||x==='gk1')return'GK1';
  if(x.includes('cuoiky1')||x.includes('cuoikyi')||x==='ck1')return'CK1';
  if(x.includes('giuaky2')||x.includes('giuakyii')||x==='gk2')return'GK2';
  if(x.includes('cuoinam')||x.includes('cuoiky2')||x.includes('cuoikyii')||x==='ck2')return'CK2';
  return'';
}

async function getEngines(){return Promise.all([import('./core.js'),import('./learning-normalizer.js')])}

function ensureReportBox(){let box=$('#smasReport');if(!box)return null;return box}

async function processFile(file){
  if(!file)return;
  const report=ensureReportBox();
  if(report)report.innerHTML='<div class="notice">⏳ Đang quét file SMAS, tìm dòng tiêu đề và đối chiếu học sinh...</div>';
  try{
    const [{importFile,matchSmAsRecords},{normalizeLearningRows,buildLearningRows,buildLearningProfiles}]=await getEngines();
    const data=readData();
    if(!data||!Array.isArray(data.students))throw new Error('Chưa có danh sách học sinh V2.');
    const source=await importFile(file);
    const match=matchSmAsRecords(source,data.students,selectedStage);
    const detected=stageFromText(match.title)||stageFromText(source.title)||'';
    const stage=detected||selectedStage;
    const normalized=normalizeLearningRows(match.matched,match.headerRows||[]);
    const subjectRows=buildLearningRows(normalized,stage,new Date().toISOString(),'');
    const profileRows=buildLearningProfiles(normalized,stage,new Date().toISOString(),'');
    currentMatch={match,normalized,subjectRows,profileRows,stage,fileName:file.name};
    renderReport();
    if(detected&&detected!==selectedStage)toast(`File SMAS được nhận diện là ${detected}; hệ thống sẽ nhập vào ${detected}.`);
  }catch(err){console.error(err);if(report)report.innerHTML=`<div class="notice">❌ Không đọc được file SMAS: ${esc(err.message||err)}</div>`}
}

function renderReport(){
  const report=ensureReportBox();
  if(!report||!currentMatch)return;
  const {match,normalized,subjectRows,stage,fileName}=currentMatch;
  const totalSubjects=subjectRows.length;
  const studentsWithResults=new Set(subjectRows.map(x=>x.studentId)).size;
  const conflicts=match.conflicts.length;
  const unmatched=match.unmatched.length;
  report.innerHTML=`<div class="import-report"><div class="report-box"><strong>${match.rowCount}</strong><small>Dòng dữ liệu</small></div><div class="report-box"><strong>${match.matched.length}</strong><small>Học sinh khớp</small></div><div class="report-box"><strong>${studentsWithResults}</strong><small>HS có kết quả môn</small></div><div class="report-box"><strong>${totalSubjects}</strong><small>Kết quả môn/nhóm</small></div></div>
  <div class="notice" style="margin-top:10px">📄 <strong>${esc(fileName)}</strong> · Kỳ: <strong>${stage}</strong> · Khớp ưu tiên Student ID, sau đó mới dùng họ tên khi cần. Dữ liệu chưa khớp hoặc xung đột không bị nhập âm thầm.</div>
  ${unmatched?`<div class="notice">⚠️ Chưa khớp ${unmatched} học sinh: ${esc(match.unmatched.slice(0,12).join(', '))}${unmatched>12?' …':''}</div>`:''}
  ${conflicts?`<div class="notice">⚠️ Có ${conflicts} dòng/nguồn xung đột cần kiểm tra. Hệ thống vẫn giữ báo cáo để thầy xem trước.</div>`:''}
  <div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap"><button class="btn secondary" id="learningPreviewBtn">Xem trước ${stage}</button><button class="btn primary" id="learningConfirmBtn">Xác nhận nhập ${stage}</button></div>
  <div class="table-wrap" style="margin-top:12px"><table class="table"><thead><tr><th>Học sinh</th><th>Kỳ</th><th>Môn/nhóm</th><th>Kết quả</th><th>Nguồn</th></tr></thead><tbody>${subjectRows.slice(0,80).map(r=>`<tr><td>${esc(match.matched.find(m=>m.studentId===r.studentId)?.name||r.studentId)}</td><td>${esc(r.stage)}</td><td>${esc(r.subject)}</td><td><strong>${esc(r.value)}</strong></td><td>${esc(r.source||'')}</td></tr>`).join('')||`<tr><td colspan="5"><div class="empty">Không phát hiện cột kết quả môn phù hợp trong dòng tiêu đề.</div></td></tr>`}</tbody></table></div>`;
  $('#learningPreviewBtn')?.addEventListener('click',()=>showPreview());
  $('#learningConfirmBtn')?.addEventListener('click',()=>confirmImport());
}

function showPreview(){
  if(!currentMatch)return;
  const {subjectRows,stage,match}=currentMatch;
  const box=document.createElement('div');box.className='modal-backdrop';box.id='learningPreviewModal';
  const rows=subjectRows.slice(0,120).map(r=>{const m=match.matched.find(x=>x.studentId===r.studentId);return`<tr><td>${esc(m?.name||r.studentId)}</td><td>${esc(r.subject)}</td><td>${esc(r.value)}</td><td>${esc(r.source||'')}</td></tr>`}).join('');
  box.innerHTML=`<div class="modal"><div class="modal-head"><strong>Xem trước SMAS · ${stage}</strong><button class="icon-btn" id="closeLearningPreview">✕</button></div><div class="modal-body"><div class="table-wrap"><table class="table"><thead><tr><th>Học sinh</th><th>Môn/nhóm</th><th>Kết quả</th><th>Nguồn</th></tr></thead><tbody>${rows||'<tr><td colspan="4">Không có kết quả.</td></tr>'}</tbody></table></div></div></div>`;
  document.body.appendChild(box);$('#closeLearningPreview').onclick=()=>box.remove();box.addEventListener('click',e=>{if(e.target===box)box.remove()});
}

function confirmImport(){
  if(!currentMatch)return;
  const data=readData();if(!data)throw new Error('Không có dữ liệu V2.');
  const {match,subjectRows,profileRows,stage,fileName}=currentMatch;
  const importedAt=new Date().toISOString();
  const batchId=`SMAS_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,8)}`;
  data.learning=Array.isArray(data.learning)?data.learning:[];
  data.learning=data.learning.filter(r=>String(r.stage)!==stage);
  data.learning.push(...subjectRows.map(r=>({...r,importBatchId:batchId,importedAt,sourceFile:fileName})));
  data.learningProfiles=Array.isArray(data.learningProfiles)?data.learningProfiles:[];
  data.learningProfiles=data.learningProfiles.filter(r=>String(r.stage)!==stage);
  data.learningProfiles.push(...profileRows.map(r=>({...r,importBatchId:batchId,importedAt,sourceFile:fileName})));
  data.smasImports=data.smasImports||{};
  data.smasImports[stage]={stage,source:fileName,rows:match.rowCount,matchedStudents:new Set(subjectRows.map(x=>x.studentId)).size,subjectRows:subjectRows.length,unmatched:match.unmatched,conflicts:match.conflicts,importBatchId:batchId,importedAt,students:match.matched.map(m=>({studentId:m.studentId,name:m.name,studentCode:m.studentCode,subjectCount:(subjectRows.filter(x=>x.studentId===m.studentId)).length}))};
  writeData(data);
  currentMatch=null;
  toast(`✅ Đã nhập ${stage}: ${data.smasImports[stage].matchedStudents} học sinh · ${data.smasImports[stage].subjectRows} kết quả môn.`);
  const input=$('#smasFile');if(input)input.value='';
  setTimeout(()=>location.reload(),250);
}

function setStage(stage){selectedStage=stage||'GK1';const label=$('#learningStageLabel');if(label)label.textContent=selectedStage==='CK2'?'CK2 / Cuối năm':selectedStage}

document.addEventListener('click',e=>{
  const stageBtn=e.target.closest('[data-action="choose-learning-stage"]');
  if(stageBtn){setStage(stageBtn.dataset.stage);return;}
},{capture:true});

document.addEventListener('change',e=>{
  if(e.target?.id!=='smasFile')return;
  e.stopImmediatePropagation();
  processFile(e.target.files?.[0]);
},{capture:true});

console.info('[V2] learning-module loaded');
