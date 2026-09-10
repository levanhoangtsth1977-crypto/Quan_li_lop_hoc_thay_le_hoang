/* BEHAVIOR UI CANONICAL 1.0
 * One display owner for Vi phạm / Khen thưởng.
 * Does not delete source records; exact duplicate rows are collapsed for display only.
 * Canonical labels match the teacher's approved quick-pick catalogs.
 */
(function(){
  'use strict';
  if(window.__LH_BEHAVIOR_UI_CANONICAL_10__) return;
  window.__LH_BEHAVIOR_UI_CANONICAL_10__=true;

  const VIOLATIONS=[
    ['talking','Nói chuyện riêng, gây mất trật tự trong lớp học'],
    ['duty','Chưa thực hiện nhiệm vụ trực nhật theo phân công'],
    ['school-supplies','Quên mang đồ dùng học tập'],
    ['preparation','Chưa chuẩn bị bài trước khi đến lớp'],
    ['assignment','Chưa hoàn thành bài tập được giao'],
    ['focus','Chưa chú ý, tập trung trong giờ học'],
    ['late-assignment','Quên nộp bài hoặc nộp bài chưa đúng yêu cầu'],
    ['deadline-task','Chưa hoàn thành phần việc được phân công đúng thời hạn'],
    ['leave-seat','Ra khỏi chỗ ngồi khi chưa được phép'],
    ['change-seat','Tự ý đổi chỗ ngồi'],
    ['class-task','Chưa thực hiện đầy đủ nhiệm vụ học tập trên lớp'],
    ['participation','Chưa chủ động tham gia hoạt động học tập'],
    ['class-rules','Chưa thực hiện đúng nội quy lớp học'],
    ['school-rules','Chưa thực hiện đúng nội quy nhà trường'],
    ['peer-conduct','Ứng xử chưa phù hợp với bạn'],
    ['language','Sử dụng lời nói chưa phù hợp'],
    ['cleanliness','Chưa giữ gìn vệ sinh lớp học, trường học'],
    ['property','Chưa giữ gìn, bảo quản đồ dùng và tài sản chung'],
    ['dangerous-play','Chơi các trò nguy hiểm, gây mất an toàn'],
    ['other','Khác']
  ];
  const REWARDS=[
    ['returned-lost-item','Nhặt được của rơi, trả lại người mất'],
    ['help-difficult','Chủ động giúp đỡ bạn khi gặp khó khăn'],
    ['help-learning','Chủ động hỗ trợ bạn trong học tập'],
    ['help-teacher','Tích cực hỗ trợ thầy cô trong công việc chung'],
    ['share-supplies','Chia sẻ đồ dùng học tập với bạn'],
    ['support-peer','Biết nhường nhịn và giúp đỡ bạn'],
    ['care-plants','Chủ động chăm sóc, bảo vệ cây xanh'],
    ['pick-up-trash','Chủ động nhặt rác, giữ gìn vệ sinh chung'],
    ['self-duty','Tự giác thực hiện nhiệm vụ trực nhật'],
    ['protect-property','Giữ gìn, bảo quản tốt tài sản chung'],
    ['report-incident','Kịp thời báo giáo viên khi phát hiện sự việc bất thường'],
    ['safety-help','Chủ động hỗ trợ bạn thực hiện đúng quy định an toàn'],
    ['mediate-conflict','Chủ động giúp bạn giải quyết mâu thuẫn'],
    ['team-activity','Tích cực tham gia các hoạt động tập thể'],
    ['community-support','Tích cực tham gia hoạt động chia sẻ, hỗ trợ cộng đồng'],
    ['save-resources','Tự giác tiết kiệm điện, nước'],
    ['shared-books','Giữ gìn tốt sách vở, đồ dùng dùng chung'],
    ['good-idea','Có cách làm sáng tạo, hiệu quả trong học tập'],
    ['contest-achievement','Đạt thành tích trong hội thi, cuộc thi hoặc phong trào'],
    ['other','Khác']
  ];
  const VMAP=Object.fromEntries(VIOLATIONS); const RMAP=Object.fromEntries(REWARDS);
  const S=v=>String(v??'').trim();
  const esc=v=>S(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
  const norm=v=>S(v).replace(/\s+/g,' ').trim().toLocaleLowerCase('vi');
  const fmtDate=v=>{const m=S(v).match(/^(\d{4})[-\/]([0-9]{1,2})[-\/]([0-9]{1,2})/);return m?`${m[3].padStart(2,'0')}/${m[2].padStart(2,'0')}/${m[1]}`:S(v)||'—'};
  const students=()=>{try{return typeof window.getStudentsSafe==='function'?window.getStudentsSafe():(Array.isArray(window.students)?window.students:[])}catch{return[]}};
  const studentName=id=>{const s=students().find(x=>S(x.id)===S(id));return S(s?.name)||'Học sinh';};
  const records=kind=>{try{const fn=kind==='V'?'getViolationRecords':'getRewardRecords';return typeof window[fn]==='function'?(window[fn]()||[]):[]}catch{return[]}};
  const signature=(kind,r)=>[S(r.studentId),S(r.date||r.createdAt),S(r.type),S(r.level),S(r.status),S(r.action),S(r.formType),S(r.note)].map(norm).join('|');
  const unique=kind=>{const seen=new Set();return records(kind).filter(r=>{const k=signature(kind,r);if(seen.has(k))return false;seen.add(k);return true;});};
  function label(kind,r){const map=kind==='V'?VMAP:RMAP;const t=S(r.type);return map[t]||t||'Khác';}
  function getForm(kind,r){
    if(kind==='V') return S(r.action)||'Chưa ghi nhận';
    return S(r.formType)||'Chưa ghi nhận';
  }
  function ensureHead(table,kind){
    let thead=table.querySelector('thead');if(!thead)thead=table.createTHead();
    thead.innerHTML=kind==='V'
      ? '<tr><th>STT</th><th>Họ tên học sinh</th><th>Ngày vi phạm</th><th>Nội dung vi phạm</th><th>Hình thức xử lý</th><th>Thao tác</th></tr>'
      : '<tr><th>STT</th><th>Họ tên học sinh</th><th>Ngày khen thưởng</th><th>Nội dung khen thưởng</th><th>Hình thức khen thưởng</th><th>Thao tác</th></tr>';
  }
  function render(kind){
    const body=document.getElementById(kind==='V'?'violationTableBody':'rewardTableBody');if(!body)return;
    const table=body.closest('table');if(!table)return;
    ensureHead(table,kind);
    const data=unique(kind).sort((a,b)=>S(b.date||b.createdAt).localeCompare(S(a.date||a.createdAt))||studentName(a.studentId).localeCompare(studentName(b.studentId),'vi'));
    if(!data.length){body.innerHTML='<tr><td colspan="6"><div class="empty-state"><strong>'+ (kind==='V'?'Chưa có dữ liệu vi phạm':'Chưa có dữ liệu khen thưởng') +'</strong><p>Dữ liệu sẽ xuất hiện khi giáo viên ghi nhận.</p></div></td></tr>';return;}
    body.innerHTML=data.map((r,i)=>{
      const id=esc(r.id);
      return `<tr><td>${i+1}</td><td><strong>${esc(studentName(r.studentId))}</strong></td><td>${esc(fmtDate(r.date||r.createdAt))}</td><td>${esc(label(kind,r))}</td><td>${esc(getForm(kind,r))}</td><td><button type="button" class="icon-button danger" title="Xóa" data-canonical-delete="${id}" data-kind="${kind}"><i class="fa-solid fa-trash"></i></button></td></tr>`;
    }).join('');
    body.querySelectorAll('[data-canonical-delete]').forEach(btn=>btn.addEventListener('click',()=>{const kind2=btn.dataset.kind;const rec=records(kind2).find(x=>S(x.id)===S(btn.dataset.canonicalDelete));if(!rec){alert('Không tìm thấy bản ghi.');return;}if(confirm('Xóa bản ghi này?')){
      const fn=kind2==='V'?'deleteViolation':'deleteReward';
      try{const ok=typeof window[fn]==='function'?window[fn](rec.id):false;if(ok===false){alert('Không thể xóa bản ghi.');return;}render(kind2);if(window.__LH_BEHAVIOR_AI_API__?.refresh)window.__LH_BEHAVIOR_AI_API__.refresh();}catch(e){alert('Xóa thất bại: '+e.message)}
    }}));
  }
  function patchSelect(el,items){if(!el)return;const cur=S(el.value);el.replaceChildren(new Option(el.id==='lhType'?'Chọn':'Chọn nội dung',''));items.forEach(([v,t])=>el.add(new Option(t,v)));if(items.some(x=>x[0]===cur))el.value=cur;}
  function patchQuickPick(){
    patchSelect(document.getElementById('violationType'),VIOLATIONS);
    patchSelect(document.getElementById('rewardType'),REWARDS);
    const modal=document.querySelector('.ev-static-modal');
    if(modal){const title=norm(modal.querySelector('.ev-static-head h3')?.textContent);if(title.includes('vi phạm'))patchSelect(modal.querySelector('#lhType'),VIOLATIONS);else if(title.includes('khen thưởng'))patchSelect(modal.querySelector('#lhType'),REWARDS);}
  }
  function activeRefresh(){render('V');render('R');patchQuickPick();}
  const observer=new MutationObserver(muts=>{
    let need=false;
    for(const m of muts){if(m.addedNodes?.length)need=true;if(m.target?.id==='violationTableBody'||m.target?.id==='rewardTableBody')need=true;}
    if(need)setTimeout(activeRefresh,0);
  });
  function init(){
    try{observer.observe(document.body,{childList:true,subtree:true});}catch{}
    activeRefresh();
    ['google-sheet-record-saved','google-sheets-data-ready','google-sheets-refresh','data-changed','records-updated'].forEach(ev=>window.addEventListener(ev,()=>setTimeout(activeRefresh,0)));
    document.addEventListener('click',e=>{if(e.target.closest?.('[data-page="violations"],[data-page="rewards"]'))setTimeout(activeRefresh,0)},true);
    [300,1000,2500].forEach(ms=>setTimeout(activeRefresh,ms));
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
  window.LH_BEHAVIOR_UI_CANONICAL={render:activeRefresh,VIOLATIONS,REWARDS};
})();
