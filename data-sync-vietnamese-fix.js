/* ============================================================
   AI / DATA COMPATIBILITY FIX — LÊ HOÀNG
   VERSION 10.0
   ============================================================ */
(function(){
'use strict';
if(window.__LH_AI_DATA_FIX_10__) return;
window.__LH_AI_DATA_FIX_10__ = true;

function getAppData(){
  try{
    if(typeof APP_DATA !== 'undefined' && APP_DATA) return APP_DATA;
  }catch(_){ }
  return window.APP_DATA || null;
}
function getArray(...names){
  const app=getAppData();
  for(const name of names){
    try{ if(app && Array.isArray(app[name])) return app[name]; }catch(_){ }
    try{ if(Array.isArray(window[name])) return window[name]; }catch(_){ }
  }
  return [];
}
function text(v){return String(v==null?'':v).trim();}
function sid(x){return text(x && (x.studentId||x.studentID||x.id||x.studentCode||x.code));}
function status(v){
  const s=text(v).toLocaleLowerCase('vi');
  if(['excused','có phép','co phép','co phep'].includes(s)) return 'excused';
  if(['absent','không phép','khong phep'].includes(s)) return 'absent';
  return 'present';
}
function enforceClass(){
  try{ if(typeof CLASS_CONFIG!=='undefined') CLASS_CONFIG.className='5A3'; }catch(_){ }
  try{ const app=getAppData(); if(app&&app.config) app.config.className='5A3'; }catch(_){ }
  try{const el=document.getElementById('classSelect'); if(el) el.value='5A3';}catch(_){ }
  try{const el=document.getElementById('heroClass'); if(el) el.textContent='Lớp 5A3';}catch(_){ }
}
function buildGPTReport(){
  const app=getAppData();
  const students=getArray('students');
  const attendance=Array.isArray(app?.attendance)?app.attendance:getArray('attendanceRecords');
  const violations=Array.isArray(app?.violations)?app.violations:getArray('violationRecords');
  const rewards=Array.isArray(app?.rewards)?app.rewards:getArray('rewardRecords');
  const amap=new Map(),vmap=new Map(),rmap=new Map();
  students.forEach(s=>{const id=text(s?.id||s?.studentId||s?.studentCode||s?.code); if(id) amap.set(id,{excused:0,absent:0,present:0});});
  attendance.forEach(r=>{const id=sid(r);if(!id)return;if(!amap.has(id))amap.set(id,{excused:0,absent:0,present:0});amap.get(id)[status(r.status)]++;});
  violations.forEach(r=>{const id=sid(r);if(id)vmap.set(id,(vmap.get(id)||0)+1);});
  rewards.forEach(r=>{const id=sid(r);if(id)rmap.set(id,(rmap.get(id)||0)+1);});
  const rows=students.map((s,i)=>{
    const id=text(s?.id||s?.studentId||s?.studentCode||s?.code);
    const a=amap.get(id)||{excused:0,absent:0,present:0};
    return {stt:i+1,name:text(s?.name||s?.fullName||s?.hoTen||id),excused:a.excused,absent:a.absent,totalAbsent:a.excused+a.absent,violations:vmap.get(id)||0,rewards:rmap.get(id)||0};
  });
  const total={students:rows.length,excused:rows.reduce((n,r)=>n+r.excused,0),absent:rows.reduce((n,r)=>n+r.absent,0),violations:rows.reduce((n,r)=>n+r.violations,0),rewards:rows.reduce((n,r)=>n+r.rewards,0)};
  const lines=rows.map(r=>`| ${r.stt} | ${r.name.replace(/\|/g,'/')} | ${r.excused} | ${r.absent} | ${r.totalAbsent} | ${r.violations} | ${r.rewards} |`);
  const prompt=[
    'Tôi là giáo viên chủ nhiệm lớp 5A3.',
    'Hãy phân tích dữ liệu lớp học dưới đây bằng tiếng Việt.',
    'Nhận xét chuyên cần, vi phạm, khen thưởng; xác định học sinh cần quan tâm và học sinh tích cực; đề xuất biện pháp hỗ trợ thực tế.',
    'Không tự tạo hoặc suy diễn số liệu không có.',
    '',
    `TỔNG QUAN: ${total.students} học sinh; vắng có phép ${total.excused}; vắng không phép ${total.absent}; vi phạm ${total.violations}; khen thưởng ${total.rewards}.`,
    '',
    'BẢNG TỔNG HỢP:',
    '| STT | Học sinh | Vắng có phép | Vắng không phép | Tổng vắng | Vi phạm | Khen thưởng |',
    '|---:|---|---:|---:|---:|---:|---:|',
    ...lines
  ].join('\n');
  return {rows,total,prompt};
}
function copyText(value){
  if(navigator.clipboard&&window.isSecureContext) return navigator.clipboard.writeText(value).then(()=>true).catch(()=>fallbackCopy(value));
  return Promise.resolve(fallbackCopy(value));
}
function fallbackCopy(value){
  try{const ta=document.createElement('textarea');ta.value=value;ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.select();const ok=document.execCommand('copy');ta.remove();return ok;}catch(_){return false;}
}
function renderGPTCard(){
  const page=document.getElementById('page-ai');
  if(!page)return;
  page.querySelectorAll('#lhGPTSummaryCard,#lhGPTTopAction').forEach(el=>el.remove());
  const card=document.createElement('section');
  card.id='lhGPTSummaryCard';
  card.className='ai-disclaimer';
  card.style.marginTop='18px';
  card.innerHTML='<strong>GPT – Tổng hợp toàn hệ thống</strong><p>Tự lập bảng vắng, vi phạm, khen thưởng theo từng học sinh. Kiểm tra bảng trước khi mở ChatGPT.</p>'+
    '<div id="lhGPTActions" style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px;">'+
    '<button type="button" class="button primary" id="lhGPTBuildButton"><i class="fa-solid fa-table-list"></i> Tổng hợp dữ liệu</button>'+ 
    '<button type="button" class="button secondary" id="lhGPTCopyButton" disabled><i class="fa-solid fa-copy"></i> Sao chép bảng + prompt</button>'+ 
    '<button type="button" class="button secondary" id="lhGPTOpenButton" disabled><i class="fa-solid fa-up-right-from-square"></i> Mở ChatGPT</button></div>'+
    '<div id="lhGPTReportView" style="display:none;margin-top:14px;overflow:auto;"></div>';
  page.appendChild(card);
  const build=card.querySelector('#lhGPTBuildButton');
  const copy=card.querySelector('#lhGPTCopyButton');
  const open=card.querySelector('#lhGPTOpenButton');
  const view=card.querySelector('#lhGPTReportView');
  let latest=null;
  function show(report){
    const body=report.rows.map(r=>`<tr><td>${r.stt}</td><td>${escapeHtml(r.name)}</td><td>${r.excused}</td><td>${r.absent}</td><td>${r.totalAbsent}</td><td>${r.violations}</td><td>${r.rewards}</td></tr>`).join('');
    view.innerHTML=`<div style="margin-bottom:8px;"><strong>${report.total.students} học sinh</strong> · Có phép ${report.total.excused} · Không phép ${report.total.absent} · Vi phạm ${report.total.violations} · Khen thưởng ${report.total.rewards}</div><table class="data-table" style="min-width:760px"><thead><tr><th>STT</th><th>Học sinh</th><th>Vắng có phép</th><th>Vắng không phép</th><th>Tổng vắng</th><th>Vi phạm</th><th>Khen thưởng</th></tr></thead><tbody>${body}</tbody></table>`;
    view.style.display='block';
  }
  build.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();latest=buildGPTReport();if(!latest.rows.length){view.style.display='block';view.innerHTML='<p>Chưa có danh sách học sinh trong nguồn dữ liệu chính.</p>';return;}show(latest);copy.disabled=false;open.disabled=false;window.showToast?.(`Đã tổng hợp ${latest.rows.length} học sinh.`,'success');},{passive:false});
  copy.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();if(!latest)return;copyText(latest.prompt).then(ok=>window.showToast?.(ok?'Đã sao chép bảng + prompt.':'Không thể sao chép tự động; hãy sao chép thủ công.',ok?'success':'warning'));},{passive:false});
  open.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();if(!latest)return;const w=window.open('https://chatgpt.com/','_blank','noopener,noreferrer');if(!w){window.showToast?.('Trình duyệt đang chặn popup ChatGPT. Hãy cho phép popup.','warning');return;}copyText(latest.prompt).then(ok=>window.showToast?.(ok?'Đã mở ChatGPT và sao chép dữ liệu. Dán Ctrl+V để phân tích.':'Đã mở ChatGPT. Hãy sao chép bảng rồi dán.','success'));},{passive:false});
}
function escapeHtml(v){return text(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\"/g,'&quot;').replace(/'/g,'&#039;');}
function removeLegacyAIDuplicates(){
  const page=document.getElementById('page-ai');
  if(page) page.querySelectorAll('.ui-complete-page').forEach(el=>el.remove());
}
function init(){enforceClass();removeLegacyAIDuplicates();renderGPTCard();}
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init,{once:true}); else init();
window.addEventListener('google-sheets-data-ready',()=>{enforceClass();removeLegacyAIDuplicates();renderGPTCard();});
window.LH_AIGPT10={buildGPTReport,renderGPTCard,enforceClass};
})();
