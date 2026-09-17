/* VI PHẠM + KHEN THƯỞNG — NÚT XÓA THEO TỪNG BẢN GHI
   PATCH 3 — XÓA THẬT + ĐỐI CHIẾU ID GOOGLE + FALLBACK XÓA CỤC BỘ
   Chỉ tác động hai menu #violations và #rewards.
   Phần giao diện Trang chủ bên dưới dùng CHÍNH module đang được nạp này,
   không tạo thêm patch/module và không đổi version.
*/
(function(){
'use strict';
if(window.__LH_EVENT_DELETE_MENU_PATCH_3__)return;
window.__LH_EVENT_DELETE_MENU_PATCH_3__=true;

const KEY='LH_CANONICAL_2026_2027';
const GAS='https://script.google.com/macros/s/AKfycbxTPwf-jhrR8JOoKY5ZLuzlsDgcv3nWILtDPTrYNWZCEPpm2rkpXTn-sPAdFaUyy0z_uw/exec';
const CONFIG={
  violations:{sheet:'VI_PHAM',label:'vi phạm',field:'violations'},
  rewards:{sheet:'KHEN_THUONG',label:'khen thưởng',field:'rewards'}
};
const $=s=>document.querySelector(s);
const S=v=>String(v??'').trim();
const N=v=>S(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
const ALIAS={
  other:'khac','khac':'khac','good-deed':'viec tot','viec tot':'viec tot',learning:'hoc tap','hoc tap':'hoc tap',
  achievement:'thanh tich','thanh tich':'thanh tich',praise:'tuyen duong','tuyen duong':'tuyen duong',
  certificate:'giay khen','giay khen':'giay khen',gift:'phan thuong','phan thuong':'phan thuong',
  late:'di hoc muon','di hoc muon':'di hoc muon','late-school':'di hoc muon',homework:'chua hoan thanh bai',
  'chua hoan thanh bai':'chua hoan thanh bai',behavior:'hanh vi chua phu hop','hanh vi chua phu hop':'hanh vi chua phu hop',
  uniform:'trang phuc','trang phuc':'trang phuc',monitoring:'dang theo doi','dang theo doi':'dang theo doi',open:'dang theo doi',
  resolved:'da xu ly','da xu ly':'da xu ly',light:'nhe','nhe':'nhe',medium:'trung binh','trung binh':'trung binh',
  high:'nang','nang':'nang',low:'nhe',attention:'trung binh',reminder:'nhac nho','nhac nho':'nhac nho',
  discussion:'trao doi','trao doi':'trao doi',support:'ho tro','ho tro':'ho tro',active:'dang hoc','dang hoc':'dang hoc',
  inactive:'khong con hoc','khong con hoc':'khong con hoc'
};
function valueKey(v){const x=N(v);return ALIAS[x]||x}
function sameValue(a,b){return valueKey(a)===valueKey(b)}
function dateKey(v){const s=S(v);let m=s.match(/^(\d{4})-(\d{2})-(\d{2})/);if(m)return `${m[1]}${m[2]}${m[3]}`;m=s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);if(m)return `${m[3]}${String(m[2]).padStart(2,'0')}${String(m[1]).padStart(2,'0')}`;return N(s)}
function sameDate(a,b){return dateKey(a)===dateKey(b)}
function readData(){try{return JSON.parse(localStorage.getItem(KEY)||'null')}catch(_){return null}}
function writeData(d){try{localStorage.setItem(KEY,JSON.stringify(d));return true}catch(_){return false}}
function route(){return(location.hash||'#home').slice(1).split('?')[0]||'home'}
function toast(msg,type){if(typeof window.showToast==='function')window.showToast(msg,type||'error');else window.alert(msg)}
function studentName(data,record){const explicit=S(record?.studentName);if(explicit)return explicit;const sid=S(record?.studentId);const s=Array.isArray(data?.students)?data.students.find(x=>S(x?.id)===sid):null;return S(s?.name||record?.name)}
function rowHints(tr){const cells=[...tr.querySelectorAll(':scope > td')].map(td=>S(td.textContent).replace(/🗑️\s*Xóa|⏳\s*Đang xóa\.\.\./g,'').trim());return{date:cells[0]||'',student:cells[1]||'',type:cells[2]||'',level:cells[3]||'',action:cells[4]||'',status:cells[5]||'',form:cells[3]||'',note:cells[cells.length>6?6:4]||''}}
function scoreRecord(kind,record,h,data){if(!record||!h)return 0;let score=0;const rn=N(studentName(data,record));if(h.student&&rn===N(h.student))score+=12;if(h.date&&sameDate(record.date,h.date))score+=10;if(h.type&&sameValue(record.type,h.type))score+=7;if(kind==='violation'){if(h.level&&sameValue(record.level,h.level))score+=3;if(h.action&&sameValue(record.action,h.action))score+=2;if(h.status&&sameValue(record.status,h.status))score+=2}else{if(h.form&&sameValue(record.formType,h.form))score+=3;if(h.note&&N(record.note)===N(h.note))score+=3}return score}
function pickLocalRecord(kind,list,tr,index,data){if(!Array.isArray(list)||!list.length)return null;const h=rowHints(tr);let best=null,bestScore=-1,bestIndex=-1;list.forEach((r,i)=>{const sc=scoreRecord(kind,r,h,data);if(sc>bestScore){best=r;bestScore=sc;bestIndex=i}});const reverse=list[list.length-1-index];if(best&&bestScore>=17)return{record:best,index:bestIndex};if(reverse)return{record:reverse,index:list.length-1-index};if(best)return{record:best,index:bestIndex};return null}
function realRows(tbody){return[...tbody.querySelectorAll(':scope > tr')].filter(tr=>!tr.querySelector('.empty')&&tr.children.length>1)}
function addDeleteColumn(){const kind=route(),cfg=CONFIG[kind];if(!cfg)return;const table=$('.content .table');if(!table)return;const thead=table.tHead,tbody=table.tBodies?.[0];if(!thead||!tbody)return;const hr=thead.rows?.[0];if(!hr)return;if(!hr.querySelector('[data-lh-menu-delete-head]')){const th=document.createElement('th');th.dataset.lhMenuDeleteHead='1';th.textContent='Thao tác';hr.appendChild(th)}const rows=realRows(tbody),data=readData(),list=Array.isArray(data?.[cfg.field])?data[cfg.field]:[];rows.forEach((tr,i)=>{if(tr.querySelector('[data-lh-menu-delete]'))return;const picked=pickLocalRecord(kind,list,tr,i,data),td=document.createElement('td'),b=document.createElement('button');td.dataset.lhMenuDeleteCell='1';b.type='button';b.className='mini';b.dataset.lhMenuDelete='1';b.dataset.lhMenuIndex=String(i);if(picked?.record?.id)b.dataset.lhMenuId=S(picked.record.id);b.dataset.lhMenuKind=kind;b.title='Xóa bản ghi này';b.textContent='🗑️ Xóa';td.appendChild(b);tr.appendChild(td)})}
function jsonp(params){return new Promise((resolve,reject)=>{const cb='LHDEL3_'+Date.now()+'_'+Math.random().toString(36).slice(2),script=document.createElement('script');let done=false;const finish=(err,data)=>{if(done)return;done=true;clearTimeout(timer);try{delete window[cb]}catch(_){}script.remove();err?reject(err):resolve(data)};window[cb]=data=>finish(null,data);script.onerror=()=>finish(Error('Google Apps Script không phản hồi'));const timer=setTimeout(()=>finish(Error('Google Apps Script hết thời gian phản hồi')),20000);const q=new URLSearchParams({...params,callback:cb,_:String(Date.now())});script.src=GAS+'?'+q.toString();document.head.appendChild(script)})}
async function requestJson(params){let last=null;try{const q=new URLSearchParams({...params,_:String(Date.now())}),res=await fetch('/api/google?'+q.toString(),{cache:'no-store',credentials:'same-origin'}),out=await res.json().catch(()=>null);if(res.ok&&out&&typeof out==='object')return out;last=Error(out?.error||`API /api/google trả HTTP ${res.status}`)}catch(e){last=e}try{const out=await jsonp(params);if(out&&typeof out==='object')return out;throw Error('Google Apps Script trả dữ liệu không hợp lệ')}catch(e){throw e||last||Error('Không thể kết nối Google Apps Script')}}
async function remoteEvents(){try{const d=await requestJson({action:'get_events'});if(d?.ok!==true)throw Error(d?.error||'Không đọc được dữ liệu sự kiện Google Sheets');return d}catch(_){const d=await requestJson({action:'get_all'});if(d?.ok!==true)throw Error(d?.error||'Không đọc được dữ liệu Google Sheets');return d}}
function remoteStudentMatches(local,remote,data){const localName=N(studentName(data,local)),localSid=S(local?.studentId),remoteName=N(remote?.studentName||remote?.name);if(localSid&&S(remote?.studentId)===localSid)return 4;if(localName&&remoteName===localName)return 4;return 0}
function resolveRemoteId(kind,local,rows,data){if(!Array.isArray(rows)||!local)return '';const wanted=S(local.id),direct=rows.find(x=>S(x?.id)===wanted);if(direct)return S(direct.id);let best='',bestScore=-1,second=-1;rows.forEach(remote=>{let sc=remoteStudentMatches(local,remote,data);if(sc===0||!sameDate(remote?.date,local?.date))return;sc+=5;if(sameValue(remote?.type,local?.type))sc+=4;if(kind==='violations'){if(sameValue(remote?.level,local?.level))sc+=2;if(sameValue(remote?.action,local?.action))sc+=2;if(sameValue(remote?.status,local?.status))sc+=1}else{if(sameValue(remote?.formType,local?.formType))sc+=2;if(N(remote?.note)===N(local?.note))sc+=2}if(sc>bestScore){second=bestScore;bestScore=sc;best=S(remote?.id)}else if(sc>second)second=sc});if(best&&(bestScore>=9||bestScore>second))return best;return ''}
function isRemoteNotFound(msg){const x=N(msg);return x.includes('khong co du lieu')||x.includes('khong tim thay')||x.includes('khong ton tai')||x.includes('not found')||x.includes('no data')}
async function deleteRemote(kind,local,data){const cfg=CONFIG[kind],all=await remoteEvents(),rows=Array.isArray(all?.[cfg.sheet])?all[cfg.sheet]:[],remoteId=resolveRemoteId(kind,local,rows,data);if(!remoteId)return{status:'not_found',id:''};const out=await requestJson({action:'delete_event',sheet:cfg.sheet,id:remoteId,recordId:remoteId,eventId:remoteId});if(out?.ok===true&&out.deleted===true&&Number(out.deletedCount||0)>=1)return{status:'deleted',id:remoteId};const msg=out?.error||out?.message||'Google Sheets không xác nhận đã xóa';if(isRemoteNotFound(msg))return{status:'not_found',id:remoteId};throw Error(msg)}
function removeLocal(kind,id,data){const list=Array.isArray(data?.[CONFIG[kind].field])?data[CONFIG[kind].field]:[],i=list.findIndex(x=>S(x?.id)===S(id));if(i<0)return false;list.splice(i,1);return writeData(data)}
async function deleteRecord(button){const kind=S(button?.dataset?.lhMenuKind)||route(),cfg=CONFIG[kind];if(!cfg)return;const data=readData(),list=Array.isArray(data?.[cfg.field])?data[cfg.field]:[],id=S(button.dataset.lhMenuId);let local=list.find(x=>S(x?.id)===id)||null;if(!local){const idx=Number(button.dataset.lhMenuIndex),tr=button.closest('tr');local=pickLocalRecord(kind,list,tr,idx,data)?.record||null}if(!local){toast('Không xác định được bản ghi cần xóa.','error');return}const detail=[local.date,studentName(data,local),local.type,local.note].filter(Boolean).join(' · ');if(!window.confirm(`Xóa ${cfg.label} này?\n${detail||'Bản ghi đã chọn'}\n\nHệ thống sẽ xóa trên Google Sheets nếu có bản ghi tương ứng; nếu không có, bản ghi cục bộ vẫn được xóa.`))return;button.disabled=true;button.textContent='⏳ Đang xóa...';let remote='not_attempted',remoteError=null;try{remote=(await deleteRemote(kind,local,data)).status}catch(e){remote='error';remoteError=e}const localDeleted=removeLocal(kind,local.id,data);if(!localDeleted){button.disabled=false;button.textContent='🗑️ Xóa';toast('Không xóa được bản ghi cục bộ.','error');return}if(remote==='deleted')toast(`Đã xóa ${cfg.label} trên Google Sheets và giao diện.`,'success');else if(remote==='not_found')toast(`Đã xóa ${cfg.label} trên giao diện. Google Sheets không có bản ghi tương ứng.`,'success');else if(remote==='error')toast(`Đã xóa ${cfg.label} trên giao diện; Google Sheets chưa xác nhận. ${remoteError?.message||''}`,'error');else toast(`Đã xóa ${cfg.label}.`,'success');setTimeout(()=>location.reload(),250)}

document.addEventListener('click',e=>{const b=e.target.closest?.('[data-lh-menu-delete]');if(!b)return;e.preventDefault();e.stopImmediatePropagation();void deleteRecord(b)},true);

/* ============================================================
   TRANG CHỦ — DÙNG CHÍNH LOGO LỚP 5A3 ĐÃ CÓ TRONG REPO
   Không thêm file, không thêm module, không đổi version.
   ============================================================ */
const LOGO_SOURCES=[
  '/assets/logo-5a3.jpg?v=20260913.6',
  'https://quan-li-lop-hoc-thay-le-hoang.vercel.app/assets/logo-5a3.jpg?v=20260913.6',
  'https://raw.githubusercontent.com/levanhoangtsth1977-crypto/Quan_li_lop_hoc_thay_le_hoang/master/assets/logo-5a3.jpg?v=20260913.6'
];
const HOME_STYLE_ID='lhHomePresentationStyle';
function ensureHomeStyle(){
  if(document.getElementById(HOME_STYLE_ID))return;
  const s=document.createElement('style');
  s.id=HOME_STYLE_ID;
  s.textContent=`
    /* ===== SIDEBAR MENU: XANH LAM + CHỮ LỚN ===== */
    .sidebar .menu{gap:7px!important;}
    .sidebar .menu a{
      min-height:43px!important;
      padding:11px 12px!important;
      border-radius:12px!important;
      background:#1559c7!important;
      color:#fff!important;
      font-size:16px!important;
      font-weight:650!important;
      line-height:1.25!important;
      box-shadow:0 3px 8px rgba(15,23,42,.10)!important;
    }
    .sidebar .menu a span{font-size:16px!important;}
    .sidebar .menu a:hover{background:#0d47a1!important;color:#fff!important;transform:translateX(2px);}
    .sidebar .menu a.active{background:#083b91!important;color:#fff!important;font-weight:800!important;box-shadow:0 5px 12px rgba(8,59,145,.28)!important;}
    .sidebar .menu .count{font-size:12px!important;font-weight:800!important;color:#fff!important;background:rgba(255,255,255,.18)!important;padding:2px 7px!important;border-radius:999px!important;}

    /* ===== HOME: LOGO BÊN PHẢI PHẦN CHỮ ===== */
    #mainContent.lh-home-modern{
      position:relative;isolation:isolate;
      padding:clamp(18px,2.3vw,30px) clamp(16px,2.4vw,34px) 34px;
      background:radial-gradient(circle at 92% 2%,rgba(59,130,246,.11),transparent 28%),radial-gradient(circle at 8% 18%,rgba(124,58,237,.07),transparent 24%),linear-gradient(180deg,#f8fbff 0%,#f4f7fb 100%);
    }
    #mainContent.lh-home-modern .hero{
      position:relative!important;display:grid!important;grid-template-columns:minmax(0,1fr) 220px!important;align-items:center!important;
      min-height:228px!important;padding:28px 30px!important;gap:20px!important;overflow:hidden!important;border:1px solid rgba(255,255,255,.45)!important;border-radius:28px!important;
      background:linear-gradient(135deg,#0f3fbf 0%,#2563eb 52%,#4f46e5 100%)!important;box-shadow:0 22px 55px rgba(30,64,175,.20)!important;
    }
    #mainContent.lh-home-modern .hero::before{content:"";position:absolute;width:340px;height:340px;right:-120px;top:-170px;border-radius:50%;background:rgba(255,255,255,.10);}
    #mainContent.lh-home-modern .hero::after{content:"";position:absolute;width:170px;height:170px;left:43%;bottom:-110px;border-radius:50%;background:rgba(255,255,255,.07);}
    #mainContent.lh-home-modern .hero > *{position:relative;z-index:1;}
    #mainContent.lh-home-modern .hero > div:first-child > div:first-child{display:inline-flex;align-items:center;gap:7px;padding:7px 11px;border:1px solid rgba(255,255,255,.22);border-radius:999px;background:rgba(255,255,255,.12);font-size:12px;font-weight:750;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);}
    #mainContent.lh-home-modern .hero h1{margin:14px 0 10px!important;font-size:clamp(27px,3.1vw,42px)!important;line-height:1.08!important;letter-spacing:-.035em;color:#fff!important;text-shadow:0 8px 24px rgba(15,23,42,.16)!important;}
    #mainContent.lh-home-modern .hero > div:first-child > div:last-child{max-width:720px;color:rgba(255,255,255,.90);font-size:14px;}
    #mainContent.lh-home-modern .lh-home-logo-slot{display:grid!important;place-items:center!important;min-height:180px!important;padding:8px!important;border-radius:24px!important;background:rgba(255,255,255,.11)!important;border:1px solid rgba(255,255,255,.18)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.12),0 12px 28px rgba(15,23,42,.12)!important;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);}
    #mainContent.lh-home-modern #lhHomeHeroLogo{display:block!important;width:188px!important;height:188px!important;max-width:100%!important;object-fit:contain!important;border-radius:50%!important;box-shadow:0 10px 28px rgba(15,23,42,.18)!important;background:#fff;}
    #mainContent.lh-home-modern .head{margin:28px 2px 14px!important;}
    #mainContent.lh-home-modern .head h1{font-size:22px!important;letter-spacing:-.015em;color:#15233d;}
    #mainContent.lh-home-modern .grid.g4{gap:14px!important;}
    #mainContent.lh-home-modern .quick,#mainContent.lh-home-modern .stat{position:relative;overflow:hidden;border:1px solid rgba(226,232,240,.90);background:rgba(255,255,255,.94);box-shadow:0 10px 28px rgba(15,23,42,.06);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);transition:transform .18s ease,box-shadow .18s ease,border-color .18s ease;}
    #mainContent.lh-home-modern .quick::before{content:"";position:absolute;left:0;top:0;right:0;height:4px;background:linear-gradient(90deg,#2563eb,#7c3aed);opacity:.9;}
    #mainContent.lh-home-modern .quick{min-height:118px;padding:19px 17px 16px;border-radius:18px;}
    #mainContent.lh-home-modern .quick strong{margin-top:4px;font-size:15px;color:#172033;}
    #mainContent.lh-home-modern .quick small{margin-top:8px;font-size:12px;line-height:1.45;color:#718096;}
    #mainContent.lh-home-modern .quick:hover{transform:translateY(-3px);box-shadow:0 16px 36px rgba(15,23,42,.10);border-color:#cbd5e1;}
    #mainContent.lh-home-modern .stat{min-height:114px;padding:18px;border-radius:18px;font-size:13px;font-weight:700;color:#64748b;}
    #mainContent.lh-home-modern .stat::before{content:"";position:absolute;width:54px;height:54px;right:-12px;top:-12px;border-radius:50%;background:rgba(37,99,235,.08);}
    #mainContent.lh-home-modern .grid.g4:last-of-type .stat:nth-child(2)::before{background:rgba(22,163,74,.08)}
    #mainContent.lh-home-modern .grid.g4:last-of-type .stat:nth-child(3)::before{background:rgba(220,38,38,.08)}
    #mainContent.lh-home-modern .grid.g4:last-of-type .stat:nth-child(4)::before{background:rgba(124,58,237,.08)}
    #mainContent.lh-home-modern .stat > .num{position:relative;z-index:1;margin-top:6px;font-size:31px;line-height:1;letter-spacing:-.03em;color:#0f2f75;}
    #mainContent.lh-home-modern .grid.g4:last-of-type .stat:nth-child(2) > .num{color:#15803d}
    #mainContent.lh-home-modern .grid.g4:last-of-type .stat:nth-child(3) > .num{color:#b91c1c}
    #mainContent.lh-home-modern .grid.g4:last-of-type .stat:nth-child(4) > .num{color:#6d28d9}
    @media(max-width:900px){
      #mainContent.lh-home-modern .hero{grid-template-columns:minmax(0,1fr) 165px!important;min-height:205px!important;padding:24px!important;}
      #mainContent.lh-home-modern .lh-home-logo-slot{min-height:150px!important;}
      #mainContent.lh-home-modern #lhHomeHeroLogo{width:148px!important;height:148px!important;}
      .sidebar .menu a,.sidebar .menu a span{font-size:15.5px!important;}
    }
    @media(max-width:720px){
      .sidebar .menu a{min-height:46px!important;padding:12px!important;}
      #mainContent.lh-home-modern{padding:14px 12px 24px;}
      #mainContent.lh-home-modern .hero{grid-template-columns:minmax(0,1fr) 112px!important;min-height:190px!important;padding:20px!important;gap:10px!important;border-radius:22px!important;}
      #mainContent.lh-home-modern .lh-home-logo-slot{min-height:112px!important;padding:4px!important;border-radius:18px!important;}
      #mainContent.lh-home-modern #lhHomeHeroLogo{width:104px!important;height:104px!important;}
      #mainContent.lh-home-modern .hero h1{font-size:26px!important;}
      #mainContent.lh-home-modern .hero > div:first-child > div:last-child{font-size:12px;line-height:1.45;}
      #mainContent.lh-home-modern .quick{min-height:104px;padding:17px 15px 14px;}
      #mainContent.lh-home-modern .stat{min-height:102px!important;}
    }
    @media(max-width:380px){
      #mainContent.lh-home-modern .hero{grid-template-columns:minmax(0,1fr) 92px!important;gap:6px!important;padding:17px!important;}
      #mainContent.lh-home-modern .lh-home-logo-slot{min-height:92px!important;}
      #mainContent.lh-home-modern #lhHomeHeroLogo{width:86px!important;height:86px!important;}
      #mainContent.lh-home-modern .hero h1{font-size:23px!important;}
    }
    @media(prefers-reduced-motion:reduce){#mainContent.lh-home-modern .quick{transition:none}.sidebar .menu a{transition:none!important;}}
  `;
  document.head.appendChild(s);
}
function applyHomePresentation(){
  const root=document.getElementById('mainContent');
  if(!root)return;
  ensureHomeStyle();
  const isHome=route()==='home';
  root.classList.toggle('lh-home-modern',isHome);
  if(!isHome)return;
  const hero=root.querySelector('.hero');
  if(!hero)return;
  const slot=hero.children?.[1];
  if(!slot)return;
  if(slot.dataset.lhHomeLogoReady==='1'&&slot.querySelector('#lhHomeHeroLogo'))return;
  slot.className='lh-home-logo-slot';
  slot.removeAttribute('style');
  slot.dataset.lhHomeLogoReady='1';
  const img=document.createElement('img');
  img.id='lhHomeHeroLogo';
  img.alt='Logo lớp 5A3 Trường Tiểu học Nghĩa Hành';
  img.loading='eager';
  img.decoding='async';
  img.referrerPolicy='no-referrer';
  img.dataset.logoSourceIndex='0';
  img.addEventListener('error',function(){
    const i=Number(img.dataset.logoSourceIndex||0)+1;
    if(i<LOGO_SOURCES.length){img.dataset.logoSourceIndex=String(i);img.src=LOGO_SOURCES[i];}
  },false);
  img.src=LOGO_SOURCES[0];
  slot.replaceChildren(img);
}

let scheduled=false;
function schedule(){
  if(scheduled)return;
  scheduled=true;
  requestAnimationFrame(()=>{
    scheduled=false;
    try{addDeleteColumn()}catch(e){console.warn('[event-delete-menu]',e)}
    try{applyHomePresentation()}catch(e){console.warn('[home-presentation]',e)}
  });
}
new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true});
window.addEventListener('hashchange',()=>setTimeout(schedule,0));
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(schedule,0),{once:true});
else schedule();
})();