/* DATA SYNC VIETNAMESE FIX — SAFE COMPATIBILITY LAYER */
(function(){
'use strict';
if(window.__LH_DATA_SYNC_VIETNAMESE_FIX__)return;
window.__LH_DATA_SYNC_VIETNAMESE_FIX__=true;

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
  try{
    const value=eval(name);
    if(Array.isArray(value))return value;
  }catch(_){}
  return [];
}
function text(v){return String(v==null?'':v).trim()}
function normStatus(v){
  const s=text(v).toLowerCase();
  if(['excused','co phép','có phép','co phep'].includes(s))return 'excused';
  if(['absent','không phép','khong phep'].includes(s))return 'absent';
  return 'present';
}
function studentKey(s){return text(s?.id||s?.studentId||s?.studentCode)}
function buildGPTReport(){
  const students=arr('students');
  const attendance=arr('attendanceRecords');
  const violations=arr('violationRecords');
  const rewards=arr('rewardRecords');
  const vMap=new Map(), rMap=new Map(), aMap=new Map();
  students.forEach(s=>{const id=studentKey(s);if(id)aMap.set(id,{present:0,excused:0,absent:0})});
  attendance.forEach(r=>{const id=studentKey(r);if(!id)return;if(!aMap.has(id))aMap.set(id,{present:0,excused:0,absent:0});aMap.get(id)[normStatus(r.status)]++});
  violations.forEach(r=>{const id=studentKey(r);if(id)vMap.set(id,(vMap.get(id)||0)+1)});
  rewards.forEach(r=>{const id=studentKey(r);if(id)rMap.set(id,(rMap.get(id)||0)+1)});
  const rows=students.map((s,i)=>{
    const id=studentKey(s),a=aMap.get(id)||{present:0,excused:0,absent:0};
    return {stt:i+1,name:text(s.name)||id,excused:a.excused,absent:a.absent,totalAbsent:a.excused+a.absent,violations:vMap.get(id)||0,rewards:rMap.get(id)||0}
  });
  const total={students:rows.length,excused:rows.reduce((n,r)=>n+r.excused,0),absent:rows.reduce((n,r)=>n+r.absent,0),violations:rows.reduce((n,r)=>n+r.violations,0),rewards:rows.reduce((n,r)=>n+r.rewards,0)};
  const table=rows.map(r=>`| ${r.stt} | ${r.name.replace(/\|/g,'/')} | ${r.excused} | ${r.absent} | ${r.totalAbsent} | ${r.violations} | ${r.rewards} |`).join('\n');
  const prompt=`Tôi là giáo viên chủ nhiệm. Hãy phân tích dữ liệu lớp học dưới đây và trả lời bằng tiếng Việt.\n\nYÊU CẦU:\n1. Nhận xét tổng quan tình hình chuyên cần, vi phạm, khen thưởng.\n2. Xác định học sinh cần quan tâm dựa trên số ngày vắng và số vi phạm.\n3. Nêu học sinh có thành tích tích cực nổi bật.\n4. Đề xuất biện pháp hỗ trợ ngắn gọn, thực tế.\n5. Giữ nguyên số liệu, không tự suy đoán dữ liệu không có.\n\nTỔNG QUAN: ${total.students} học sinh; vắng có phép ${total.excused}; vắng không phép ${total.absent}; vi phạm ${total.violations}; khen thưởng ${total.rewards}.\n\nBẢNG TỔNG HỢP:\n| STT | Học sinh | Vắng có phép | Vắng không phép | Tổng vắng | Vi phạm | Khen thưởng |\n|---:|---|---:|---:|---:|---:|---:|\n${table}`;
  return {rows,total,prompt};
}
function copyText(value){
  const fallback=()=>{try{const ta=document.createElement('textarea');ta.value=value;ta.style.position='fixed';ta.style.left='-9999px';document.body.appendChild(ta);ta.select();const ok=document.execCommand('copy');ta.remove();return ok}catch(_){return false}};
  if(navigator.clipboard&&window.isSecureContext)return navigator.clipboard.writeText(value).then(()=>true).catch(()=>fallback());
  return Promise.resolve(fallback());
}
function injectGPTSummaryUI(){
  try{
    const page=document.getElementById('page-ai');
    if(!page||document.getElementById('lhGPTSummaryCard'))return;
    const card=document.createElement('div');
    card.id='lhGPTSummaryCard';
    card.className='ai-disclaimer';
    card.style.marginTop='18px';
    card.style.cursor='pointer';
    card.innerHTML='<i class="fa-solid fa-wand-magic-sparkles"></i><div><strong>GPT – Tổng hợp toàn hệ thống</strong><p>Tự lập bảng vắng, vi phạm, khen thưởng theo từng học sinh và mở ChatGPT để phân tích.</p></div>';
    const button=document.createElement('button');
    button.type='button';button.className='button primary';button.id='lhGPTSummaryButton';
    button.innerHTML='<i class="fa-solid fa-robot"></i> Tổng hợp & mở ChatGPT';
    card.appendChild(button);
    page.appendChild(card);
    button.addEventListener('click',async e=>{
      e.preventDefault();e.stopPropagation();
      const report=buildGPTReport();
      if(!report.rows.length){window.showToast?.('Chưa có danh sách học sinh để tổng hợp.','warning');return}
      const ok=await copyText(report.prompt);
      window.open('https://chatgpt.com/','_blank','noopener,noreferrer');
      window.showToast?.(ok?'Đã tạo bảng tổng hợp và sao chép nội dung. Mở ChatGPT rồi dán (Ctrl+V) để phân tích.':'Đã mở ChatGPT. Hãy sao chép lại nội dung nếu clipboard không được cấp quyền.','success');
    });
  }catch(e){console.warn('[GPT SUMMARY]',e)}
}

window.addEventListener('DOMContentLoaded',function(){
  removeDuplicateAICards();
  injectGPTSummaryUI();
  const page=document.getElementById('page-ai');
  if(page&&!window.__LH_AI_DEDUPE_OBSERVER__){
    const observer=new MutationObserver(function(){
      page.querySelectorAll('.ui-complete-page').forEach(el=>el.remove());
      if(!document.getElementById('lhGPTSummaryCard'))injectGPTSummaryUI();
    });
    observer.observe(page,{childList:true,subtree:true});
    window.__LH_AI_DEDUPE_OBSERVER__=observer;
  }
},{once:true});

window.addEventListener('google-sheets-data-ready',function(){
  try{if(typeof window.syncAppDataReferences==='function')window.syncAppDataReferences()}catch(_){}
  try{if(typeof window.renderStudents==='function')window.renderStudents()}catch(_){}
  try{if(typeof window.renderDashboard==='function')window.renderDashboard()}catch(_){}
  removeDuplicateAICards();
  injectGPTSummaryUI();
});

window.LH_AIDedupe={removeDuplicateAICards,buildGPTReport};
})();
