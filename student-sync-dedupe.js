/* QUẢN LÝ LỚP HỌC THẦY LÊ HOÀNG
 * STUDENT SYNC DEDUPE + MASTER ROSTER SYNC 1.2
 *
 * Nguồn chuẩn: DANH_SACH_HOC_SINH_5C_2026_2027.json
 * Mã ổn định: HS01 -> HS42
 * Không dedupe theo tên.
 * Không cho Google payload thiếu 42 HS ghi đè Master Roster.
 * Không ghi ngược Google Sheets từ file này.
 */
(function(){
  'use strict';
  if(window.__STUDENT_SYNC_DEDUPE_INSTALLED_120__) return;
  const TARGET_COUNT=42;
  const MASTER_URL='./DANH_SACH_HOC_SINH_5C_2026_2027.json?v=20260820-2';
  const RELOAD_MARK='QL_LOP_HOC_MASTER_ROSTER_SYNC_120';
  const text=v=>String(v??'').trim();
  const idOf=s=>text(s?.studentCode||s?.code||s?.id||s?.studentId);
  const timeOf=s=>{const t=Date.parse(text(s?.updatedAt||s?.createdAt));return Number.isFinite(t)?t:0;};

  function dedupeStudents(input){
    if(!Array.isArray(input)) return [];
    const map=new Map();
    input.forEach(s=>{
      if(!s||typeof s!=='object') return;
      const key=idOf(s).toLowerCase();
      if(!key) return;
      const old=map.get(key);
      if(!old||timeOf(s)>=timeOf(old)) map.set(key,s);
    });
    return Array.from(map.values());
  }

  function normalizeMasterStudent(s,index){
    const stt=Number(s?.stt)||index+1;
    const id='HS'+String(stt).padStart(2,'0');
    return {id:id,studentCode:id,stt:stt,name:text(s?.name),gender:text(s?.gender),birthDate:text(s?.birthDate),parentName:text(s?.parentName),phone:text(s?.phone),address:text(s?.address),status:'active',note:'',createdAt:'2026-08-20T00:00:00.000Z',updatedAt:'2026-08-20T00:00:00.000Z',shareEnabled:true};
  }

  function validateMaster(list){
    if(!Array.isArray(list)||list.length!==TARGET_COUNT) throw new Error(`Master Roster không hợp lệ: ${list?.length||0}/${TARGET_COUNT}`);
    const seen=new Set();
    list.forEach((s,i)=>{const stt=Number(s?.stt)||i+1;if(stt<1||stt>TARGET_COUNT||seen.has(stt)) throw new Error(`STT Master lỗi: ${stt}`);seen.add(stt);if(!text(s?.name)) throw new Error(`Thiếu tên tại STT ${stt}`);});
    for(let i=1;i<=TARGET_COUNT;i++) if(!seen.has(i)) throw new Error(`Thiếu STT ${i}`);
  }

  function installWhenReady(){
    const original=window.replaceStudents;
    if(typeof original!=='function') return false;
    if(original.__STUDENT_SYNC_DEDUPE_WRAPPED_120__){window.__STUDENT_SYNC_DEDUPE_INSTALLED_120__=true;return true;}
    window.dedupeStudentsForSync=dedupeStudents;
    window.replaceStudents=function(incoming,options={}){
      const source=Array.isArray(incoming)?incoming:[];
      const unique=dedupeStudents(source);
      const sourceName=text(options?.source).toLowerCase();
      const google=sourceName.includes('google');
      if(google&&unique.length>0&&unique.length<TARGET_COUNT){
        window.__STUDENT_SYNC_DEDUPE_LAST__={sourceCount:source.length,uniqueCount:unique.length,removed:source.length-unique.length,blocked:true,reason:'incomplete-google-roster',expectedCount:TARGET_COUNT,at:new Date().toISOString()};
        console.warn(`[STUDENT SYNC] Chặn Google roster ${unique.length}/${TARGET_COUNT}; giữ Master Roster.`);
        return {ok:true,success:true,blocked:true,reason:'incomplete-google-roster',sourceCount:source.length,uniqueCount:unique.length,expectedCount:TARGET_COUNT};
      }
      const result=original.call(this,unique,{...options,dedupeApplied:true,sourceCount:source.length,uniqueCount:unique.length});
      window.__STUDENT_SYNC_DEDUPE_LAST__={sourceCount:source.length,uniqueCount:unique.length,removed:source.length-unique.length,blocked:false,at:new Date().toISOString()};
      if(result&&typeof result==='object') result.dedupe={applied:true,sourceCount:source.length,uniqueCount:unique.length,removed:source.length-unique.length};
      return result;
    };
    window.replaceStudents.__STUDENT_SYNC_DEDUPE_WRAPPED_120__=true;
    window.__STUDENT_SYNC_DEDUPE_INSTALLED_120__=true;
    return true;
  }

  installWhenReady();
  let attempts=0;const timer=setInterval(()=>{attempts++;if(installWhenReady()||attempts>=200)clearInterval(timer);},50);

  async function fetchMaster(){
    const response=await fetch(MASTER_URL,{cache:'no-store',credentials:'same-origin'});
    if(!response.ok) throw new Error(`Master Roster HTTP ${response.status}`);
    const payload=await response.json();
    validateMaster(payload?.students);
    return payload.students.slice().sort((a,b)=>(Number(a.stt)||0)-(Number(b.stt)||0)).map(normalizeMasterStudent);
  }
  function current(){try{if(typeof window.getStudentsSafe==='function'){const x=window.getStudentsSafe();if(Array.isArray(x))return x;}}catch(_){}return Array.isArray(window.students)?window.students:[];}
  function signature(list){return list.map(s=>[idOf(s),text(s?.name),text(s?.gender),text(s?.birthDate),text(s?.parentName),text(s?.phone),text(s?.address)].join('\u001f')).join('\u001e');}
  async function syncMaster(){
    try{
      const master=await fetchMaster();
      if(master.length!==TARGET_COUNT) throw new Error(`Master Roster ${master.length}/${TARGET_COUNT}`);
      const ready=await new Promise(resolve=>{let n=0;const t=setInterval(()=>{n++;if(typeof window.replaceStudents==='function'){clearInterval(t);resolve(true);}else if(n>=240){clearInterval(t);resolve(false);}},50);});
      if(!ready) throw new Error('Data Engine chưa sẵn sàng.');
      const cur=current();
      if(cur.length===TARGET_COUNT&&signature(cur)===signature(master)){window.__MASTER_ROSTER_SYNC_STATUS__={status:'already-synced',count:TARGET_COUNT,at:new Date().toISOString()};return;}
      const result=window.replaceStudents(master,{source:'MASTER_ROSTER_GITHUB',replaceMode:'authoritative',preserveRelatedRecords:true,allowEmpty:false,expectedCount:TARGET_COUNT,dedupeApplied:true});
      if(result===false||result?.success===false||result?.blocked) throw new Error('Không ghi được Master Roster.');
      window.__MASTER_ROSTER_SYNC_STATUS__={status:'synced',count:TARGET_COUNT,previousCount:cur.length,at:new Date().toISOString()};
      if(sessionStorage.getItem(RELOAD_MARK)!=='1'){sessionStorage.setItem(RELOAD_MARK,'1');setTimeout(()=>location.reload(),150);}else sessionStorage.removeItem(RELOAD_MARK);
    }catch(error){window.__MASTER_ROSTER_SYNC_STATUS__={status:'error',message:String(error?.message||error),at:new Date().toISOString()};console.error('[MASTER ROSTER]',error);}
  }
  const start=()=>setTimeout(syncMaster,700);
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start,{once:true}); else start();
})();

/* ============================================================
   STUDENT LIST UI FIX 1.0 - DYNAMIC / A-Z
   ------------------------------------------------------------
   Chỉ sửa tầng HIỂN THỊ.
   KHÔNG sửa students[].
   KHÔNG sửa Google Sheets.
   KHÔNG sửa JSON Master.
   KHÔNG tạo học sinh mẫu.
   KHÔNG dùng maxStudents để tạo dòng.
   ============================================================ */
(function(){
  'use strict';
  if(window.__STUDENT_LIST_UI_FIX_100__) return;
  window.__STUDENT_LIST_UI_FIX_100__=true;

  const collator=new Intl.Collator('vi',{sensitivity:'base',numeric:true});
  let running=false;

  function text(v){return String(v??'').replace(/\s+/g,' ').trim();}
  function getBody(){return document.getElementById('studentTableBody');}
  function getName(row){
    const cells=row.querySelectorAll('td');
    if(cells.length<2) return '';
    return text(cells[1].textContent);
  }
  function isRealStudentRow(row){
    if(!(row instanceof HTMLTableRowElement)) return false;
    if(row.querySelector('[data-student-id],[data-student-action]')) return true;
    const cells=row.querySelectorAll('td');
    if(cells.length<2) return false;
    const name=getName(row);
    if(!name) return false;
    if(/^(chưa có học sinh|đang chờ|không có dữ liệu)$/i.test(name)) return false;
    return true;
  }
  function normalizeRows(){
    const body=getBody();
    if(!body||running) return;
    const rows=Array.from(body.children).filter(el=>el.tagName==='TR');
    if(!rows.length) return;
    const real=rows.filter(isRealStudentRow);
    if(!real.length) return;
    running=true;
    try{
      real.sort((a,b)=>collator.compare(getName(a),getName(b)));
      real.forEach((row,index)=>{
        const first=row.querySelector('td');
        if(first) first.textContent=String(index+1);
        body.appendChild(row);
      });
      rows.filter(row=>!isRealStudentRow(row)).forEach(row=>row.remove());
    }finally{running=false;}
  }
  function start(){
    normalizeRows();
    const body=getBody();
    if(!body) return;
    const observer=new MutationObserver(()=>{
      if(running) return;
      requestAnimationFrame(normalizeRows);
    });
    observer.observe(body,{childList:true,subtree:true});
    window.__STUDENT_LIST_UI_FIX_OBSERVER__=observer;
    ['studentSearch','studentStatusFilter'].forEach(id=>{
      const el=document.getElementById(id);
      if(el) el.addEventListener('input',()=>setTimeout(normalizeRows,0));
      if(el) el.addEventListener('change',()=>setTimeout(normalizeRows,0));
    });
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();