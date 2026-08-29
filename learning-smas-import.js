/*
 * LEARNING SMAS IMPORT 2.1 - STRICT / 5A3 SAFE
 *
 * Quy tắc dữ liệu:
 * 1) File mẫu chỉ dùng để tham chiếu cấu trúc, tuyệt đối không làm dữ liệu mặc định.
 * 2) Mỗi giai đoạn GHK1/CHK1/GHK2/CHK2 có vùng lưu riêng.
 * 3) Không tìm thấy sheet đúng giai đoạn => TỪ CHỐI, không fallback sang sheet đầu tiên.
 * 4) Không tự suy diễn tên học sinh gần giống nhau.
 * 5) Nếu file có thông tin lớp rõ ràng và khác 5A3 => TỪ CHỐI.
 * 6) File mẫu 2025-2026 lớp 5A (hoặc tên trường cũ) => TỪ CHỐI như file mẫu tham chiếu.
 * 7) Dữ liệu thực tế của từng kỳ thay đổi thế nào cũng được giữ nguyên theo file tải lên.
 */
(function(){
'use strict';
if(window.__LEARNING_SMAS_IMPORT_21__) return;
window.__LEARNING_SMAS_IMPORT_21__=true;

const STORE='QL_LE_HOANG_SMAS_SUMMARY_2026_2027';
const CURRENT_CLASS='5A3';
const CURRENT_YEAR='2026-2027';
const PERIODS=['GHK1','CHK1','GHK2','CHK2'];
const LABELS={GHK1:'Giữa học kỳ 1',CHK1:'Cuối học kỳ 1',GHK2:'Giữa học kỳ 2',CHK2:'Cuối học kỳ 2'};
const SHEET_ALIASES={
 GHK1:['GHK1','GK1','GIUA HOC KY 1','GIUA HK1'],
 CHK1:['CHK1','CK1','CUOI HOC KY 1','CUOI HK1'],
 GHK2:['GHK2','GK2','GIUA HOC KY 2','GIUA HK2'],
 CHK2:['CHK2','CN','CUOI NAM','CHK2','CUOI HOC KY 2','CUOI HK2']
};
const esc=v=>String(v??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const text=v=>String(v??'').trim();
const norm=v=>text(v).replace(/\s+/g,' ').toLocaleLowerCase('vi');
function loadStore(){try{const x=JSON.parse(localStorage.getItem(STORE)||'[]');return Array.isArray(x)?x:[]}catch(e){return[]}}
function saveStore(x){localStorage.setItem(STORE,JSON.stringify(x));}
function normalizeCode(v){return text(v).toUpperCase().replace(/[–—]/g,'-');}
function detectPeriod(s){
 const u=normalizeCode(s);
 for(const p of PERIODS)if(u.includes(p))return p;
 for(const p of PERIODS)for(const a of SHEET_ALIASES[p])if(u.includes(normalizeCode(a)))return p;
 return '';
}
function aliasesFor(period){return (SHEET_ALIASES[period]||[]).map(norm)}
function findRelevantSheets(wb,period){
 const aliases=aliasesFor(period);
 const exact=wb.SheetNames.filter(n=>aliases.includes(norm(n)));
 if(exact.length)return exact;
 const partial=wb.SheetNames.filter(n=>aliases.some(a=>norm(n).includes(a)||a.includes(norm(n))));
 return partial;
}
function detectHeaderInfo(rows){
 const max=Math.min(rows.length,15);let hi=-1;
 for(let i=0;i<max;i++){
  const line=(rows[i]||[]).map(text).join(' | ');
  if(/họ\s*và\s*tên|họ\s*tên/i.test(line)){hi=i;break;}
 }
 if(hi<0)return null;
 const headers=(rows[hi]||[]).map(text);
 const nameIndex=headers.findIndex(h=>/họ\s*và\s*tên|họ\s*tên|ho.?ten|student.?name/i.test(h));
 return {headerRow:hi+1,headers,nameIndex};
}
function parseSheet(ws){
 const rows=XLSX.utils.sheet_to_json(ws,{header:1,defval:'',raw:false});
 if(!rows.length)return null;
 const info=detectHeaderInfo(rows);if(!info||info.nameIndex<0)return null;
 const data=rows.slice(info.headerRow).filter(r=>r.some(v=>text(v)!==''));
 return {...info,rows:data};
}
function collectSheetText(wb){
 let s=wb.SheetNames.join(' ');
 for(const n of wb.SheetNames){
  const rows=XLSX.utils.sheet_to_json(wb.Sheets[n],{header:1,defval:'',raw:false}).slice(0,6);
  s+=' '+rows.map(r=>r.join(' ')).join(' ');
 }
 return text(s);
}
function detectClass(textBlob){
 const s=normalizeCode(textBlob);
 const m=s.match(/(?:LỚP|LOP)\s*[:\-]?\s*([0-9]{1,2}[A-Z][0-9]?)/i);
 return m?m[1].toUpperCase():'';
}
function detectYear(textBlob){
 const s=normalizeCode(textBlob);
 const m=s.match(/(20\d{2})\s*[-/]\s*(20\d{2})/);
 return m?`${m[1]}-${m[2]}`:'';
}
function isKnownTemplate(textBlob,fileName){
 const s=(norm(textBlob)+' '+norm(fileName)).replace(/[–—]/g,'-');
 return /2025\s*[-/]\s*2026/.test(s) && /lớp\s*[:\-]?\s*5a(?!3)/i.test(textBlob+fileName) || /trường\s+tiểu\s+học\s+thị\s+trấn\s+chợ\s+chùa/i.test(textBlob) && /2025\s*[-/]\s*2026/.test(s);
}
function ensurePanel(){
 const learning=document.querySelector('[data-page-section="learning"]');if(!learning)return null;
 let panel=document.getElementById('lhSmasSummaryPanel');if(panel){renderStatus();return panel;}
 panel=document.createElement('section');panel.id='lhSmasSummaryPanel';
 panel.style.cssText='margin:0 0 24px;padding:18px;border:1px solid #dbe3ef;border-radius:16px;background:#fff;box-shadow:0 2px 8px rgba(15,23,42,.04)';
 panel.innerHTML=`<div style="display:flex;justify-content:space-between;gap:16px;align-items:flex-start;flex-wrap:wrap"><div><span style="font-size:12px;font-weight:700;color:#2563eb">DỮ LIỆU ĐỊNH KỲ</span><h2 style="margin:4px 0 6px">📥 Bảng tổng hợp SMAS</h2><p style="margin:0;color:#64748b">Tải <strong>từng giai đoạn riêng biệt</strong>. File mẫu chỉ tham chiếu cấu trúc; dữ liệu nhập là dữ liệu thực tế của lớp 5A3.</p></div><button type="button" class="button secondary" id="lhSmasClearBtn"><i class="fa-solid fa-trash"></i> Xóa toàn bộ dữ liệu SMAS</button></div><div id="lhSmasStatus" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;margin-top:16px"></div><div id="lhSmasSummary" style="margin-top:14px"></div><div style="margin-top:12px;padding:10px 12px;border-radius:10px;background:#f8fafc;color:#475569;font-size:13px">🔐 <strong>Nguyên tắc:</strong> GHK1 → CHK1 → GHK2 → CHK2 lưu độc lập; không tự đoán kỳ, không tự ghép học sinh.</div>`;
 const header=learning.querySelector('.page-header');if(header&&header.nextSibling)learning.insertBefore(panel,header.nextSibling);else learning.prepend(panel);
 panel.querySelector('#lhSmasClearBtn').addEventListener('click',()=>{if(!loadStore().length){toast('Chưa có dữ liệu SMAS để xóa.','warning');return}if(!confirm('Xóa toàn bộ 4 giai đoạn SMAS đã tải lên? Dữ liệu Google Sheets không bị ảnh hưởng.'))return;saveStore([]);renderStatus();toast('Đã xóa dữ liệu SMAS khỏi website.','success');});
 renderStatus();return panel;
}
function makeCard(period,record){
 const r=record,id='lhSmasFile_'+period;
 return `<div style="padding:14px;border:1px solid ${r?'#bbf7d0':'#e2e8f0'};border-radius:14px;background:${r?'#f0fdf4':'#f8fafc'}"><div style="display:flex;justify-content:space-between;gap:8px;align-items:center"><strong>${LABELS[period]}</strong><span style="font-size:12px;color:${r?'#15803d':'#64748b'}">${r?'✅ Đã tải':'⏳ Chưa có dữ liệu'}</span></div><div style="margin:9px 0;font-size:12px;color:#64748b">${r?esc(r.fileName)+' · '+r.studentCount+' HS · '+r.totalRows+' dòng':'Chưa có bảng thực tế cho giai đoạn này.'}</div><div style="display:flex;gap:8px;flex-wrap:wrap"><input id="${id}" data-smas-period="${period}" type="file" accept=".xlsx,.xls,.csv" hidden><button type="button" class="button primary" data-smas-upload="${period}"><i class="fa-solid fa-cloud-arrow-up"></i> Tải ${period}</button>${r?`<button type="button" class="button secondary" data-smas-delete="${period}"><i class="fa-solid fa-trash"></i> Xóa kỳ</button>`:''}</div></div>`;
}
function renderStatus(){
 const p=document.getElementById('lhSmasSummaryPanel');if(!p)return;const data=loadStore();const status=p.querySelector('#lhSmasStatus');
 status.innerHTML=PERIODS.map(period=>makeCard(period,data.find(x=>x.period===period))).join('');
 status.querySelectorAll('[data-smas-upload]').forEach(btn=>btn.addEventListener('click',()=>status.querySelector('#lhSmasFile_'+btn.dataset.smasUpload).click()));
 status.querySelectorAll('[data-smas-period]').forEach(input=>input.addEventListener('change',async()=>{const f=input.files&&input.files[0];if(f)await importOne(f,input.dataset.smasPeriod);input.value='';}));
 status.querySelectorAll('[data-smas-delete]').forEach(btn=>btn.addEventListener('click',()=>{const p2=btn.dataset.smasDelete;if(!confirm('Xóa riêng dữ liệu '+LABELS[p2]+'? Các giai đoạn khác không bị ảnh hưởng.'))return;saveStore(loadStore().filter(x=>x.period!==p2));renderStatus();toast('Đã xóa dữ liệu '+LABELS[p2]+'.','success');}));
 const total=data.reduce((n,r)=>n+(Number(r.totalRows)||0),0),students=buildEvidence().length;
 p.querySelector('#lhSmasSummary').innerHTML=`<div style="display:flex;gap:14px;flex-wrap:wrap;color:#334155"><span><strong>${data.length}/4</strong> giai đoạn đã tải</span><span><strong>${total}</strong> dòng dữ liệu</span><span><strong>${students}</strong> học sinh có dữ liệu định kỳ</span></div>`;
}
async function loadXLSX(){
 if(typeof XLSX!=='undefined')return true;if(typeof window.loadSheetJS==='function')return await window.loadSheetJS();
 return await new Promise(resolve=>{const old=document.querySelector('script[data-lh-smas-xlsx]');if(old){old.addEventListener('load',()=>resolve(true),{once:true});old.addEventListener('error',()=>resolve(false),{once:true});return}const s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';s.async=false;s.dataset.lhSmasXlsx='1';s.onload=()=>resolve(true);s.onerror=()=>resolve(false);document.head.appendChild(s);});
}
function validateStudentSet(sheets){
 const names=[];for(const sh of sheets){for(const row of sh.rows||[]){const name=text(row[sh.nameIndex]);if(name)names.push(name);}}
 const unique=[...new Map(names.map(n=>[norm(n),n])).values()];
 if(!unique.length)return{valid:false,message:'Không tìm thấy tên học sinh trong bảng SMAS.'};
 const bad=unique.filter(n=>n.length<2);
 if(bad.length)return{valid:false,message:'Dữ liệu họ tên trong bảng SMAS không hợp lệ.'};
 return{valid:true,count:unique.length,names:unique};
}
function compareRoster(names){
 const roster=Array.isArray(window.students)?window.students:(Array.isArray(window.APP_DATA?.students)?window.APP_DATA.students:[]);
 if(!roster.length)return{available:false,missing:[],extra:[],matched:0};
 const map=new Map(roster.map(s=>[norm(s?.name),s?.name||'']));
 const smasSet=new Set(names.map(norm));
 const missing=roster.filter(s=>s&&s.status!=='inactive'&&!smasSet.has(norm(s.name))).map(s=>s.name);
 const extra=names.filter(n=>!map.has(norm(n)));
 const matched=names.filter(n=>map.has(norm(n))).length;
 return{available:true,missing,extra,matched,rosterCount:roster.length};
}
async function importOne(file,period){
 const ok=await loadXLSX();if(!ok){toast('Không tải được thư viện đọc Excel/CSV.','error');return;}
 try{
  const probe=file.name+' '+file.type;
  const array=await file.arrayBuffer();
  const wb=XLSX.read(array,{type:'array',cellDates:true});
  const blobText=collectSheetText(wb);
  const titleClass=detectClass(blobText);const titleYear=detectYear(blobText);
  if(isKnownTemplate(blobText,file.name)){toast('Đây là file mẫu tham chiếu 2025–2026, không phải dữ liệu lớp 5A3. Đã từ chối nhập.','warning');return;}
  if(titleClass&&titleClass!==CURRENT_CLASS){toast('File có thông tin lớp '+titleClass+', không phải lớp '+CURRENT_CLASS+'. Đã từ chối để tránh nhập nhầm.','error');return;}
  if(titleYear&&titleYear!==CURRENT_YEAR){toast('File có năm học '+titleYear+', trong khi hệ thống đang theo dõi '+CURRENT_YEAR+'. Đã từ chối để tránh nhập nhầm.','error');return;}
  const detected=detectPeriod(file.name+' '+blobText);
  if(detected&&detected!==period){toast('File có dấu hiệu thuộc '+LABELS[detected]+', không phải '+LABELS[period]+'. Đã hủy để tránh nhập nhầm kỳ.','error');return;}
  const selected=findRelevantSheets(wb,period);
  if(!selected.length){toast('Không tìm thấy sheet đúng cho '+LABELS[period]+'. Không tự chọn sheet khác.','error');return;}
  if(selected.length>1){toast('Có nhiều sheet cùng khớp '+LABELS[period]+'. Đã dừng để tránh gộp nhầm dữ liệu.','error');return;}
  const sheets=[];let totalRows=0;
  for(const name of selected){const parsed=parseSheet(wb.Sheets[name]);if(!parsed)continue;sheets.push({name,headers:parsed.headers,rows:parsed.rows,headerRow:parsed.headerRow,nameIndex:parsed.nameIndex});totalRows+=parsed.rows.length;}
  if(!sheets.length){toast('Sheet được chọn không có cấu trúc học sinh hợp lệ.','error');return;}
  const set=validateStudentSet(sheets);if(!set.valid){toast(set.message,'error');return;}
  const roster=compareRoster(set.names);
  if(roster.available&&(roster.extra.length||roster.missing.length)){
   const parts=[];
   if(roster.extra.length)parts.push('Trong SMAS nhưng không có trong 5A3: '+roster.extra.slice(0,8).join(', ')+(roster.extra.length>8?' …':''));
   if(roster.missing.length)parts.push('Có trong 5A3 nhưng thiếu trong SMAS: '+roster.missing.slice(0,8).join(', ')+(roster.missing.length>8?' …':''));
   toast('Dữ liệu đã được đọc nhưng chưa lưu vì danh sách chưa khớp. '+parts.join(' | '),'warning');return;
  }
  const record={version:21,sourceType:'REAL_SMAS',period,periodLabel:LABELS[period],fileName:file.name,importedAt:new Date().toISOString(),schoolYear:CURRENT_YEAR,className:CURRENT_CLASS,sheetNames:selected,sheets,totalRows,studentCount:set.count,matchedStudents:roster.available?roster.matched:null};
  const store=loadStore();const i=store.findIndex(x=>x.period===period);if(i>=0)store[i]=record;else store.push(record);store.sort((a,b)=>PERIODS.indexOf(a.period)-PERIODS.indexOf(b.period));saveStore(store);renderStatus();toast('Đã lưu '+LABELS[period]+' riêng biệt: '+set.count+' học sinh, '+totalRows+' dòng dữ liệu.','success');
 }catch(err){console.error('[SMAS IMPORT 2.1]',err);toast('Không thể đọc '+file.name+': '+(err.message||'file không hợp lệ'),'error');}
}
function buildEvidence(){
 const map=new Map();for(const r of loadStore())for(const sh of r.sheets||[]){const idx=Number.isInteger(sh.nameIndex)?sh.nameIndex:(sh.headers||[]).findIndex(h=>/họ\s*và\s*tên|họ\s*tên|ho.?ten|student.?name/i.test(text(h)));if(idx<0)continue;for(const row of sh.rows||[]){const name=text(row[idx]);if(!name)continue;const key=norm(name);if(!map.has(key))map.set(key,{name,periods:[],records:[]});const x=map.get(key);if(!x.periods.includes(r.period))x.periods.push(r.period);x.records.push({period:r.period,file:r.fileName,sheet:sh.name,row});}}return[...map.values()].sort((a,b)=>a.name.localeCompare(b.name,'vi'));
}
window.getSMASSummaryData=loadStore;
window.getExcellentStudentEvidence=buildEvidence;
window.getSMASPeriods=()=>PERIODS.slice();
window.getSMASClass=()=>CURRENT_CLASS;
window.getSMASYear=()=>CURRENT_YEAR;
function mergeCommentsIntoLearning(){
 const learning=document.querySelector('[data-page-section="learning"]'),comments=document.querySelector('[data-page-section="comments"]');if(!learning||!comments||document.getElementById('lhMergedComments'))return;const wrap=document.createElement('section');wrap.id='lhMergedComments';wrap.style.cssText='margin-top:24px;padding-top:24px;border-top:1px solid #e2e8f0';while(comments.firstChild)wrap.appendChild(comments.firstChild);learning.appendChild(wrap);comments.hidden=true;comments.style.display='none';comments.dataset.mergedInto='learning';const menu=document.querySelector('.menu-item[data-page="comments"]');if(menu)menu.style.display='none';
}
function toast(message,type){if(typeof window.showToast==='function')window.showToast(message,type);else console.info(message)}
function init(){mergeCommentsIntoLearning();ensurePanel();window.addEventListener('google-sheets-data-ready',()=>{mergeCommentsIntoLearning();ensurePanel()});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();setTimeout(init,500);setTimeout(init,1500);
})();