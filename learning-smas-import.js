/*
 * LEARNING SMAS IMPORT 1.0
 * - Gộp Nhận xét vào Học tập ở tầng giao diện.
 * - Nhập bảng tổng hợp SMAS: GHK1, CHK1, GHK2, CHK2.
 * - Không ghi đè Google Sheets / dữ liệu lớp hiện tại.
 * - Lưu bản nhập riêng để làm nguồn dữ liệu cho chức năng xét HS xuất sắc sau này.
 */
(function(){
'use strict';
if(window.__LEARNING_SMAS_IMPORT_10__) return;
window.__LEARNING_SMAS_IMPORT_10__=true;

const STORE='QL_LE_HOANG_SMAS_SUMMARY_2026_2027';
const PERIODS=['GHK1','CHK1','GHK2','CHK2'];
const LABELS={GHK1:'Giữa học kỳ 1',CHK1:'Cuối học kỳ 1',GHK2:'Giữa học kỳ 2',CHK2:'Cuối học kỳ 2'};
const esc=v=>String(v??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const text=v=>String(v??'').trim();

function loadStore(){
 try{const x=JSON.parse(localStorage.getItem(STORE)||'[]');return Array.isArray(x)?x:[];}catch(e){return []}
}
function saveStore(x){localStorage.setItem(STORE,JSON.stringify(x));}
function normalizeName(v){return text(v).replace(/\s+/g,' ').toLocaleLowerCase('vi');}
function detectPeriod(name){
 const s=text(name).toUpperCase();
 for(const p of PERIODS) if(s.includes(p)) return p;
 const map=[['GIUA HOC KY 1','GHK1'],['CUOI HOC KY 1','CHK1'],['GIUA HOC KY 2','GHK2'],['CUOI HOC KY 2','CHK2'],['GIUA HK1','GHK1'],['CUOI HK1','CHK1'],['GIUA HK2','GHK2'],['CUOI HK2','CHK2']];
 for(const [k,p] of map) if(s.includes(k)) return p;
 return '';
}

function ensurePanel(){
 const learning=document.querySelector('[data-page-section="learning"]');
 if(!learning) return null;
 let panel=document.getElementById('lhSmasSummaryPanel');
 if(panel) return panel;
 panel=document.createElement('section');
 panel.id='lhSmasSummaryPanel';
 panel.style.cssText='margin:0 0 24px;padding:18px;border:1px solid #dbe3ef;border-radius:16px;background:#fff;box-shadow:0 2px 8px rgba(15,23,42,.04)';
 panel.innerHTML=`
  <div style="display:flex;justify-content:space-between;gap:16px;align-items:flex-start;flex-wrap:wrap">
   <div><span style="font-size:12px;font-weight:700;color:#2563eb">DỮ LIỆU ĐỊNH KỲ</span><h2 style="margin:4px 0 6px">📥 Bảng tổng hợp SMAS</h2><p style="margin:0;color:#64748b">Tải các bảng tổng hợp GHK1, CHK1, GHK2, CHK2. Dữ liệu được lưu riêng và không ghi đè dữ liệu lớp.</p></div>
   <div style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" class="button primary" id="lhSmasUploadBtn"><i class="fa-solid fa-cloud-arrow-up"></i> Tải lên SMAS</button><button type="button" class="button secondary" id="lhSmasClearBtn"><i class="fa-solid fa-trash"></i> Xóa dữ liệu SMAS</button></div>
  </div>
  <input id="lhSmasFileInput" type="file" accept=".xlsx,.xls,.csv" multiple hidden>
  <div id="lhSmasStatus" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:10px;margin-top:16px"></div>
  <div id="lhSmasSummary" style="margin-top:14px"></div>
  <div style="margin-top:12px;padding:10px 12px;border-radius:10px;background:#f8fafc;color:#475569;font-size:13px">🔐 <strong>Nguồn xét HS xuất sắc:</strong> dữ liệu SMAS được giữ nguyên theo từng đợt, có thể đối chiếu GHK1 → CHK1 → GHK2 → CHK2 khi xây dựng bộ tiêu chí xét chọn.</div>`;
 const header=learning.querySelector('.page-header');
 if(header&&header.nextSibling) learning.insertBefore(panel,header.nextSibling); else learning.prepend(panel);
 bindPanel(panel);
 renderStatus();
 return panel;
}

function bindPanel(panel){
 const input=panel.querySelector('#lhSmasFileInput');
 panel.querySelector('#lhSmasUploadBtn').addEventListener('click',()=>input.click());
 input.addEventListener('change',async()=>{
  const files=[...(input.files||[])];
  if(files.length) await importFiles(files);
  input.value='';
 });
 panel.querySelector('#lhSmasClearBtn').addEventListener('click',()=>{
  if(!loadStore().length){toast('Chưa có dữ liệu SMAS để xóa.','warning');return}
  if(!confirm('Xóa toàn bộ dữ liệu SMAS đã tải lên? Dữ liệu Google Sheets không bị ảnh hưởng.')) return;
  saveStore([]);renderStatus();toast('Đã xóa dữ liệu SMAS khỏi bộ nhớ của website.','success');
 });
}

async function loadXLSX(){
 if(typeof XLSX!=='undefined') return true;
 if(typeof window.loadSheetJS==='function') return await window.loadSheetJS();
 return await new Promise(resolve=>{
  const old=document.querySelector('script[data-lh-smas-xlsx]');
  if(old){old.addEventListener('load',()=>resolve(true),{once:true});old.addEventListener('error',()=>resolve(false),{once:true});return}
  const s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';s.async=false;s.dataset.lhSmasXlsx='1';s.onload=()=>resolve(true);s.onerror=()=>resolve(false);document.head.appendChild(s);
 });
}

async function importFiles(files){
 const ok=await loadXLSX();
 if(!ok){toast('Không tải được thư viện đọc Excel/CSV.','error');return}
 const old=loadStore();
 const used=new Set(old.map(x=>x.period));
 let imported=0;
 for(const file of files){
  try{
   const buffer=await file.arrayBuffer();
   const wb=XLSX.read(buffer,{type:'array',cellDates:true});
   const detected=detectPeriod(file.name)||detectPeriod(wb.SheetNames.join(' '));
   let period=detected;
   if(!period && files.length===4){period=PERIODS[files.indexOf(file)]||''}
   if(!period){toast('Không xác định được GHK1/CHK1/GHK2/CHK2 cho file '+file.name+'. Hãy đặt tên file có mã kỳ.','warning');continue}
   const sheets=[];
   let totalRows=0;
   for(const sheetName of wb.SheetNames){
    const ws=wb.Sheets[sheetName];
    const rows=XLSX.utils.sheet_to_json(ws,{header:1,defval:'',raw:false});
    if(!rows.length) continue;
    const headers=(rows[0]||[]).map(text);
    const data=rows.slice(1).filter(r=>r.some(v=>text(v)!==''));
    sheets.push({name:sheetName,headers,rows:data});
    totalRows+=data.length;
   }
   const record={period,fileName:file.name,importedAt:new Date().toISOString(),sheets,totalRows};
   const index=old.findIndex(x=>x.period===period);
   if(index>=0) old[index]=record; else old.push(record);
   used.add(period);imported++;
  }catch(err){console.error('[SMAS IMPORT]',err);toast('Không thể đọc '+file.name+': '+(err.message||'file không hợp lệ'),'error')}
 }
 saveStore(old.sort((a,b)=>PERIODS.indexOf(a.period)-PERIODS.indexOf(b.period)));
 renderStatus();
 if(imported) toast(`Đã tải ${imported} bảng tổng hợp SMAS. Dữ liệu đã sẵn sàng làm nguồn đối chiếu sau này.`,'success');
}

function renderStatus(){
 const p=document.getElementById('lhSmasSummaryPanel');if(!p)return;
 const data=loadStore();
 const status=p.querySelector('#lhSmasStatus');
 status.innerHTML=PERIODS.map(period=>{
  const r=data.find(x=>x.period===period);
  return `<div style="padding:12px;border:1px solid ${r?'#bbf7d0':'#e2e8f0'};border-radius:12px;background:${r?'#f0fdf4':'#f8fafc'}"><strong>${LABELS[period]}</strong><div style="font-size:12px;margin-top:5px;color:#64748b">${r?'✅ Đã tải · '+r.totalRows+' dòng':'⏳ Chưa có dữ liệu'}</div>${r?`<div style="font-size:11px;margin-top:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title="${esc(r.fileName)}">${esc(r.fileName)}</div>`:''}</div>`;
 }).join('');
 const summary=p.querySelector('#lhSmasSummary');
 const total=data.reduce((n,r)=>n+(Number(r.totalRows)||0),0);
 summary.innerHTML=data.length?`<div style="display:flex;gap:14px;flex-wrap:wrap;color:#334155"><span><strong>${data.length}/4</strong> kỳ đã tải</span><span><strong>${total}</strong> dòng dữ liệu</span><span><strong>${buildEvidence().length}</strong> học sinh có dữ liệu định kỳ</span></div>`:'<div class="empty-state"><strong>Chưa có bảng tổng hợp SMAS</strong><p>Hãy tải đủ 4 kỳ để có cơ sở đối chiếu xuyên suốt năm học.</p></div>';
}

function buildEvidence(){
 const map=new Map();
 for(const r of loadStore()) for(const sh of (r.sheets||[])){
  const headers=sh.headers||[];
  const nameIndex=headers.findIndex(h=>/họ.?và.?tên|họ.?tên|ho.?ten|student.?name/i.test(text(h)));
  for(const row of sh.rows||[]){
   if(nameIndex<0) continue;
   const name=text(row[nameIndex]);if(!name)continue;
   const key=normalizeName(name);
   if(!map.has(key))map.set(key,{name,periods:[],records:[]});
   const x=map.get(key);if(!x.periods.includes(r.period))x.periods.push(r.period);x.records.push({period:r.period,file:r.fileName,sheet:sh.name,row});
  }
 }
 return [...map.values()].sort((a,b)=>a.name.localeCompare(b.name,'vi'));
}

window.getSMASSummaryData=loadStore;
window.getExcellentStudentEvidence=buildEvidence;
window.getSMASPeriods=()=>PERIODS.slice();

function mergeCommentsIntoLearning(){
 const learning=document.querySelector('[data-page-section="learning"]');
 const comments=document.querySelector('[data-page-section="comments"]');
 if(!learning||!comments||document.getElementById('lhMergedComments')) return;
 const wrap=document.createElement('section');wrap.id='lhMergedComments';wrap.style.cssText='margin-top:24px;padding-top:24px;border-top:1px solid #e2e8f0';
 while(comments.firstChild) wrap.appendChild(comments.firstChild);
 learning.appendChild(wrap);
 comments.hidden=true;comments.style.display='none';comments.dataset.mergedInto='learning';
 const menu=document.querySelector('.menu-item[data-page="comments"]');if(menu)menu.style.display='none';
}

function refreshComments(){
 if(document.querySelector('[data-page-section="learning"].active')&&typeof window.renderComments==='function'){
  try{window.renderComments()}catch(e){console.warn('[SMAS] renderComments',e)}
 }
}

function toast(message,type){if(typeof window.showToast==='function')window.showToast(message,type);else console.info(message)}
function init(){
 mergeCommentsIntoLearning();
 ensurePanel();
 refreshComments();
 window.addEventListener('google-sheets-data-ready',()=>{mergeCommentsIntoLearning();ensurePanel();refreshComments()});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
setTimeout(init,500);
setTimeout(init,1500);
})();