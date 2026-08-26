/* MENU RUNTIME FIX 8.1 — STATISTICS INTERACTION FIX */
(function(){'use strict';
if(window.__MENU_RUNTIME_FIX_810__)return;window.__MENU_RUNTIME_FIX_810__=true;
const $=s=>document.querySelector(s), text=v=>String(v??'').trim();
const tabKey={DIEM_DANH:'attendanceRecords',VI_PHAM:'violationRecords',KHEN_THUONG:'rewardRecords'};
function sid(r){return text(r&&typeof r==='object'?(r.studentId||r.id||r.studentCode||r.code):r)}
function students(){return Array.isArray(window.students)?window.students:((window.GOOGLE_SHEET_DATA&&Array.isArray(window.GOOGLE_SHEET_DATA.tabs?.HOC_SINH))?window.GOOGLE_SHEET_DATA.tabs.HOC_SINH:[])}
function sname(id){const s=students().find(x=>sid(x)===text(id));return text(s&&(s.name||s.studentName))||text(id)||'Không rõ học sinh'}
function recs(tab){let a=Array.isArray(window[tabKey[tab]])?window[tabKey[tab]].slice():[];if(!a.length&&window.GOOGLE_SHEET_DATA?.tabs&&Array.isArray(window.GOOGLE_SHEET_DATA.tabs[tab]))a=window.GOOGLE_SHEET_DATA.tabs[tab].slice();return a}
function absent(r){return /^(absent|excused|vắng|vang|có phép|co phep|không phép|khong phep)$/i.test(text(r&&r.status))}
function grouped(tab){const m=new Map();recs(tab).filter(r=>tab!=='DIEM_DANH'||absent(r)).forEach(r=>{const id=sid(r);if(!id)return;if(!m.has(id))m.set(id,[]);m.get(id).push(r)});return [...m].map(([id,records])=>({id,name:sname(id),records,count:records.length})).sort((a,b)=>b.count-a.count||a.name.localeCompare(b.name,'vi'))}
function host(){return $('#page-statistics')}
function ensure(){const sec=host();if(!sec)return null;let p=$('#lhLifetimeStatsPanel');if(!p){p=document.createElement('div');p.id='lhLifetimeStatsPanel';p.style.cssText='margin:0 0 20px;padding:16px;border:1px solid #dbe3ef;border-radius:16px;background:#fff;box-shadow:0 4px 18px rgba(15,23,42,.06)';const grid=$('#statisticsGrid');if(grid&&grid.parentNode===sec)sec.insertBefore(p,grid);else sec.appendChild(p)}return p}
function esc(v){return text(v).replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))}
function render(tab){const p=ensure();if(!p)return;const a=grouped('DIEM_DANH'),v=grouped('VI_PHAM'),r=grouped('KHEN_THUONG');const data=tab==='DIEM_DANH'?a:tab==='VI_PHAM'?v:r;const title=tab==='DIEM_DANH'?'HS vắng':tab==='VI_PHAM'?'HS vi phạm':'HS khen thưởng';const counts=[['DIEM_DANH',a],['VI_PHAM',v],['KHEN_THUONG',r]];p.innerHTML='<div><h2 style="margin:0">📊 Theo dõi toàn bộ quá trình</h2><p style="margin:5px 0;color:#64748b">Tổng hợp dữ liệu từ toàn bộ quá trình theo dõi.</p></div><div style="display:flex;gap:10px;flex-wrap:wrap;margin:15px 0">'+counts.map(x=>'<button type="button" class="button '+(x[0]===tab?'primary':'secondary')+'" data-lh-stat-tab="'+x[0]+'">'+(x[0]==='DIEM_DANH'?'👤 HS vắng':x[0]==='VI_PHAM'?'⚠️ HS vi phạm':'🏆 HS khen thưởng')+' ('+x[1].length+' HS / '+x[1].reduce((n,z)=>n+z.count,0)+' lượt)</button>').join('')+'</div><div id="lhLifetimeDetail"></div>';
const d=$('#lhLifetimeDetail');if(!data.length){d.innerHTML='<div class="empty-state"><strong>Chưa có dữ liệu</strong><p>Chưa có '+title.toLowerCase()+' trong dữ liệu hiện tại.</p></div>';return}
d.innerHTML='<div class="table-container" style="overflow:auto"><table class="data-table"><thead><tr><th>STT</th><th>Học sinh</th><th>Số lượt</th><th>Lần gần nhất</th><th>Thao tác</th></tr></thead><tbody>'+data.map((x,i)=>{const dates=x.records.map(z=>text(z.date||z.createdAt||z.updatedAt)).filter(Boolean).sort();return'<tr><td>'+(i+1)+'</td><td><strong>'+esc(x.name)+'</strong></td><td><strong>'+x.count+'</strong></td><td>'+esc(dates.at(-1)||'—')+'</td><td><button type="button" class="button danger" data-lh-delete-student="'+esc(x.id)+'" data-lh-delete-tab="'+tab+'">🗑️ Xóa</button></td></tr>'}).join('')}</tbody></table></div>'}
function show(){if(!host()?.classList.contains('active'))return;const p=ensure();if(!p)return;if(!p.dataset.ready)render('DIEM_DANH')}
function install(){document.addEventListener('click',e=>{const tab=e.target.closest('[data-lh-stat-tab]');if(tab){e.preventDefault();e.stopPropagation();render(tab.dataset.lhStatTab);return}const del=e.target.closest('[data-lh-delete-student]');if(del){e.preventDefault();e.stopPropagation();const tab=del.dataset.lhDeleteTab,id=del.dataset.lhDeleteStudent,row=grouped(tab).find(x=>x.id===id);if(!row)return;if(!confirm('Xóa toàn bộ '+row.count+' bản ghi của '+row.name+' trong mục này?'))return;let arr=Array.isArray(window[tabKey[tab]])?window[tabKey[tab]]:null;if(arr){for(let i=arr.length-1;i>=0;i--)if(sid(arr[i])===id&& (tab!=='DIEM_DANH'||absent(arr[i])))arr.splice(i,1);try{localStorage.setItem(tabKey[tab],JSON.stringify(arr))}catch(_){}if(typeof window.saveClassData==='function')try{window.saveClassData()}catch(_){}render(tab);if(typeof window.showToast==='function')window.showToast('Đã xóa dữ liệu của '+row.name+'.','success')}else if(typeof window.showToast==='function')window.showToast('Chưa có hàm xóa dữ liệu Google cho mục này.','warning');return}});const observer=new MutationObserver(()=>{if(host()?.classList.contains('active'))show()});observer.observe(document.body,{subtree:true,attributes:true,attributeFilter:['class']});window.addEventListener('google-sheets-data-ready',()=>{if(host()?.classList.contains('active'))render('DIEM_DANH')});window.addEventListener('google-sheet-record-saved',()=>{if(host()?.classList.contains('active'))render('DIEM_DANH')})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();})();

/* STUDENT PROFILE REPAIR LOADER — intentionally isolated from existing modules */
(function(){'use strict';
  const load=()=>{
    if(window.__LH_STUDENT_PROFILE_REPAIR_LOADED__)return;
    if(document.querySelector('script[data-lh-profile-repair]'))return;
    const s=document.createElement('script');
    s.src='student-profile-repair.js?v=20260826.2';
    s.async=false;
    s.dataset.lhProfileRepair='1';
    s.onload=()=>{window.__LH_STUDENT_PROFILE_REPAIR_LOADED__=true};
    document.head.appendChild(s);
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',load,{once:true});else load();
  window.addEventListener('google-sheets-data-ready',load,{once:false});
})();

/* REWARD DELETE REPAIR LOADER — isolated from other record modules */
(function(){'use strict';
  const load=()=>{
    if(document.querySelector('script[data-lh-reward-delete-fix]'))return;
    const s=document.createElement('script');
    s.src='reward-delete-fix.js?v=20260826.1';
    s.async=false;
    s.dataset.lhRewardDeleteFix='1';
    document.head.appendChild(s);
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',load,{once:true});else load();
  setTimeout(load,500);
  setTimeout(load,1500);
})();