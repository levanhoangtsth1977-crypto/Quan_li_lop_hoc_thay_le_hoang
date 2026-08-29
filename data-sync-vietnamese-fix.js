/* DATA SYNC VIETNAMESE FIX — SAFE COMPATIBILITY LAYER 2.1 */
(function(){
'use strict';
if(window.__LH_DATA_SYNC_VIETNAMESE_FIX_21__)return;
window.__LH_DATA_SYNC_VIETNAMESE_FIX_21__=true;

/* Nguồn cấu hình thật là global lexical const CLASS_CONFIG, không phải window property. */
try{
  if(typeof CLASS_CONFIG!=='undefined' && CLASS_CONFIG && typeof CLASS_CONFIG==='object'){
    CLASS_CONFIG.className='5A3';
  }
}catch(_){}

function removeDuplicateAICards(){
  try{
    const page=document.getElementById('page-ai');
    if(!page)return;
    page.querySelectorAll('.ui-complete-page').forEach(el=>el.remove());
  }catch(e){console.warn('[AI DEDUPE]',e)}
}

function arr(name){
  try{
    const value=window[name];
    if(Array.isArray(value))return value;
  }catch(_){}
  return [];
}

function text(v){return String(v==null?'':v).trim();}

function normStatus(v){
  const s=text(v).toLowerCase();
  if(['excused','co phép','có phép','co phep'].includes(s))return 'excused';
  if(['absent','không phép','khong phep'].includes(s))return 'absent';
  return 'present';
}

function studentKey(record){
  return text(record?.studentId||record?.id||record?.studentCode);
}

function buildGPTReport(){
  const students=arr('students');
  const attendance=arr('attendanceRecords');
  const violations=arr('violationRecords');
  const rewards=arr('rewardRecords');
  const aMap=new Map(),vMap=new Map(),rMap=new Map();

  students.forEach(s=>{
    const id=text(s?.id||s?.studentId||s?.studentCode);
    if(id)aMap.set(id,{present:0,excused:0,absent:0});
  });

  attendance.forEach(r=>{
    const id=studentKey(r); if(!id)return;
    if(!aMap.has(id))aMap.set(id,{present:0,excused:0,absent:0});
    aMap.get(id)[normStatus(r.status)]++;
  });

  violations.forEach(r=>{
    const id=studentKey(r); if(id)vMap.set(id,(vMap.get(id)||0)+1);
  });

  rewards.forEach(r=>{
    const id=studentKey(r); if(id)rMap.set(id,(rMap.get(id)||0)+1);
  });

  const rows=students.map((s,i)=>{
    const id=text(s?.id||s?.studentId||s?.studentCode);
    const a=aMap.get(id)||{present:0,excused:0,absent:0};
    return {
      stt:i+1,
      name:text(s?.name)||id,
      excused:a.excused,
      absent:a.absent,
      totalAbsent:a.excused+a.absent,
      violations:vMap.get(id)||0,
      rewards:rMap.get(id)||0
    };
  });

  const total={
    students:rows.length,
    excused:rows.reduce((n,r)=>n+r.excused,0),
    absent:rows.reduce((n,r)=>n+r.absent,0),
    violations:rows.reduce((n,r)=>n+r.violations,0),
    rewards:rows.reduce((n,r)=>n+r.rewards,0)
  };

  const table=rows.map(r=>
    `| ${r.stt} | ${r.name.replace(/\|/g,'/')} | ${r.excused} | ${r.absent} | ${r.totalAbsent} | ${r.violations} | ${r.rewards} |`
  ).join('\n');

  const prompt=[
    'Tôi là giáo viên chủ nhiệm lớp 5A3.',
    'Hãy phân tích dữ liệu lớp học dưới đây và trả lời bằng tiếng Việt.',
    '',
    'YÊU CẦU:',
    '1. Nhận xét tổng quan tình hình chuyên cần, vi phạm, khen thưởng.',
    '2. Xác định học sinh cần quan tâm dựa trên số lần vắng và vi phạm.',
    '3. Nêu học sinh có thành tích tích cực nổi bật.',
    '4. Đề xuất biện pháp hỗ trợ ngắn gọn, thực tế.',
    '5. Giữ nguyên số liệu, không tự tạo hoặc suy diễn dữ liệu không có.',
    '6. Trình bày theo bảng và các nhóm ưu tiên rõ ràng.',
    '',
    `TỔNG QUAN: ${total.students} học sinh; vắng có phép ${total.excused}; vắng không phép ${total.absent}; vi phạm ${total.violations}; khen thưởng ${total.rewards}.`,
    '',
    'BẢNG TỔNG HỢP:',
    '| STT | Học sinh | Vắng có phép | Vắng không phép | Tổng vắng | Vi phạm | Khen thưởng |',
    '|---:|---|---:|---:|---:|---:|---:|',
    table
  ].join('\n');

  return {rows,total,prompt};
}

function copyText(value){
  const fallback=()=>{
    try{
      const ta=document.createElement('textarea');
      ta.value=value;
      ta.style.position='fixed';
      ta.style.left='-9999px';
      document.body.appendChild(ta);
      ta.select();
      const ok=document.execCommand('copy');
      ta.remove();
      return ok;
    }catch(_){return false;}
  };
  try{
    if(navigator.clipboard&&window.isSecureContext){
      return navigator.clipboard.writeText(value).then(()=>true).catch(()=>fallback());
    }
  }catch(_){}
  return Promise.resolve(fallback());
}

function escapeHtml(v){
  return text(v)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/\"/g,'&quot;')
    .replace(/'/g,'&#039;');
}

function injectGPTSummaryUI(){
  try{
    const page=document.getElementById('page-ai');
    if(!page)return;
    page.querySelectorAll('#lhGPTSummaryCard').forEach(el=>el.remove());

    const card=document.createElement('section');
    card.id='lhGPTSummaryCard';
    card.className='ai-disclaimer';
    card.style.marginTop='18px';
    card.style.display='block';
    card.innerHTML=`
      <div style="display:flex;align-items:flex-start;gap:12px;flex-wrap:wrap;">
        <i class="fa-solid fa-robot" style="font-size:20px;line-height:1.4"></i>
        <div style="flex:1;min-width:240px;">
          <strong>GPT – Tổng hợp toàn hệ thống</strong>
          <p style="margin:6px 0 0;">Tự lập bảng vắng, vi phạm, khen thưởng theo từng học sinh. Kiểm tra bảng trước khi mở ChatGPT.</p>
        </div>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:14px;">
        <button type="button" class="button primary" id="lhGPTBuildButton"><i class="fa-solid fa-table-list"></i> Tổng hợp dữ liệu</button>
        <button type="button" class="button secondary" id="lhGPTCopyButton" disabled><i class="fa-solid fa-copy"></i> Sao chép bảng + prompt</button>
        <button type="button" class="button secondary" id="lhGPTOpenButton" disabled><i class="fa-solid fa-up-right-from-square"></i> Mở ChatGPT</button>
      </div>
      <div id="lhGPTReportView" style="display:none;margin-top:14px;overflow:auto;"></div>`;
    page.appendChild(card);

    const buildBtn=card.querySelector('#lhGPTBuildButton');
    const copyBtn=card.querySelector('#lhGPTCopyButton');
    const openBtn=card.querySelector('#lhGPTOpenButton');
    const view=card.querySelector('#lhGPTReportView');
    let latest=null;

    function renderReport(report){
      const body=report.rows.map(r=>
        `<tr><td>${r.stt}</td><td>${escapeHtml(r.name)}</td><td>${r.excused}</td><td>${r.absent}</td><td>${r.totalAbsent}</td><td>${r.violations}</td><td>${r.rewards}</td></tr>`
      ).join('');
      view.innerHTML=`<div style="margin-bottom:10px;"><strong>${report.total.students} học sinh</strong> · Vắng có phép ${report.total.excused} · Vắng không phép ${report.total.absent} · Vi phạm ${report.total.violations} · Khen thưởng ${report.total.rewards}</div><table class="data-table" style="min-width:760px;"><thead><tr><th>STT</th><th>Học sinh</th><th>Vắng có phép</th><th>Vắng không phép</th><th>Tổng vắng</th><th>Vi phạm</th><th>Khen thưởng</th></tr></thead><tbody>${body}</tbody></table>`;
      view.style.display='block';
    }

    buildBtn.addEventListener('click',function(e){
      e.preventDefault();e.stopPropagation();
      latest=buildGPTReport();
      if(!latest.rows.length){window.showToast?.('Chưa có danh sách học sinh để tổng hợp.','warning');return;}
      renderReport(latest);
      copyBtn.disabled=false;
      openBtn.disabled=false;
      window.showToast?.(`Đã tổng hợp ${latest.rows.length} học sinh. Hãy kiểm tra bảng trước khi mở ChatGPT.`,'success');
    },{passive:false});

    copyBtn.addEventListener('click',function(e){
      e.preventDefault();e.stopPropagation();
      if(!latest)return;
      copyText(latest.prompt).then(ok=>window.showToast?.(ok?'Đã sao chép bảng + prompt.':'Không thể tự sao chép. Hãy sao chép thủ công từ báo cáo.',ok?'success':'warning'));
    },{passive:false});

    openBtn.addEventListener('click',function(e){
      e.preventDefault();e.stopPropagation();
      if(!latest)return;
      const win=window.open('https://chatgpt.com/','_blank','noopener,noreferrer');
      if(!win){window.showToast?.('Trình duyệt đã chặn cửa sổ ChatGPT. Hãy cho phép popup cho trang này.','warning');return;}
      copyText(latest.prompt).then(ok=>window.showToast?.(ok?'Đã mở ChatGPT và sao chép dữ liệu. Dán Ctrl+V để phân tích.':'Đã mở ChatGPT. Hãy sao chép bảng rồi dán vào ChatGPT.','success'));
    },{passive:false});
  }catch(e){console.warn('[GPT SUMMARY]',e)}
}

window.addEventListener('DOMContentLoaded',function(){
  removeDuplicateAICards();
  injectGPTSummaryUI();
  try{
    const classSelect=document.getElementById('classSelect');
    if(classSelect)classSelect.value='5A3';
    const hero=document.getElementById('heroClass');
    if(hero)hero.textContent='Lớp 5A3';
  }catch(_){}
},{once:true});

window.addEventListener('google-sheets-data-ready',function(){
  try{if(typeof window.syncAppDataReferences==='function')window.syncAppDataReferences()}catch(_){}
  try{if(typeof window.renderStudents==='function')window.renderStudents()}catch(_){}
  try{if(typeof window.renderDashboard==='function')window.renderDashboard()}catch(_){}
  removeDuplicateAICards();
});

window.LH_AIDedupe={removeDuplicateAICards,buildGPTReport};
})();