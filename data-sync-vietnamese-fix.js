/* ============================================================
   AI / GPT SUMMARY + RESET — LÊ HOÀNG
   VERSION 13.0 — ROBUST DATA + ONE-TIME CLEAN START
   ============================================================ */
(function(){
'use strict';
if(window.__LH_AI_GPT_FIX_13__) return;
window.__LH_AI_GPT_FIX_13__ = true;

/* ------------------------------------------------------------
   DATA ACCESS
   ------------------------------------------------------------ */
function getDataValue(name, appName){
  try{ const v=window[name]; if(Array.isArray(v)) return v; }catch(_){ }
  try{ const v=eval(name); if(Array.isArray(v)) return v; }catch(_){ }
  try{ const app=(typeof APP_DATA!=='undefined')?APP_DATA:window.APP_DATA; const v=app&&app[appName]; if(Array.isArray(v)) return v; }catch(_){ }
  return [];
}
function txt(v){return String(v==null?'':v).trim();}
function sid(x){return txt(x&&(x.studentId??x.studentID??x.studentCode??x.id??x.code));}
function sname(x){return txt(x&&(x.name??x.fullName??x.hoTen??x.hoten??x['Họ và tên']));}
function st(v){const s=txt(v).toLocaleLowerCase('vi');if(['excused','có phép','co phep','co phép'].includes(s))return'excused';if(['absent','không phép','khong phep'].includes(s))return'absent';return'present';}
function escapeHtml(v){return txt(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\"/g,'&quot;').replace(/'/g,'&#039;');}

/* ------------------------------------------------------------
   GPT REPORT
   ------------------------------------------------------------ */
function build(){
  let students=getDataValue('students','students');
  const attendance=getDataValue('attendanceRecords','attendance');
  const violations=getDataValue('violationRecords','violations');
  const rewards=getDataValue('rewardRecords','rewards');
  if(!students.length){
    const body=document.getElementById('studentTableBody');
    if(body){students=[...body.querySelectorAll('tr')].map((tr,i)=>{const c=tr.children;return c&&c[1]?{id:'dom-'+i,name:txt(c[1].innerText),status:'active'}:null;}).filter(Boolean);}
  }
  const byId=new Map(),byName=new Map(),a=new Map(),v=new Map(),r=new Map();
  students.forEach((s,i)=>{const id=sid(s)||`dom-${i}`;byId.set(id,s);const n=sname(s);if(n)byName.set(n.toLocaleLowerCase('vi'),id);a.set(id,{excused:0,absent:0});});
  function resolve(rec){const id=sid(rec);if(id&&byId.has(id))return id;const n=sname(rec);return n?byName.get(n.toLocaleLowerCase('vi'))||'':id;}
  attendance.forEach(rec=>{const id=resolve(rec);if(!id)return;const q=st(rec.status);if(q==='excused')a.get(id).excused++;else if(q==='absent')a.get(id).absent++;});
  violations.forEach(rec=>{const id=resolve(rec);if(id)v.set(id,(v.get(id)||0)+1);});
  rewards.forEach(rec=>{const id=resolve(rec);if(id)r.set(id,(r.get(id)||0)+1);});
  const rows=students.map((s,i)=>{const id=sid(s)||`dom-${i}`,q=a.get(id)||{excused:0,absent:0};return{stt:i+1,name:sname(s)||id,excused:q.excused,absent:q.absent,totalAbsent:q.excused+q.absent,violations:v.get(id)||0,rewards:r.get(id)||0};});
  const total={students:rows.length,excused:rows.reduce((n,x)=>n+x.excused,0),absent:rows.reduce((n,x)=>n+x.absent,0),violations:rows.reduce((n,x)=>n+x.violations,0),rewards:rows.reduce((n,x)=>n+x.rewards,0)};
  const lines=rows.map(x=>`| ${x.stt} | ${x.name.replace(/\\|/g,'/')} | ${x.excused} | ${x.absent} | ${x.totalAbsent} | ${x.violations} | ${x.rewards} |`);
  const prompt=[`Tôi là giáo viên chủ nhiệm lớp 5A3.`,`Phân tích chính xác dữ liệu lớp học dưới đây bằng tiếng Việt.`,`Nhận xét chuyên cần, vi phạm, khen thưởng; xác định học sinh cần quan tâm và học sinh tích cực; đề xuất biện pháp giáo dục thực tế.`,`Không tự tạo hoặc suy diễn số liệu không có.`,``,`TỔNG QUAN: ${total.students} học sinh; vắng có phép ${total.excused}; vắng không phép ${total.absent}; vi phạm ${total.violations}; khen thưởng ${total.rewards}.`,``,`BẢNG TỔNG HỢP:`,`| STT | Học sinh | Vắng có phép | Vắng không phép | Tổng vắng | Vi phạm | Khen thưởng |`,`|---:|---|---:|---:|---:|---:|---:|`,...lines].join('\\n');
  return{rows,total,prompt};
}
function copyText(value){try{if(navigator.clipboard&&window.isSecureContext)return navigator.clipboard.writeText(value).then(()=>true).catch(()=>fallback(value));}catch(_){}return Promise.resolve(fallback(value));function fallback(v){try{const t=document.createElement('textarea');t.value=v;t.style.position='fixed';t.style.left='-9999px';document.body.appendChild(t);t.select();const ok=document.execCommand('copy');t.remove();return ok;}catch(_){return false;}}}

/* ------------------------------------------------------------
   CLASS DISPLAY
   ------------------------------------------------------------ */
function enforceClass(){
  try{if(typeof CLASS_CONFIG!=='undefined'&&CLASS_CONFIG)CLASS_CONFIG.className='5A3';}catch(_){}
  try{const s=document.getElementById('classSelect');if(s)s.value='5A3';const h=document.getElementById('heroClass');if(h)h.textContent='Lớp 5A3';}catch(_){}
}

/* ------------------------------------------------------------
   UI
   ------------------------------------------------------------ */
function render(){
  const page=document.getElementById('page-ai');if(!page)return;
  page.querySelectorAll('#lhGPTSummaryCard,.ui-complete-page').forEach(x=>x.remove());
  const c=document.createElement('section');c.id='lhGPTSummaryCard';c.className='ai-disclaimer';c.style.cssText='display:block;margin-top:18px;';
  c.innerHTML='<strong>GPT – Tổng hợp toàn hệ thống</strong><p>Tự lập bảng vắng, vi phạm, khen thưởng theo từng học sinh. Kiểm tra bảng trước khi mở ChatGPT.</p><div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px"><button type="button" class="button primary" id="lhGPTBuildButton">Tổng hợp dữ liệu</button><button type="button" class="button secondary" id="lhGPTCopyButton" disabled>Sao chép bảng + prompt</button><button type="button" class="button secondary" id="lhGPTOpenButton" disabled>Mở ChatGPT</button></div><div id="lhGPTReportView" style="display:none;margin-top:14px;overflow:auto"></div>';
  page.appendChild(c);
  const b=c.querySelector('#lhGPTBuildButton'),cp=c.querySelector('#lhGPTCopyButton'),op=c.querySelector('#lhGPTOpenButton'),view=c.querySelector('#lhGPTReportView');let latest=null;
  b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();latest=build();if(!latest.rows.length){view.style.display='block';view.innerHTML='<p>Chưa đọc được danh sách học sinh. Hãy mở menu Học sinh và kiểm tra dữ liệu đã đồng bộ.</p>';return;}const body=latest.rows.map(x=>`<tr><td>${x.stt}</td><td>${escapeHtml(x.name)}</td><td>${x.excused}</td><td>${x.absent}</td><td>${x.totalAbsent}</td><td>${x.violations}</td><td>${x.rewards}</td></tr>`).join('');view.innerHTML=`<div style="margin-bottom:8px"><strong>${latest.total.students} học sinh</strong> · Có phép ${latest.total.excused} · Không phép ${latest.total.absent} · Vi phạm ${latest.total.violations} · Khen thưởng ${latest.total.rewards}</div><table class="data-table" style="min-width:760px"><thead><tr><th>STT</th><th>Học sinh</th><th>Vắng có phép</th><th>Vắng không phép</th><th>Tổng vắng</th><th>Vi phạm</th><th>Khen thưởng</th></tr></thead><tbody>${body}</tbody></table>`;view.style.display='block';cp.disabled=false;op.disabled=false;window.showToast?.(`Đã tổng hợp ${latest.rows.length} học sinh.`,'success');},{passive:false});
  cp.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();if(!latest)return;copyText(latest.prompt).then(ok=>window.showToast?.(ok?'Đã sao chép bảng + prompt.':'Không thể sao chép tự động; hãy chọn và sao chép thủ công.','warning'));},{passive:false});
  op.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();if(!latest)return;const w=window.open('https://chatgpt.com/','_blank','noopener,noreferrer');if(!w){window.showToast?.('Trình duyệt đang chặn popup ChatGPT. Hãy cho phép popup cho trang này.','warning');return;}copyText(latest.prompt).then(ok=>window.showToast?.(ok?'Đã mở ChatGPT và sao chép dữ liệu. Dán Ctrl+V để phân tích.':'Đã mở ChatGPT. Hãy sao chép bảng rồi dán.','success'));},{passive:false});
}

/* ------------------------------------------------------------
   ONE-TIME CLEAN START
   - Giữ nguyên students.
   - Xóa DIEM_DANH / VI_PHAM / KHEN_THUONG ở Google Sheets.
   - Xóa bản ghi cục bộ tương ứng.
   - Chỉ chạy một lần sau khi xóa thành công.
   ------------------------------------------------------------ */
const RESET_KEY='LH_CLEAN_START_2026_2027_V1';
const API='https://script.google.com/macros/s/AKfycbxTPwf-jhrR8JOoKY5ZLuzlsDgcv3nWILtDPTrYNWZCEPpm2rkpXTn-sPAdFaUyy0z_uw/exec';
function jsonp(action,params){return new Promise((resolve,reject)=>{const cb='LHRESET_'+Date.now()+'_'+Math.random().toString(36).slice(2),s=document.createElement('script');let done=false;const end=(err,data)=>{if(done)return;done=true;clearTimeout(t);try{delete window[cb]}catch(_){}s.remove();err?reject(err):resolve(data)};const t=setTimeout(()=>end(Error('Google Sheets không phản hồi sau 20 giây')),20000);window[cb]=d=>end(null,d);s.onerror=()=>end(Error('Không truy cập được Google Sheets'));const q=Object.assign({action,callback:cb,_:Date.now()},params||{});s.src=API+'?'+Object.keys(q).map(k=>encodeURIComponent(k)+'='+encodeURIComponent(typeof q[k]==='string'?q[k]:JSON.stringify(q[k]))).join('&');document.head.appendChild(s);});}
async function cleanRemoteRecords(){
  const data=await jsonp('get_events');
  if(!data||data.ok!==true)throw Error(data&&data.error||'Không đọc được dữ liệu Google Sheets');
  const tabs=['DIEM_DANH','VI_PHAM','KHEN_THUONG'];
  let removed=0;
  for(const tab of tabs){
    const list=Array.isArray(data[tab])?data[tab]:[];
    for(let i=0;i<list.length;i+=5){
      const batch=list.slice(i,i+5);
      await Promise.all(batch.map(async rec=>{
        const id=txt(rec&&rec.id);if(!id)return;
        const result=await jsonp('delete_event',{sheet:tab,id,recordId:id});
        if(!result||result.ok!==true||result.deleted!==true)throw Error((result&&result.error)||`Không xóa được ${tab} ${id}`);
        removed++;
      }));
    }
  }
  const verify=await jsonp('get_events');
  if(!verify||verify.ok!==true)throw Error('Không xác minh được sau khi xóa');
  for(const tab of tabs){if(Array.isArray(verify[tab])&&verify[tab].length)throw Error(`Google Sheets vẫn còn ${verify[tab].length} bản ghi ở ${tab}`);}
  return removed;
}
function clearLocalEventData(){
  try{
    const app=(typeof APP_DATA!=='undefined')?APP_DATA:window.APP_DATA;
    ['attendance','violations','rewards'].forEach(k=>{if(Array.isArray(app&&app[k]))app[k].splice(0,app[k].length);});
    if(typeof syncAppDataReferences==='function')syncAppDataReferences();
    if(typeof saveClassData==='function')saveClassData();
  }catch(e){console.warn('[CLEAN START LOCAL]',e)}
}
async function oneTimeCleanStart(){
  try{
    if(localStorage.getItem(RESET_KEY)==='done')return;
    window.__LH_CLEAN_START_IN_PROGRESS__=true;
    try{window.showToast?.('Đang làm sạch Điểm danh, Vi phạm và Khen thưởng...','warning');}catch(_){}
    clearLocalEventData();
    const removed=await cleanRemoteRecords();
    clearLocalEventData();
    localStorage.setItem(RESET_KEY,'done');
    try{window.showToast?.(`Đã làm sạch ${removed} bản ghi. Giữ nguyên danh sách học sinh. Trang sẽ tải lại.`,'success');}catch(_){}
    setTimeout(()=>window.location.reload(),700);
  }catch(e){
    try{localStorage.removeItem(RESET_KEY);}catch(_){}
    window.__LH_CLEAN_START_IN_PROGRESS__=false;
    console.error('[CLEAN START]',e);
    try{window.showToast?.('Làm sạch dữ liệu thất bại: '+e.message,'error');}catch(_){}
  }
}

function init(){enforceClass();render();oneTimeCleanStart();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
window.addEventListener('google-sheets-data-ready',()=>{if(!window.__LH_CLEAN_START_IN_PROGRESS__) {enforceClass();render();}});
window.LH_AIGPT13={buildGPTReport:build,renderGPT:render,enforceClass,cleanRemoteRecords,clearLocalEventData};
})();