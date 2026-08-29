/*
 * LEARNING SMAS IMPORT 2.0
 * - Mỗi giai đoạn có nút tải riêng: GHK1 / CHK1 / GHK2 / CHK2.
 * - File được gán vào đúng giai đoạn đã chọn, không suy diễn kỳ từ thứ tự file.
 * - Nếu tên file có mã kỳ khác với nút đang chọn thì từ chối để tránh nhập nhầm.
 * - Chỉ thay thế dữ liệu của chính giai đoạn đó; các giai đoạn khác giữ nguyên.
 * - Đọc đúng bảng SMAS có tiêu đề nhiều dòng (header thường ở dòng 3).
 * - Không ghi đè dữ liệu Google Sheets / dữ liệu lớp.
 */
(function(){
'use strict';
if(window.__LEARNING_SMAS_IMPORT_20__) return;
window.__LEARNING_SMAS_IMPORT_20__=true;

const STORE='QL_LE_HOANG_SMAS_SUMMARY_2026_2027';
const PERIODS=['GHK1','CHK1','GHK2','CHK2'];
const LABELS={GHK1:'Giữa học kỳ 1',CHK1:'Cuối học kỳ 1',GHK2:'Giữa học kỳ 2',CHK2:'Cuối học kỳ 2'};
const SHEET_ALIASES={
 GHK1:['GHK1','GK1','GIUA HOC KY 1','GIUA HK1'],
 CHK1:['CHK1','CK1','CUOI HOC KY 1','CUOI HK1'],
 GHK2:['GHK2','GK2','GIUA HOC KY 2','GIUA HK2'],
 CHK2:['CHK2','CK2','CN','CUOI NAM','CUOI HOC KY 2','CUOI HK2']
};
const esc=v=>String(v??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const text=v=>String(v??'').trim();
function norm(v){return text(v).replace(/\s+/g,' ').toLocaleLowerCase('vi');}
function loadStore(){try{const x=JSON.parse(localStorage.getItem(STORE)||'[]');return Array.isArray(x)?x:[]}catch(e){return[]}}
function saveStore(x){localStorage.setItem(STORE,JSON.stringify(x));}
function detectPeriod(s){
 s=norm(s).toUpperCase();
 for(const p of PERIODS) if(s.includes(p)) return p;
 for(const p of PERIODS) for(const a of SHEET_ALIASES[p]) if(s.includes(a)) return p;
 return '';
}
function aliasesFor(period){return (SHEET_ALIASES[period]||[]).map(norm)}
function chooseSheets(wb,period){
 const aliases=aliasesFor(period);
 const exact=wb.SheetNames.filter(n=>aliases.includes(norm(n)));
 if(exact.length)return exact;
 const partial=wb.SheetNames.filter(n=>aliases.some(a=>norm(n).includes(a)||a.includes(norm(n))));
 return partial.length?partial:wb.SheetNames.slice(0,1);
}
function findHeaderRow(rows){
 const max=Math.min(rows.length,12);
 for(let i=0;i<max;i++){
  const line=(rows[i]||[]).map(text).join(' | ').toLocaleLowerCase('vi');
  if(/họ\s*và\s*tên|họ\s*tên/.test(line)) return i;
 }
 for(let i=0;i<max;i++) if((rows[i]||[]).filter(v=>text(v)!=='').length>=3)return i;
 return 0;
}
function parseSheet(ws){
 const rows=XLSX.utils.sheet_to_json(ws,{header:1,defval:'',raw:false});
 if(!rows.length)return null;
 const hi=findHeaderRow(rows);
 const headers=(rows[hi]||[]).map(text);
 const data=rows.slice(hi+1).filter(r=>r.some(v=>text(v)!==''));
 const nameIndex=headers.findIndex(h=>/họ\s*và\s*tên|họ\s*tên|ho.?ten|student.?name/i.test(h));
 return {headers,rows:data,headerRow:hi+1,nameIndex};
}
function buildStudentIndex(sheets){
 const map={};
 for(const sh of sheets||[]){
  const idx=Number.isInteger(sh.nameIndex)?sh.nameIndex:-1;
  if(idx<0)continue;
  for(const row of sh.rows||[]){
   const name=text(row[idx]);if(!name)continue;
   const key=norm(name);if(!map[key])map[key]={name,records:0};map[key].records++;
  }
 }
 return map;
}
function ensurePanel(){
 const learning=document.querySelector('[data-page-section="learning"]');if(!learning)return null;
 let panel=document.getElementById('lhSmasSummaryPanel');if(panel){renderStatus();return panel;}
 panel=document.createElement('section');panel.id='lhSmasSummaryPanel';
 panel.style.cssText='margin:0 0 24px;padding:18px;border:1px solid #dbe3ef;border-radius:16px;background:#fff;box-shadow:0 2px 8px rgba(15,23,42,.04)';
 panel.innerHTML=`<div style="display:flex;justify-content:space-between;gap:16px;align-items:flex-start;flex-wrap:wrap"><div><span style="font-size:12px;font-weight:700;color:#2563eb">DỮ LIỆU ĐỊNH KỲ</span><h2 style="margin:4px 0 6px">📥 Bảng tổng hợp SMAS</h2><p style="margin:0;color:#64748b">Mỗi nút tương ứng đúng một giai đoạn. Tải lại một giai đoạn chỉ thay thế dữ liệu của giai đoạn đó.</p></div><button type="button" class="button secondary" id="lhSmasClearBtn"><i class="fa-solid fa-trash"></i> Xóa toàn bộ dữ liệu SMAS</button></div><div id="lhSmasStatus" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:12px;margin-top:16px"></div><div id="lhSmasSummary" style="margin-top:14px"></div><div style="margin-top:12px;padding:10px 12px;border-radius:10px;background:#f8fafc;color:#475569;font-size:13px">🔐 <strong>Nguồn xét HS xuất sắc:</strong> dữ liệu SMAS được giữ nguyên theo từng đợt GHK1 → CHK1 → GHK2 → CHK2 để đối chiếu xuyên suốt năm học.</div>`;
 const header=learning.querySelector('.page-header');if(header&&header.nextSibling)learning.insertBefore(panel,header.nextSibling);else learning.prepend(panel);
 bindPanel(panel);renderStatus();return panel;
}
function bindPanel(panel){
 panel.querySelector('#lhSmasClearBtn').addEventListener('click',()=>{if(!loadStore().length){toast('Chưa có dữ liệu SMAS để xóa.','warning');return}if(!confirm('Xóa toàn bộ 4 giai đoạn SMAS đã tải lên? Dữ liệu Google Sheets không bị ảnh hưởng.'))return;saveStore([]);renderStatus();toast('Đã xóa dữ liệu SMAS khỏi website.','success');});
}
function makeCard(period,record){
 const r=record;const inputId='lhSmasFile_'+period;
 return `<div style="padding:14px;border:1px solid ${r?'#bbf7d0':'#e2e8f0'};border-radius:14px;background:${r?'#f0fdf4':'#f8fafc'}"><div style="display:flex;justify-content:space-between;gap:8px;align-items:center"><strong>${LABELS[period]}</strong><span style="font-size:12px;color:${r?'#15803d':'#64748b'}">${r?'✅ Đã tải':'⏳ Chưa có dữ liệu'}</span></div><div style="margin:9px 0;font-size:12px;color:#64748b">${r?esc(r.fileName)+' · '+r.totalRows+' dòng':'Chưa có bảng SMAS cho giai đoạn này.'}</div><div style="display:flex;gap:8px;flex-wrap:wrap"><input id="${inputId}" data-smas-period="${period}" type="file" accept=".xlsx,.xls,.csv" hidden><button type="button" class="button primary" data-smas-upload="${period}"><i class="fa-solid fa-cloud-arrow-up"></i> Tải ${period}</button>${r?`<button type="button" class="button secondary" data-smas-delete="${period}"><i class="fa-solid fa-trash"></i> Xóa kỳ</button>`:''}</div></div>`;
}
function renderStatus(){
 const p=document.getElementById('lhSmasSummaryPanel');if(!p)return;
 const data=loadStore();
 const status=p.querySelector('#lhSmasStatus');
 status.innerHTML=PERIODS.map(period=>makeCard(period,data.find(x=>x.period===period))).join('');
 status.querySelectorAll('[data-smas-upload]').forEach(btn=>{btn.addEventListener('click',()=>status.querySelector('#lhSmasFile_'+btn.dataset.smasUpload).click());});
 status.querySelectorAll('[data-smas-period]').forEach(input=>{input.addEventListener('change',async()=>{const file=input.files&&input.files[0];if(file)await importOne(file,input.dataset.smasPeriod);input.value='';});});
 status.querySelectorAll('[data-smas-delete]').forEach(btn=>{btn.addEventListener('click',()=>{const p2=btn.dataset.smasDelete;if(!confirm('Xóa riêng dữ liệu '+LABELS[p2]+'? Các giai đoạn khác không bị ảnh hưởng.'))return;saveStore(loadStore().filter(x=>x.period!==p2));renderStatus();toast('Đã xóa dữ liệu '+LABELS[p2]+'.','success');});});
 const total=data.reduce((n,r)=>n+(Number(r.totalRows)||0),0);const students=buildEvidence().length;
 p.querySelector('#lhSmasSummary').innerHTML=`<div style="display:flex;gap:14px;flex-wrap:wrap;color:#334155"><span><strong>${data.length}/4</strong> giai đoạn đã tải</span><span><strong>${total}</strong> dòng dữ liệu</span><span><strong>${students}</strong> học sinh có dữ liệu định kỳ</span></div>`;
}
async function loadXLSX(){
 if(typeof XLSX!=='undefined')return true;if(typeof window.loadSheetJS==='function')return await window.loadSheetJS();
 return await new Promise(resolve=>{const old=document.querySelector('script[data-lh-smas-xlsx]');if(old){old.addEventListener('load',()=>resolve(true),{once:true});old.addEventListener('error',()=>resolve(false),{once:true});return}const s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';s.async=false;s.dataset.lhSmasXlsx='1';s.onload=()=>resolve(true);s.onerror=()=>resolve(false);document.head.appendChild(s);});
}
async function importOne(file,period){
 const ok=await loadXLSX();if(!ok){toast('Không tải được thư viện đọc Excel/CSV.','error');return;}
 try{
  const named=detectPeriod(file.name);if(named&&named!==period){toast('File này có dấu hiệu thuộc '+LABELS[named]+', không phải '+LABELS[period]+'. Đã hủy để tránh nhập nhầm kỳ.','error');return;}
  const wb=XLSX.read(await file.arrayBuffer(),{type:'array',cellDates:true});
  const selected=chooseSheets(wb,period);const sheets=[];let totalRows=0;
  for(const name of selected){const parsed=parseSheet(wb.Sheets[name]);if(!parsed||!parsed.rows.length)continue;sheets.push({name,headers:parsed.headers,rows:parsed.rows,headerRow:parsed.headerRow,nameIndex:parsed.nameIndex});totalRows+=parsed.rows.length;}
  if(!sheets.length){toast('Không tìm thấy bảng dữ liệu học sinh hợp lệ trong file.','error');return;}
  const names=Object.keys(buildStudentIndex(sheets)).length;
  const record={version:2,period,periodLabel:LABELS[period],fileName:file.name,importedAt:new Date().toISOString(),sheetNames:selected,sheets,totalRows,studentCount:names};
  const store=loadStore();const i=store.findIndex(x=>x.period===period);if(i>=0)store[i]=record;else store.push(record);store.sort((a,b)=>PERIODS.indexOf(a.period)-PERIODS.indexOf(b.period));saveStore(store);renderStatus();toast('Đã lưu '+LABELS[period]+' riêng biệt: '+names+' học sinh, '+totalRows+' dòng.','success');
 }catch(err){console.error('[SMAS IMPORT 2.0]',err);toast('Không thể đọc '+file.name+': '+(err.message||'file không hợp lệ'),'error');}
}
function buildEvidence(){
 const map=new Map();
 for(const r of loadStore())for(const sh of r.sheets||[]){const idx=Number.isInteger(sh.nameIndex)?sh.nameIndex:(sh.headers||[]).findIndex(h=>/họ\s*và\s*tên|họ\s*tên|ho.?ten|student.?name/i.test(text(h)));if(idx<0)continue;for(const row of sh.rows||[]){const name=text(row[idx]);if(!name)continue;const key=norm(name);if(!map.has(key))map.set(key,{name,periods:[],records:[]});const x=map.get(key);if(!x.periods.includes(r.period))x.periods.push(r.period);x.records.push({period:r.period,file:r.fileName,sheet:sh.name,row});}}
 return [...map.values()].sort((a,b)=>a.name.localeCompare(b.name,'vi'));
}
window.getSMASSummaryData=loadStore;window.getExcellentStudentEvidence=buildEvidence;window.getSMASPeriods=()=>PERIODS.slice();
function mergeCommentsIntoLearning(){
 const learning=document.querySelector('[data-page-section="learning"]'),comments=document.querySelector('[data-page-section="comments"]');if(!learning||!comments||document.getElementById('lhMergedComments'))return;const wrap=document.createElement('section');wrap.id='lhMergedComments';wrap.style.cssText='margin-top:24px;padding-top:24px;border-top:1px solid #e2e8f0';while(comments.firstChild)wrap.appendChild(comments.firstChild);learning.appendChild(wrap);comments.hidden=true;comments.style.display='none';comments.dataset.mergedInto='learning';const menu=document.querySelector('.menu-item[data-page="comments"]');if(menu)menu.style.display='none';
}
function refreshComments(){if(document.querySelector('[data-page-section="learning"].active')&&typeof window.renderComments==='function'){try{window.renderComments()}catch(e){console.warn('[SMAS] renderComments',e)}}}
function toast(message,type){if(typeof window.showToast==='function')window.showToast(message,type);else console.info(message)}
function init(){mergeCommentsIntoLearning();ensurePanel();refreshComments();window.addEventListener('google-sheets-data-ready',()=>{mergeCommentsIntoLearning();ensurePanel();refreshComments()});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();setTimeout(init,500);setTimeout(init,1500);
})();