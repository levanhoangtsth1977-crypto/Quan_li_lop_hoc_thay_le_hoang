/* ============================================================
   AI / DATA COMPATIBILITY FIX — LÊ HOÀNG
   VERSION 11.0 — GPT DATA SOURCE + PREVIEW + COPY + OPEN
   ============================================================ */
(function(){
'use strict';
if(window.__LH_AI_DATA_FIX_11__) return;
window.__LH_AI_DATA_FIX_11__ = true;

function dataArray(name, appName){
  try{ if(typeof window[name] !== 'undefined' && Array.isArray(window[name])) return window[name]; }catch(_){ }
  try{ if(typeof eval === 'function'){ const v=eval(name); if(Array.isArray(v)) return v; } }catch(_){ }
  try{ const app=(typeof APP_DATA!=='undefined')?APP_DATA:window.APP_DATA; const v=app && app[appName]; if(Array.isArray(v)) return v; }catch(_){ }
  return [];
}
function txt(v){return String(v==null?'':v).trim();}
function rid(x){return txt(x && (x.studentId||x.studentID||x.id||x.studentCode||x.code));}
function st(v){const s=txt(v).toLocaleLowerCase('vi');if(['excused','có phép','co phép','co phep'].includes(s))return 'excused';if(['absent','không phép','khong phep'].includes(s))return 'absent';return 'present';}
function enforceClass(){try{if(typeof CLASS_CONFIG!=='undefined')CLASS_CONFIG.className='5A3';}catch(_){} try{const a=document.getElementById('classSelect');if(a)a.value='5A3';const h=document.getElementById('heroClass');if(h)h.textContent='Lớp 5A3';}catch(_){} }
function report(){
 const students=dataArray('students','students');
 const attendance=dataArray('attendanceRecords','attendance');
 const violations=dataArray('violationRecords','violations');
 const rewards=dataArray('rewardRecords','rewards');
 const a=new Map(),v=new Map(),r=new Map();
 students.forEach(s=>{const id=txt(s?.id||s?.studentId||s?.studentCode||s?.code);if(id)a.set(id,{excused:0,absent:0});});
 attendance.forEach(x=>{const id=rid(x);if(!id)return;if(!a.has(id))a.set(id,{excused:0,absent:0});const q=st(x.status);if(q==='excused')a.get(id).excused++;if(q==='absent')a.get(id).absent++;});
 violations.forEach(x=>{const id=rid(x);if(id)v.set(id,(v.get(id)||0)+1);});
 rewards.forEach(x=>{const id=rid(x);if(id)r.set(id,(r.get(id)||0)+1);});
 const rows=students.map((s,i)=>{const id=txt(s?.id||s?.studentId||s?.studentCode||s?.code);const q=a.get(id)||{excused:0,absent:0};return{stt:i+1,name:txt(s?.name||s?.fullName||s?.hoTen||id),excused:q.excused,absent:q.absent,totalAbsent:q.excused+q.absent,violations:v.get(id)||0,rewards:r.get(id)||0};});
 const total={students:rows.length,excused:rows.reduce((n,x)=>n+x.excused,0),absent:rows.reduce((n,x)=>n+x.absent,0),violations:rows.reduce((n,x)=>n+x.violations,0),rewards:rows.reduce((n,x)=>n+x.rewards,0)};
 const lines=rows.map(x=>`| ${x.stt} | ${x.name.replace(/\|/g,'/')} | ${x.excused} | ${x.absent} | ${x.totalAbsent} | ${x.violations} | ${x.rewards} |`);
 const prompt=[`Tôi là giáo viên chủ nhiệm lớp 5A3.`,`Hãy phân tích dữ liệu lớp học dưới đây bằng tiếng Việt.`,`Nhận xét chuyên cần, vi phạm, khen thưởng; xác định học sinh cần quan tâm và học sinh tích cực; đề xuất biện pháp hỗ trợ thực tế.`,`Không tự tạo hoặc suy diễn số liệu không có.`,``,`TỔNG QUAN: ${total.students} học sinh; vắng có phép ${total.excused}; vắng không phép ${total.absent}; vi phạm ${total.violations}; khen thưởng ${total.rewards}.`,``,`BẢNG TỔNG HỢP:`,`| STT | Học sinh | Vắng có phép | Vắng không phép | Tổng vắng | Vi phạm | Khen thưởng |`,`|---:|---|---:|---:|---:|---:|---:|`,...lines].join('\n');
 return {rows,total,prompt};
}
function copy(value){try{if(navigator.clipboard&&window.isSecureContext)return navigator.clipboard.writeText(value).then(()=>true).catch(()=>fallback(value));}catch(_){}return Promise.resolve(fallback(value));function fallback(v){try{const t=document.createElement('textarea');t.value=v;t.style.position='fixed';t.style.left='-9999px';document.body.appendChild(t);t.select();const ok=document.execCommand('copy');t.remove();return ok;}catch(_){return false;}}}
function esc(v){return txt(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\"/g,'&quot;').replace(/'/g,'&#039;');}
function render(){
 const page=document.getElementById('page-ai'); if(!page)return;
 page.querySelectorAll('.ui-complete-page').forEach(x=>x.remove());
 page.querySelectorAll('#lhGPTSummaryCard').forEach(x=>x.remove());
 const c=document.createElement('section'); c.id='lhGPTSummaryCard'; c.className='ai-disclaimer'; c.style.cssText='margin-top:18px;display:block;';
 c.innerHTML='<div style="display:flex;gap:12px;align-items:flex-start;flex-wrap:wrap"><i class="fa-solid fa-robot" style="font-size:20px"></i><div style="flex:1;min-width:240px"><strong>GPT – Tổng hợp toàn hệ thống</strong><p style="margin:6px 0 0">Tự lập bảng vắng, vi phạm, khen thưởng theo từng học sinh. Kiểm tra bảng trước khi mở ChatGPT.</p></div></div><div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px"><button type="button" class="button primary" id="lhGPTBuildButton"><i class="fa-solid fa-table-list"></i> Tổng hợp dữ liệu</button><button type="button" class="button secondary" id="lhGPTCopyButton" disabled><i class="fa-solid fa-copy"></i> Sao chép bảng + prompt</button><button type="button" class="button secondary" id="lhGPTOpenButton" disabled><i class="fa-solid fa-up-right-from-square"></i> Mở ChatGPT</button></div><div id="lhGPTReportView" style="display:none;margin-top:14px;overflow:auto"></div>';
 page.appendChild(c);
 const b=c.querySelector('#lhGPTBuildButton'), cp=c.querySelector('#lhGPTCopyButton'), op=c.querySelector('#lhGPTOpenButton'), view=c.querySelector('#lhGPTReportView'); let latest=null;
 b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation(); latest=report(); if(!latest.rows.length){view.style.display='block';view.innerHTML='<p>Chưa đọc được danh sách học sinh từ nguồn dữ liệu hiện tại.</p>';cp.disabled=true;op.disabled=true;return;} const body=latest.rows.map(x=>`<tr><td>${x.stt}</td><td>${esc(x.name)}</td><td>${x.excused}</td><td>${x.absent}</td><td>${x.totalAbsent}</td><td>${x.violations}</td><td>${x.rewards}</td></tr>`).join(''); view.innerHTML=`<div style="margin-bottom:8px"><strong>${latest.total.students} học sinh</strong> · Có phép ${latest.total.excused} · Không phép ${latest.total.absent} · Vi phạm ${latest.total.violations} · Khen thưởng ${latest.total.rewards}</div><table class="data-table" style="min-width:760px"><thead><tr><th>STT</th><th>Học sinh</th><th>Vắng có phép</th><th>Vắng không phép</th><th>Tổng vắng</th><th>Vi phạm</th><th>Khen thưởng</th></tr></thead><tbody>${body}</tbody></table>`; view.style.display='block';cp.disabled=false;op.disabled=false;window.showToast?.(`Đã tổng hợp ${latest.rows.length} học sinh.`,'success');});
 cp.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();if(!latest)return;copy(latest.prompt).then(ok=>window.showToast?.(ok?'Đã sao chép bảng + prompt.':'Không thể sao chép tự động; hãy chọn và sao chép thủ công.','warning'));});
 op.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();if(!latest)return;const w=window.open('https://chatgpt.com/','_blank','noopener,noreferrer');if(!w){window.showToast?.('Trình duyệt đang chặn popup ChatGPT. Hãy cho phép popup cho trang này.','warning');return;}copy(latest.prompt).then(ok=>window.showToast?.(ok?'Đã mở ChatGPT và sao chép dữ liệu. Dán Ctrl+V để phân tích.':'Đã mở ChatGPT. Hãy sao chép bảng rồi dán.','success'));});
}
function init(){enforceClass();render();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
window.addEventListener('google-sheets-data-ready',()=>{enforceClass();render();});
window.LH_AIGPT11={report,render,enforceClass};
})();