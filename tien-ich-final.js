/* TIỆN ÍCH LỚP HỌC — FINAL 4 TỔ
 * Chỉ có 2 công cụ độc lập:
 * 1) Tải lên danh sách trình độ HS: TT | Họ tên HS | Xếp loại
 * 2) Tạo sơ đồ lớp: 2 HS/bàn, 4 tổ/dãy.
 * Dữ liệu tải lên chỉ dùng trong module Tiện ích để xếp chỗ/xếp tổ.
 * KHÔNG ghi dữ liệu vào Google Sheets và KHÔNG sửa dữ liệu gốc.
 */
(function(){'use strict';
const APP='lhUtilitiesFinal';
const COLS=4;
const BUILD='2026-08-25-4TỔ-v3-UPLOAD';
let uploadedStudents=[];

const esc=v=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const clean=v=>String(v??'').trim().replace(/\s+/g,' ');
const norm=v=>clean(v).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d');

function students(){
  // Tệp tải lên được ưu tiên tuyệt đối và chỉ tồn tại trong module này.
  if(uploadedStudents.length)return uploadedStudents.slice();
  const candidates=['students','allStudents','hocSinh','HOC_SINH'];
  for(const k of candidates){
    if(Array.isArray(window[k])){
      const a=window[k].filter(s=>s&&s.id&&s.name);
      if(a.length)return a;
    }
  }
  try{
    if(typeof window.getStudentsSafe==='function'){
      const a=window.getStudentsSafe();
      if(Array.isArray(a))return a.filter(s=>s&&s.id&&s.name);
    }
  }catch(e){}
  return [];
}

function records(){
  const keys=['learningRecords','hocTapRecords','hocTapData','learningData','HOC_TAP'];
  for(const k of keys)if(Array.isArray(window[k]))return window[k];
  return [];
}

function level(s){
  const keys=['xepLoai','xepLoaiHocTap','academicLevel','learningLevel','classification','hocLuc','trinhDo','trinhDoHocTap','mucDo','level','result'];
  for(const k of keys){const v=clean(s[k]);if(v)return v;}
  const a=records().filter(r=>String(r.studentId||r.hocSinhId||'')===String(s.id));
  for(let i=a.length-1;i>=0;i--){for(const k of keys){const v=clean(a[i][k]);if(v)return v;}}
  return 'Chưa xác định';
}

function shuffle(a){
  for(let i=a.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [a[i],a[j]]=[a[j],a[i]];
  }
  return a;
}

function levelRank(v){
  const s=norm(v);
  if(/gioi|tot|xuat sac|hoan thanh tot|muc 3|m3/.test(s))return 3;
  if(/kha|muc 2|m2/.test(s))return 2;
  if(/trung binh|dat|muc 1|m1/.test(s))return 1;
  if(/chua dat|yeu/.test(s))return 0;
  return 1;
}

function balancedPairs(a){
  const work=shuffle(a.slice());
  const pairs=[];
  while(work.length){
    const first=work.shift();
    const r=levelRank(level(first));
    let best=-1,bestScore=Infinity;
    for(let i=0;i<work.length;i++){
      const d=Math.abs(r-levelRank(level(work[i])));
      if(d<bestScore){
        best=i;
        bestScore=d;
        if(d===1)break;
      }
    }
    if(best<0)pairs.push([first,null]);
    else pairs.push([first,work.splice(best,1)[0]]);
  }
  return pairs;
}

function splitLine(line){
  // Ưu tiên TSV, sau đó CSV/pipe/semicolon.
  if(line.includes('\t'))return line.split('\t');
  if(line.includes('|'))return line.split('|');
  if(line.includes(';'))return line.split(';');
  const out=[];let cur='',quoted=false;
  for(let i=0;i<line.length;i++){
    const ch=line[i];
    if(ch==='"'){
      if(quoted&&line[i+1]==='"'){cur+='"';i++;}
      else quoted=!quoted;
    }else if(ch===','&&!quoted){out.push(cur);cur='';}
    else cur+=ch;
  }
  out.push(cur);
  return out;
}

function parseUploadedText(text){
  const raw=String(text||'').replace(/^\uFEFF/,'').replace(/\r/g,'').split('\n').map(clean).filter(Boolean);
  if(!raw.length)throw new Error('Tệp không có dữ liệu.');

  const rows=raw.map(splitLine).map(r=>r.map(clean));
  const header=rows[0].map(norm);
  const findCol=(names,def)=>{
    const i=header.findIndex(h=>names.some(n=>h===n||h.includes(n)));
    return i>=0?i:def;
  };
  const nameIdx=findCol(['ho ten hs','ho ten','hoc sinh','ho va ten','name'],1);
  const levelIdx=findCol(['xep loai','xep loai thuc te','trinh do','muc do','hoc luc','level','classification'],2);
  const start=header.some(h=>/ho ten|hoc sinh|name/.test(h))?1:0;
  const data=[];
  for(let i=start;i<rows.length;i++){
    const r=rows[i];
    const name=clean(r[nameIdx]||'');
    if(!name)continue;
    data.push({
      id:`UPLOAD-${String(i+1).padStart(3,'0')}`,
      studentCode:`UPLOAD-${String(i+1).padStart(3,'0')}`,
      name,
      xepLoai:clean(r[levelIdx]||'Chưa xác định')||'Chưa xác định',
      source:'utilities-upload'
    });
  }
  if(!data.length)throw new Error('Không tìm thấy cột Họ tên HS hoặc dữ liệu học sinh hợp lệ.');
  return data;
}

function updateUploadStatus(extra=''){
  const status=document.getElementById('lhUploadStatus');
  if(!status)return;
  if(uploadedStudents.length){
    status.innerHTML=`Đã tải lên <b>${uploadedStudents.length}</b> học sinh · Chỉ dùng cho xếp tổ/xếp sơ đồ${extra?` · ${esc(extra)}`:''}`;
    status.classList.add('ready');
  }else{
    status.textContent='Chưa tải tệp. Hệ thống sẽ dùng danh sách học sinh hiện có để xếp sơ đồ.';
    status.classList.remove('ready');
  }
}

function uploadLevels(){
  let input=document.getElementById('lhLevelUploadInput');
  if(!input){
    input=document.createElement('input');
    input.type='file';
    input.id='lhLevelUploadInput';
    input.accept='.csv,.tsv,.txt,text/csv,text/tab-separated-values';
    input.style.display='none';
    document.body.appendChild(input);
    input.addEventListener('change',async()=>{
      const file=input.files&&input.files[0];
      input.value='';
      if(!file)return;
      try{
        const text=await file.text();
        const parsed=parseUploadedText(text);
        uploadedStudents=parsed;
        updateUploadStatus(file.name);
        const root=document.getElementById('lhUtilityWorkspace');
        if(root){
          root.innerHTML=`<div class="lh-upload-preview"><div class="lh-preview-head"><b>Danh sách dùng để xếp lớp</b><span>${parsed.length} học sinh</span></div><div class="lh-preview-table"><table><thead><tr><th>TT</th><th>Họ tên HS</th><th>Xếp loại</th></tr></thead><tbody>${parsed.slice(0,12).map((s,i)=>`<tr><td>${i+1}</td><td>${esc(s.name)}</td><td>${esc(level(s))}</td></tr>`).join('')}</tbody></table>${parsed.length>12?`<div class="lh-preview-more">… và ${parsed.length-12} học sinh khác</div>`:''}</div><div class="lh-preview-actions"><button class="button primary" id="lhCreateFromUpload" type="button"><i class="fa-solid fa-diagram-project"></i> Tạo sơ đồ lớp học</button></div></div>`;
          const create=document.getElementById('lhCreateFromUpload');
          if(create)create.onclick=buildLayout;
        }
      }catch(err){
        alert('Không thể tải danh sách: '+(err&&err.message?err.message:'Tệp không hợp lệ.'));
      }
    });
  }
  input.click();
}

function buildLayout(){
  const ss=students();
  if(!ss.length){alert('Chưa có dữ liệu học sinh. Hãy tải lên danh sách trình độ HS hoặc đồng bộ danh sách học sinh.');return;}
  const pairs=balancedPairs(ss);
  const cols=COLS;
  const counts=Array.from({length:cols},()=>0);
  pairs.forEach((_,i)=>counts[i%cols]++);
  const colsData=Array.from({length:cols},()=>[]);
  pairs.forEach((p,i)=>colsData[i%cols].push(p));
  const html=`<div class="lh-layout-toolbar"><span><b>${ss.length}</b> học sinh · <b>${pairs.length}</b> bàn · <b>4</b> tổ · <b>2 HS/bàn</b></span><button class="button secondary" id="lhShuffle" type="button"><i class="fa-solid fa-shuffle"></i> Xếp lại ngẫu nhiên</button></div><div class="lh-classroom lh-four-columns">${colsData.map((col,c)=>`<div class="lh-column"><div class="lh-group-title">Tổ ${c+1} <small>(${col.length} bàn)</small></div>${col.map((p,i)=>`<div class="lh-desk"><span class="lh-row">${i+1}</span><div class="lh-seat">${p[0]?`<b>${esc(p[0].name)}</b><small>${esc(level(p[0]))}</small>`:'—'}</div><div class="lh-seat">${p[1]?`<b>${esc(p[1].name)}</b><small>${esc(level(p[1]))}</small>`:'—'}</div></div>`).join('')}</div>`).join('')}</div><p class="lh-note">Tiện ích chỉ tạo bố cục để giáo viên xếp chỗ và xếp tổ. Không ghi, không sửa, không xóa dữ liệu quản lý học sinh ở các menu khác.</p>`;
  const root=document.getElementById('lhUtilityWorkspace');
  if(root)root.innerHTML=html;
  const b=document.getElementById('lhShuffle');
  if(b)b.onclick=buildLayout;
}

function install(){
  if(document.getElementById(APP))return;
  const nav=document.querySelector('.main-menu');
  if(!nav)return;
  nav.querySelectorAll('[data-page="utilities"]').forEach(x=>x.remove());
  const oldDivider=nav.querySelector('.lh-utilities-divider');
  if(oldDivider)oldDivider.remove();
  const divider=document.createElement('div');
  divider.className='menu-divider lh-utilities-divider';
  const btn=document.createElement('button');
  btn.type='button';
  btn.id=APP;
  btn.className='menu-item';
  btn.innerHTML='<i class="fa-solid fa-toolbox"></i><span>Tiện ích</span>';
  const settings=nav.querySelector('[data-page="settings"]');
  if(settings){nav.insertBefore(divider,settings);nav.insertBefore(btn,settings);}else{nav.appendChild(divider);nav.appendChild(btn);}
  btn.onclick=()=>openPage();
}

function openPage(){
  document.querySelectorAll('.page-section').forEach(s=>s.classList.remove('active'));
  let sec=document.getElementById('page-utilities-final');
  if(!sec){
    sec=document.createElement('section');
    sec.id='page-utilities-final';
    sec.className='page-section active';
    sec.innerHTML='<div class="page-header"><div><span class="page-eyebrow"><i class="fa-solid fa-toolbox"></i> Công cụ giáo viên</span><h1>Tiện ích</h1><p>Chỉ dùng để tải danh sách trình độ và xếp sơ đồ lớp/xếp tổ; hoàn toàn độc lập với dữ liệu quản lý chính.</p></div></div><div class="quick-actions utilities-actions"><button class="quick-action" id="lhLevelUpload" type="button"><span class="quick-action-icon">📤</span><span><strong>Tải lên</strong><small>Tệp trình độ HS · TT · Họ tên HS · Xếp loại</small></span></button><button class="quick-action" id="lhClassroom" type="button"><span class="quick-action-icon">📐</span><span><strong>Tạo sơ đồ lớp học</strong><small>4 tổ · 2 HS/bàn · phân bố trình độ</small></span></button></div><div id="lhUploadStatus" class="lh-upload-status">Chưa tải tệp. Hệ thống sẽ dùng danh sách học sinh hiện có để xếp sơ đồ.</div><div id="lhUtilityWorkspace"></div>';
    document.getElementById('mainContent').appendChild(sec);
  }
  sec.classList.add('active');
  const title=document.getElementById('pageTitle');
  if(title)title.textContent='Tiện ích';
  const up=document.getElementById('lhLevelUpload');
  if(up)up.onclick=uploadLevels;
  const cr=document.getElementById('lhClassroom');
  if(cr)cr.onclick=buildLayout;
  updateUploadStatus();
}

function css(){
  if(document.getElementById('lhUtilityStyle'))return;
  const s=document.createElement('style');
  s.id='lhUtilityStyle';
  s.textContent='.utilities-actions{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.lh-upload-status{margin:14px 0;padding:10px 14px;border:1px dashed #cbd5e1;border-radius:10px;color:#64748b;background:#f8fafc;font-size:13px}.lh-upload-status.ready{border-color:#86efac;background:#f0fdf4;color:#166534}.lh-layout-toolbar{display:flex;justify-content:space-between;align-items:center;gap:12px;margin:18px 0}.lh-classroom{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}.lh-column{background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;padding:10px}.lh-group-title{font-weight:700;text-align:center;margin-bottom:10px}.lh-group-title small{font-weight:500;color:#64748b}.lh-desk{display:grid;grid-template-columns:24px 1fr 1fr;gap:5px;margin:6px 0}.lh-row{display:flex;align-items:center;justify-content:center;font-size:12px;color:#64748b}.lh-seat{background:white;border:1px solid #cbd5e1;border-radius:8px;padding:7px;min-height:42px}.lh-seat b{display:block;font-size:12px}.lh-seat small{display:block;color:#64748b;margin-top:3px;font-size:11px}.lh-note{color:#64748b;margin-top:12px}.lh-upload-preview{margin-top:18px;border:1px solid #e2e8f0;border-radius:14px;background:#fff;padding:14px}.lh-preview-head{display:flex;justify-content:space-between;gap:12px;margin-bottom:10px}.lh-preview-head span{color:#64748b;font-size:13px}.lh-preview-table{overflow:auto}.lh-preview-table table{width:100%;border-collapse:collapse;font-size:13px}.lh-preview-table th,.lh-preview-table td{border-bottom:1px solid #e2e8f0;padding:8px;text-align:left}.lh-preview-table th{background:#f8fafc}.lh-preview-more{padding-top:8px;color:#64748b;font-size:12px}.lh-preview-actions{margin-top:12px}@media(max-width:900px){.utilities-actions{grid-template-columns:1fr 1fr}.lh-classroom{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:560px){.utilities-actions{grid-template-columns:1fr}.lh-classroom{grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.lh-column{padding:7px}.lh-desk{grid-template-columns:18px 1fr 1fr;gap:3px}.lh-seat{padding:5px;min-height:38px}.lh-seat b{font-size:10px}.lh-seat small{font-size:9px}.lh-layout-toolbar{align-items:flex-start;flex-direction:column}.lh-preview-head{align-items:flex-start;flex-direction:column}}';
  document.head.appendChild(s);
}

function start(){css();install();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();