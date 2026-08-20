/**
 * QUẢN LÝ LỚP HỌC THẦY LÊ HOÀNG
 * GOOGLE SHEETS SYNC API — MASTER 2.2 VIP DEDUPE
 *
 * HOC_SINH là nguồn danh sách duy nhất.
 * - Đúng 42 học sinh, A2:L43.
 * - Không append, không tạo STU_ giả, không dòng trống.
 * - HS01-HS42 là ID chuẩn và đi theo đúng học sinh.
 * - Chỉ thay đổi thứ tự hiển thị A-Z; không tự ý sửa trường hồ sơ.
 */
const CONFIG=Object.freeze({
  SPREADSHEET_ID:'174xQ29phs-Or7OOEKOM0IHylFJXg5SsqzOC27x7K3Wg',
  SCHOOL_YEAR:'2026–2027',CLASS_NAME:'5C',EXPECTED_STUDENTS:42,
  MASTER_ROSTER_URL:'https://raw.githubusercontent.com/levanhoangtsth1977-crypto/Quan_li_lop_hoc_thay_le_hoang/master/DANH_SACH_HOC_SINH_5C_2026_2027.json',
  VERSION:'MASTER-2.2-VIP-DEDUPE',
  TABS:['HOC_SINH','DIEM_DANH','VI_PHAM','KHEN_THUONG','HOC_TAP','TIEN_BO','NHAN_XET','LINK_HOC_SINH','CAU_HINH','NHAT_KY'],
  HEADERS:{
    HOC_SINH:['id','name','gender','birthDate','status','parentName','phone','address','note','shareEnabled','createdAt','updatedAt'],
    DIEM_DANH:['id','studentId','date','status','note','createdAt','updatedAt'],
    VI_PHAM:['id','studentId','date','type','level','status','action','note','createdAt','updatedAt'],
    KHEN_THUONG:['id','studentId','date','type','formType','note','createdAt','updatedAt'],
    HOC_TAP:['id','studentId','date','subject','result','level','note','createdAt','updatedAt'],
    TIEN_BO:['id','studentId','date','category','level','score','note','createdAt','updatedAt'],
    NHAN_XET:['id','studentId','date','subject','content','level','createdAt','updatedAt'],
    LINK_HOC_SINH:['studentId','studentCode','studentName','studentUrl','enabled','createdAt','updatedAt'],
    CAU_HINH:['Key','Value','UpdatedAt'],
    NHAT_KY:['timestamp','action','sheet','recordId','message']
  }
});

function getSpreadsheet_(){return SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID)}
function text_(v){return String(v??'').trim().replace(/\s+/g,' ')}
function collator_(){return new Intl.Collator('vi',{sensitivity:'base',numeric:false})}
function expectedIds_(){return Array.from({length:42},(_,i)=>'HS'+String(i+1).padStart(2,'0'))}

function ensureTab_(ss,name){
  let sh=ss.getSheetByName(name);if(!sh)sh=ss.insertSheet(name);
  const h=CONFIG.HEADERS[name]||[];
  if(h.length){
    if(sh.getMaxColumns()<h.length)sh.insertColumnsAfter(sh.getMaxColumns(),h.length-sh.getMaxColumns());
    if(!sh.getRange(1,1,1,h.length).getValues()[0].some(v=>text_(v)))sh.getRange(1,1,1,h.length).setValues([h]);
    sh.setFrozenRows(1);
  }
  return sh;
}

function prepareStudentSheet_(ss){
  const sh=ss.getSheetByName('HOC_SINH')||ss.insertSheet('HOC_SINH');
  const h=CONFIG.HEADERS.HOC_SINH;
  if(sh.getMaxColumns()<h.length)sh.insertColumnsAfter(sh.getMaxColumns(),h.length-sh.getMaxColumns());
  if(sh.getFilter())sh.getFilter().remove();
  sh.showRows(1,sh.getMaxRows());
  sh.getRange(1,1,1,h.length).setValues([h]);
  sh.setFrozenRows(1);return sh;
}

function setupSheet(){const ss=getSpreadsheet_();CONFIG.TABS.forEach(n=>ensureTab_(ss,n));prepareStudentSheet_(ss);writeConfig_(ss);return'OK'}
function writeConfig_(ss){
  const sh=ensureTab_(ss,'CAU_HINH'),now=new Date();
  if(sh.getLastRow()>1)sh.getRange(2,1,sh.getLastRow()-1,3).clearContent();
  sh.getRange(1,1,1,3).setValues([CONFIG.HEADERS.CAU_HINH]);
  sh.getRange(2,1,6,3).setValues([
    ['SPREADSHEET_ID',CONFIG.SPREADSHEET_ID,now],['LOP',CONFIG.CLASS_NAME,now],['NAM_HOC',CONFIG.SCHOOL_YEAR,now],
    ['SYNC_VERSION',CONFIG.VERSION,now],['EXPECTED_STUDENTS',CONFIG.EXPECTED_STUDENTS,now],['MASTER_ROSTER',CONFIG.MASTER_ROSTER_URL,now]
  ]);
}

function doGet(e){
  const action=String((e&&e.parameter&&e.parameter.action)||'ping').toLowerCase();
  try{
    if(action==='ping')return json_({ok:true,service:'LE_HOANG_CLASSROOM_SYNC',version:CONFIG.VERSION});
    if(action==='setup')return json_({ok:true,message:setupSheet()});
    if(['restore_master_students','repair_students','compact_students'].includes(action))return json_(restoreMasterStudents_());
    if(['get_students','getstudents'].includes(action))return json_(getStudents_());
    return json_({ok:false,error:'Unknown action'});
  }catch(err){log_('ERROR','SYSTEM','',String(err.stack||err));return json_({ok:false,error:String(err.message||err)})}
}

function doPost(e){
  const lock=LockService.getScriptLock();
  try{
    lock.waitLock(30000);
    const body=parseBody_(e),action=String(body.action||'').toLowerCase();
    if(action==='sync_students')return json_(syncStudents_(Array.isArray(body.students)?body.students:[]));
    if(['restore_master_students','repair_students','compact_students'].includes(action))return json_(restoreMasterStudents_());
    if(action==='setup')return json_({ok:true,message:setupSheet()});
    return json_({ok:false,error:'Unknown action'});
  }catch(err){log_('ERROR','SYSTEM','',String(err.stack||err));return json_({ok:false,error:String(err.message||err)})}
  finally{try{lock.releaseLock()}catch(_) {}}
}

function parseBody_(e){
  if(!e)return{};
  if(e.postData&&e.postData.contents){try{return JSON.parse(e.postData.contents)}catch(_) {}}
  const p=e.parameter||{};if(p.payload){try{return JSON.parse(p.payload)}catch(_) {}}
  return p;
}

function normalizeStudent_(s,index,now){
  const stt=Number(s.stt)||index+1;
  if(stt<1||stt>42)throw new Error('STT ngoài phạm vi 1-42: '+stt);
  return {
    id:'HS'+String(stt).padStart(2,'0'),stt,
    name:text_(s.name||s.hoTen||s.studentName),gender:text_(s.gender||s.gioiTinh),
    birthDate:s.birthDate||s.ngaySinh||'',status:text_(s.status||'active')||'active',
    parentName:text_(s.parentName||s.phuHuynh),phone:text_(s.phone||s.dienThoai),
    address:text_(s.address||s.diaChi),note:text_(s.note||s.ghiChu),
    shareEnabled:s.shareEnabled===false?false:true,createdAt:s.createdAt||now,updatedAt:now
  };
}

function validateMaster_(students){
  if(!Array.isArray(students)||students.length!==42)throw new Error('Master Roster không hợp lệ: '+(students?students.length:0)+'/42.');
  const seen=new Set();
  students.forEach((s,i)=>{
    const stt=Number(s.stt);
    if(!Number.isInteger(stt)||stt<1||stt>42||seen.has(stt))throw new Error('STT Master lỗi tại vị trí '+(i+1)+': '+s.stt);
    if(!text_(s.name))throw new Error('Học sinh rỗng tại STT '+stt);
    seen.add(stt);
  });
  for(let i=1;i<=42;i++)if(!seen.has(i))throw new Error('Master thiếu STT '+i);
}

function sortStudentsAZ_(students){
  const c=collator_();
  return students.slice().sort((a,b)=>{const n=c.compare(text_(a.name),text_(b.name));return n!==0?n:(Number(a.stt)||0)-(Number(b.stt)||0)});
}

function validateStudentRows_(students){
  if(!Array.isArray(students)||students.length!==42)return false;
  const expected=new Set(expectedIds_()),seen=new Set();
  for(const s of students){const id=text_(s.id);if(!expected.has(id)||seen.has(id)||!text_(s.name))return false;seen.add(id)}
  return seen.size===42;
}

/* Xóa vật lý vùng dữ liệu cũ rồi mới ghi. Không append. */
function hardResetStudentSheet_(sh){
  if(sh.getFilter())sh.getFilter().remove();
  sh.showRows(1,sh.getMaxRows());
  const maxRows=sh.getMaxRows(),maxCols=sh.getMaxColumns();
  if(maxRows>1)sh.getRange(2,1,maxRows-1,maxCols).clearContent();
  if(maxRows>43)sh.deleteRows(44,maxRows-43);
  if(sh.getMaxRows()<43)sh.insertRowsAfter(sh.getMaxRows(),43-sh.getMaxRows());
  sh.getRange(1,1,1,CONFIG.HEADERS.HOC_SINH.length).setValues([CONFIG.HEADERS.HOC_SINH]);
  SpreadsheetApp.flush();
}

function writeLinks_(ss,students){
  const sh=ensureTab_(ss,'LINK_HOC_SINH'),h=CONFIG.HEADERS.LINK_HOC_SINH;
  if(sh.getFilter())sh.getFilter().remove();sh.showRows(1,sh.getMaxRows());
  if(sh.getMaxRows()>43)sh.deleteRows(44,sh.getMaxRows()-43);
  if(sh.getMaxRows()<43)sh.insertRowsAfter(sh.getMaxRows(),43-sh.getMaxRows());
  sh.getRange(1,1,1,h.length).setValues([h]);
  if(sh.getMaxRows()>1)sh.getRange(2,1,42,Math.max(h.length,sh.getMaxColumns())).clearContent();
  const now=new Date();
  sh.getRange(2,1,42,h.length).setValues(students.map(s=>[s.id,s.id,s.name,'?student='+encodeURIComponent(s.id),s.shareEnabled,s.createdAt||now,s.updatedAt||now]));
  sh.setFrozenRows(1);SpreadsheetApp.flush();
}

function writeStudents_(students,source){
  if(students.length!==42)throw new Error('Từ chối ghi: phải đúng 42 học sinh.');
  if(!validateStudentRows_(students))throw new Error('Bộ học sinh phải đúng HS01-HS42, không trùng ID.');
  const ss=getSpreadsheet_(),sh=prepareStudentSheet_(ss);
  const rows=students.map(s=>[s.id,s.name,s.gender,s.birthDate,s.status,s.parentName,s.phone,s.address,s.note,s.shareEnabled,s.createdAt,s.updatedAt]);
  /* REPLACE ATOMICALLY: không dùng appendRow, không chèn dòng giữa dữ liệu. */
  hardResetStudentSheet_(sh);
  sh.getRange(2,1,42,CONFIG.HEADERS.HOC_SINH.length).setValues(rows);
  sh.setFrozenRows(1);SpreadsheetApp.flush();
  const check=sh.getRange(2,1,42,CONFIG.HEADERS.HOC_SINH.length).getValues().map(r=>({id:r[0],name:r[1]}));
  if(!validateStudentRows_(check))throw new Error('HOC_SINH sau ghi không đúng 42 HS01-HS42.');
  writeLinks_(ss,students);
  log_('REPLACE_STUDENTS','HOC_SINH','',`REPLACE 42 HS; source=${source}; no-append; no-STU; sort=A-Z`);
  return {ok:true,count:42,links:42,startRow:2,endRow:43,sort:'A-Z',mode:'REPLACE_NOT_APPEND',source,version:CONFIG.VERSION};
}

function restoreMasterStudents_(){
  const response=UrlFetchApp.fetch(CONFIG.MASTER_ROSTER_URL,{muteHttpExceptions:true,followRedirects:true});
  if(response.getResponseCode()!==200)throw new Error('Không tải được Master Roster: HTTP '+response.getResponseCode());
  const payload=JSON.parse(response.getContentText('UTF-8')),source=Array.isArray(payload.students)?payload.students:[];
  validateMaster_(source);
  const now=new Date();
  const normalized=source.slice().sort((a,b)=>Number(a.stt)-Number(b.stt)).map((s,i)=>normalizeStudent_(s,i,now));
  return writeStudents_(sortStudentsAZ_(normalized),'MASTER_ROSTER');
}

function syncStudents_(students){
  if(!Array.isArray(students)||students.length!==42)throw new Error('Nguồn đồng bộ phải có đúng 42 học sinh; nhận được '+(students?students.length:0)+'.');
  const now=new Date(),normalized=students.map((s,i)=>normalizeStudent_(s,i,now));
  if(!validateStudentRows_(normalized))throw new Error('Nguồn đồng bộ phải chứa đúng bộ ID HS01-HS42. Không ghi.');
  return writeStudents_(sortStudentsAZ_(normalized),'CLIENT_SYNC');
}

function getStudents_(){
  const ss=getSpreadsheet_(),sh=prepareStudentSheet_(ss),headers=CONFIG.HEADERS.HOC_SINH;
  if(sh.getLastRow()!==43)return restoreMasterStudents_();
  const values=sh.getRange(2,1,42,headers.length).getValues();
  const students=values.map(r=>{const o={};headers.forEach((h,i)=>o[h]=r[i]);return o});
  if(!validateStudentRows_(students))return restoreMasterStudents_();
  const sorted=sortStudentsAZ_(students);
  if(students.map(s=>s.id).join('|')!==sorted.map(s=>s.id).join('|')){
    writeStudents_(sorted,'REORDER_EXISTING');
  }
  return {ok:true,count:42,students:sorted,startRow:2,endRow:43,sort:'A-Z',source:'HOC_SINH',version:CONFIG.VERSION};
}

function json_(obj){return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON)}
function log_(action,sheet,recordId,message){
  try{
    const ss=getSpreadsheet_(),sh=ensureTab_(ss,'NHAT_KY');
    if(sh.getLastRow()<1)sh.getRange(1,1,1,CONFIG.HEADERS.NHAT_KY.length).setValues([CONFIG.HEADERS.NHAT_KY]);
    sh.appendRow([new Date(),action,sheet,recordId,message]);
  }catch(_){}
}
