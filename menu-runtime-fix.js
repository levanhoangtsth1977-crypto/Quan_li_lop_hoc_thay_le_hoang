/* MENU RUNTIME FIX 8.8 — lean statistics enhancer + isolated loaders
   Navigation is owned by script.js + UI ACTION PATCH 2.1.0.
   No extra menu router. No repeated timer loaders.
*/
(function(){
  'use strict';
  if(window.__MENU_RUNTIME_FIX_880__) return;
  window.__MENU_RUNTIME_FIX_880__=true;

  const $=s=>document.querySelector(s), text=v=>String(v??'').trim();
  const tabKey={DIEM_DANH:'attendanceRecords',VI_PHAM:'violationRecords',KHEN_THUONG:'rewardRecords'};
  function sid(r){return text(r&&typeof r==='object'?(r.studentId||r.id||r.studentCode||r.code):r)}
  function students(){return Array.isArray(window.students)?window.students:((window.GOOGLE_SHEET_DATA&&Array.isArray(window.GOOGLE_SHEET_DATA.tabs?.HOC_SINH))?window.GOOGLE_SHEET_DATA.tabs.HOC_SINH:[])}
  function sname(id){const s=students().find(x=>sid(x)===text(id));return text(s&&(s.name||s.studentName))||text(id)||'Không rõ học sinh'}
  function recs(tab){let a=Array.isArray(window[tabKey[tab]])?window[tabKey[tab]].slice():[];if(!a.length&&window.GOOGLE_SHEET_DATA?.tabs&&Array.isArray(window.GOOGLE_SHEET_DATA.tabs[tab]))a=window.GOOGLE_SHEET_DATA.tabs[tab].slice();return a}
  function absent(r){return /^(absent|excused|vắng|vang|có phép|co phep|không phép|khong phep)$/i.test(text(r&&r.status))}
  function grouped(tab){const m=new Map();recs(tab).filter(r=>tab!=='DIEM_DANH'||absent(r)).forEach(r=>{const id=sid(r);if(!id)return;if(!m.has(id))m.set(id,[]);m.get(id).push(r)});return [...m].map(([id,records])=>({id,name:sname(id),records,count:records.length})).sort((a,b)=>b.count-a.count||a.name.localeCompare(b.name,'vi'))}
  function host(){return $('#page-statistics')}
  function ensure(){const sec=host();if(!sec)return null;let p=$('#lhLifetimeStatsPanel');if(!p){p=document.createElement('div');p.id='lhLifetimeStatsPanel';p.style.cssText='margin:0 0 20px;padding:16px;border:1px solid #dbe3ef;border-radius:16px;background:#fff';const grid=$('#statisticsGrid');if(grid&&grid.parentNode===sec)sec.insertBefore(p,grid);else sec.appendChild(p)}return p}
  function esc(v){return text(v).replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))}
  function render(tab){const p=ensure();if(!p)return;const a=grouped('DIEM_DANH'),v=grouped('VI_PHAM'),r=grouped('KHEN_THUONG'),data=tab==='DIEM_DANH'?a:tab==='VI_PHAM'?v:r,title=tab==='DIEM_DANH'?'HS vắng':tab==='VI_PHAM'?'HS vi phạm':'HS khen thưởng';p.innerHTML='<div><h2 style="margin:0">📊 Theo dõi toàn bộ quá trình</h2></div><div style="display:flex;gap:10px;flex-wrap:wrap;margin:15px 0">'+[['DIEM_DANH',a,'👤 HS vắng'],['VI_PHAM',v,'⚠️ HS vi phạm'],['KHEN_THUONG',r,'🏆 HS khen thưởng']].map(x=>'<button type="button" class="button '+(x[0]===tab?'primary':'secondary')+'" data-lh-stat-tab="'+x[0]+'">'+x[2]+' ('+x[1].length+' HS / '+x[1].reduce((n,z)=>n+z.count,0)+' lượt)</button>').join('')+'</div><div id="lhLifetimeDetail"></div>';const d=$('#lhLifetimeDetail');if(!data.length){d.innerHTML='<div class="empty-state"><strong>Chưa có dữ liệu</strong><p>Chưa có '+title.toLowerCase()+' trong dữ liệu hiện tại.</p></div>';return}d.innerHTML='<div class="table-container" style="overflow:auto"><table class="data-table"><thead><tr><th>STT</th><th>Học sinh</th><th>Số lượt</th><th>Lần gần nhất</th></tr></thead><tbody>'+data.map((x,i)=>{const dates=x.records.map(z=>text(z.date||z.createdAt||z.updatedAt)).filter(Boolean).sort();return'<tr><td>'+(i+1)+'</td><td><strong>'+esc(x.name)+'</strong></td><td><strong>'+x.count+'</strong></td><td>'+esc(dates.at(-1)||'—')+'</td></tr>'}).join('')+'</tbody></table></div>'}
  function install(){document.addEventListener('click',function(e){const tab=e.target&&e.target.closest?e.target.closest('[data-lh-stat-tab]'):null;if(tab){e.preventDefault();e.stopPropagation();render(tab.dataset.lhStatTab);}},false)}
  function loadOnce(src,attr){if(document.querySelector('script['+attr+']'))return;const s=document.createElement('script');s.src=src;s.async=false;s.setAttribute(attr,'1');document.head.appendChild(s)}
  function boot(){
    loadOnce('student-profile-repair.js?v=20260826.2','data-lh-profile-repair');
    loadOnce('reward-delete-fix.js?v=20260826.1','data-lh-reward-delete-fix');
    loadOnce('menu-badge-sync-fix.js?v=20260826.1','data-lh-menu-badge-sync');
    loadOnce('home-data-sync-fix.js?v=20260826.1','data-lh-home-data-sync');
    loadOnce('learning-smas-import.js?v=20260826.1','data-lh-learning-smas-import');
    loadOnce('learning-student-picker-fix.js?v=20260826.2','data-lh-learning-student-picker-fix');
    loadOnce('excellent-student-engine.js?v=20260826.1','data-lh-excellent-student-engine');
    loadOnce('attendance-status-final-fix.js?v=8.0.0','data-lh-attendance-status-final-fix');
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){install();boot();},{once:true});else{install();boot()}
})();
