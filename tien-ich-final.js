/* TIỆN ÍCH LỚP HỌC — FINAL 4 TỔ
 * Chỉ có 2 công cụ:
 * 1) Tải danh sách trình độ HS: TT | Họ tên HS | Xếp loại
 * 2) Tạo sơ đồ lớp: 2 HS/bàn, 4 dãy/tổ.
 * 42 HS => 21 bàn => Tổ 1: 6 bàn, Tổ 2-4: 5 bàn.
 * Không ghi dữ liệu vào Google Sheets.
 */
(function(){'use strict';
const APP='lhUtilitiesFinal';
const COLS=4;
const BUILD='2026-08-23-4TỔ-v2';
const esc=v=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const clean=v=>String(v??'').trim().replace(/\s+/g,' ');
function students(){
  const candidates=['students','allStudents','hocSinh','HOC_SINH'];
  for(const k of candidates){if(Array.isArray(window[k])){const a=window[k].filter(s=>s&&s.id&&s.name);if(a.length)return a;}}
  try{if(typeof window.getStudentsSafe==='function'){const a=window.getStudentsSafe();if(Array.isArray(a))return a.filter(s=>s&&s.id&&s.name);}}catch(e){}
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
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function levelRank(v){const s=clean(v).toLowerCase();if(/giỏi|tot|tốt|xuất sắc|hoàn thành tốt|mức 3|m3/.test(s))return 3;if(/khá|mức 2|m2/.test(s))return 2;if(/trung bình|đạt|mức 1|m1/.test(s))return 1;if(/chưa đạt|yếu/.test(s))return 0;return 1;}
function balancedPairs(a){
  const work=shuffle(a.slice());
  const pairs=[];
  while(work.length){
    const first=work.shift();
    const r=levelRank(level(first));
    let best=-1,bestScore=Infinity;
    for(let i=0;i<work.length;i++){
      const d=Math.abs(r-levelRank(level(work[i])));
      if(d<bestScore){best=i;bestScore=d;if(d===1)break;}
    }
    if(best<0)pairs.push([first,null]);else pairs.push([first,work.splice(best,1)[0]]);
  }
  return pairs;
}
function buildLayout(){
  const ss=students();if(!ss.length){alert('Chưa có dữ liệu học sinh.');return;}
  const pairs=balancedPairs(ss);
  const cols=COLS;
  const counts=Array.from({length:cols},()=>0);
  pairs.forEach((_,i)=>counts[i%cols]++);
  const colsData=Array.from({length:cols},()=>[]);
  // Phân bố theo vòng tròn để 4 tổ lệch tối đa 1 bàn.
  pairs.forEach((p,i)=>colsData[i%cols].push(p));
  const maxRows=Math.max(...counts);
  const html=`<div class="lh-layout-toolbar"><span><b>${ss.length}</b> học sinh · <b>${pairs.length}</b> bàn · <b>4</b> tổ · <b>2 HS/bàn</b></span><button class="button secondary" id="lhShuffle"><i class="fa-solid fa-shuffle"></i> Xếp lại ngẫu nhiên</button></div><div class="lh-classroom lh-four-columns">${colsData.map((col,c)=>`<div class="lh-column"><div class="lh-group-title">Tổ ${c+1} <small>(${col.length} bàn)</small></div>${col.map((p,i)=>`<div class="lh-desk"><span class="lh-row">${i+1}</span><div class="lh-seat">${p[0]?`<b>${esc(p[0].name)}</b><small>${esc(level(p[0]))}</small>`:'—'}</div><div class="lh-seat">${p[1]?`<b>${esc(p[1].name)}</b><small>${esc(level(p[1]))}</small>`:'—'}</div></div>`).join('')}</div>`).join('')}</div><p class="lh-note">4 tổ cố định. Mỗi dãy là một tổ, mỗi bàn 2 học sinh. Số bàn giữa các tổ lệch tối đa 1; hệ thống xáo trộn ngẫu nhiên và ưu tiên ghép học sinh khác trình độ.</p>`;
  const root=document.getElementById('lhUtilityWorkspace');if(root)root.innerHTML=html;const b=document.getElementById('lhShuffle');if(b)b.onclick=buildLayout;
}
function downloadLevels(){const ss=students();if(!ss.length){alert('Chưa có danh sách học sinh để tải.');return;}const rows=[['TT','Họ tên HS','Xếp loại'],...ss.map((s,i)=>[i+1,s.name,level(s)])];const csv='\uFEFF'+rows.map(r=>r.map(v=>'"'+String(v??'').replace(/"/g,'""')+'"').join(',')).join('\r\n');const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));a.download='DANH_SACH_TRINH_DO_HS_5C.csv';document.body.appendChild(a);a.click();a.remove();}
function install(){if(document.getElementById(APP))return;const nav=document.querySelector('.main-menu');if(!nav)return;nav.querySelectorAll('[data-page="utilities"]').forEach(x=>x.remove());const divider=document.createElement('div');divider.className='menu-divider';const btn=document.createElement('button');btn.type='button';btn.id=APP;btn.className='menu-item';btn.innerHTML='<i class="fa-solid fa-toolbox"></i><span>Tiện ích</span>';const settings=nav.querySelector('[data-page="settings"]');nav.insertBefore(divider,settings);nav.insertBefore(btn,settings);btn.onclick=()=>openPage();}
function openPage(){
  document.querySelectorAll('.page-section').forEach(s=>s.classList.remove('active'));
  let sec=document.getElementById('page-utilities-final');if(!sec){sec=document.createElement('section');sec.id='page-utilities-final';sec.className='page-section active';sec.innerHTML='<div class="page-header"><div><span class="page-eyebrow"><i class="fa-solid fa-toolbox"></i> Công cụ giáo viên</span><h1>Tiện ích</h1><p>Công cụ tổ chức lớp học nhanh, không thay đổi dữ liệu gốc.</p></div></div><div class="quick-actions"><button class="quick-action" id="lhLevelDownload"><span class="quick-action-icon">📥</span><span><strong>Tải danh sách trình độ HS</strong><small>TT · Họ tên HS · Xếp loại thực tế</small></span></button><button class="quick-action" id="lhClassroom"><span class="quick-action-icon">📐</span><span><strong>Tạo sơ đồ lớp học</strong><small>4 tổ · 2 HS/bàn · phân bố trình độ</small></span></button></div><div id="lhUtilityWorkspace"></div>';document.getElementById('mainContent').appendChild(sec);}
  sec.classList.add('active');const title=document.getElementById('pageTitle');if(title)title.textContent='Tiện ích';const dl=document.getElementById('lhLevelDownload');if(dl)dl.onclick=downloadLevels;const cr=document.getElementById('lhClassroom');if(cr)cr.onclick=buildLayout;
}
function css(){if(document.getElementById('lhUtilityStyle'))return;const s=document.createElement('style');s.id='lhUtilityStyle';s.textContent='.lh-layout-toolbar{display:flex;justify-content:space-between;align-items:center;gap:12px;margin:18px 0}.lh-classroom{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}.lh-column{background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;padding:10px}.lh-group-title{font-weight:700;text-align:center;margin-bottom:10px}.lh-group-title small{font-weight:500;color:#64748b}.lh-desk{display:grid;grid-template-columns:24px 1fr 1fr;gap:5px;margin:6px 0}.lh-row{display:flex;align-items:center;justify-content:center;font-size:12px;color:#64748b}.lh-seat{background:white;border:1px solid #cbd5e1;border-radius:8px;padding:7px;min-height:42px}.lh-seat b{display:block;font-size:12px}.lh-seat small{display:block;color:#64748b;margin-top:3px;font-size:11px}.lh-note{color:#64748b;margin-top:12px}@media(max-width:900px){.lh-classroom{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:560px){.lh-classroom{grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.lh-column{padding:7px}.lh-desk{grid-template-columns:18px 1fr 1fr;gap:3px}.lh-seat{padding:5px;min-height:38px}.lh-seat b{font-size:10px}.lh-seat small{font-size:9px}.lh-layout-toolbar{align-items:flex-start;flex-direction:column}}';document.head.appendChild(s);}
function start(){css();install();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();