/**
 * QUẢN LÝ LỚP HỌC THẦY LÊ HOÀNG
 * GOOGLE SHEETS SYNC API — MASTER 2.0
 *
 * HOC_SINH là SHEET đặc biệt:
 * - Header A1:L1 cố định đúng schema.
 * - 42 học sinh liên tục từ A2:L43.
 * - Không có dòng rỗng xen giữa.
 * - ID bắt buộc HS01 -> HS42.
 *
 * Các SHEET nghiệp vụ khác giữ nguyên cấu trúc riêng.
 */
const CONFIG=Object.freeze({
  SPREADSHEET_ID:'174xQ29phs-Or7OOEKOM0IHylFJXg5SsqzOC27x7K3Wg',
  SCHOOL_YEAR:'2026–2027',CLASS_NAME:'5C',EXPECTED_STUDENTS:42,
  MASTER_ROSTER_URL:'https://raw.githubusercontent.com/levanhoangtsth1977-crypto/Quan_li_lop_hoc_thay_le_hoang/master/DANH_SACH_HOC_SINH_5C_2026_2027.json',
  VERSION:'MASTER-2.0',
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

function ensureTab_(ss,name){
  let sh=ss.getSheetByName(name);
  if(!sh)sh=ss.insertSheet(name);
  const h=CONFIG.HEADERS[name]||[];
  if(h.length){
    if(sh.getMaxColumns()<h.length)sh.insertColumnsAfter(sh.getMaxColumns(),h.length-sh.getMaxColumns());
    const first=sh.getRange(1,1,1,h.length).getValues()[0];
    if(!first.some(v=>String(v||'').trim()))sh.getRange(1,1,1,h.length).setValues([h]);
    sh.setFrozenRows(1);
  }
  return sh;
}

/* Chỉ HOC_SINH dùng schema cưỡng chế. Không áp dụng cho SHEET khác. */
function prepareStudentSheet_(ss){
  const sh=ss.getSheetByName('HOC_SINH')||ss.insertSheet('HOC_SINH');
  const headers=CONFIG.HEADERS.HOC_SINH;
  if(sh.getMaxColumns()<headers.length)sh.insertColumnsAfter(sh.getMaxColumns(),headers.length-sh.getMaxColumns());
  if(sh.getFilter())sh.getFilter().remove();
  sh.showRows(1,sh.getMaxRows());
  sh.getRange(1,1,1,headers.length).setValues([headers]);
  sh.setFrozenRows(1);
  return sh;
}

function setupSheet(){const ss=getSpreadsheet_();CONFIG.TABS.forEach(n=>ensureTab_(ss,n));prepareStudentSheet_(ss);writeConfig_(ss);return'OK'}

function writeConfig_(ss){
  const sh=ensureTab_(ss,'CAU_HINH');
  const rows=[['SPREADSHEET_ID',CONFIG.SPREADSHEET_ID,new Date()],['LOP',CONFIG.CLASS_NAME,new Date()],['NAM_HOC',CONFIG.SCHOOL_YEAR,new Date()],['SYNC_VERSION',CONFIG.VERSION,new Date()],['EXPECTED_STUDENTS',CONFIG.EXPECTED_STUDENTS,new Date()],['MASTER_ROSTER',CONFIG.MASTER_ROSTER_URL,new Date()]];
  if(sh.getLastRow()>1)sh.getRange(2,1,sh.getLastRow()-1,3).clearContent();
  sh.getRange(2,1,rows.length,3).setValues(rows);
}

function doGet(e){
  const action=String((e&&e.parameter&&e.parameter.action)||'ping').toLowerCase();
  try{
    if(action==='ping')return json_({ok:true,service:'LE_HOANG_CLASSROOM_SYNC',version:CONFIG.VERSION});
    if(action==='setup')return json_({ok:true,message:setupSheet()});
    if(action==='restore_master_students'||action==='repair_students'||action==='compact_students')return json_(restoreMasterStudents_());
    if(action==='get_students'||action==='getstudents')return json_(getStudents_());
    return json_({ok:false,error:'Unknown action'});
  }catch(err){log_('ERROR','SYSTEM','',String(err.stack||err));return json_({ok:false,error:String(err.message||err)})}
}

function doPost(e){
  const lock=LockService.getScriptLock();
  try{
    lock.waitLock(30000);
    const body=parseBody_(e),action=String(body.action||'').toLowerCase();
    if(action==='sync_students')return json_(syncStudents_(Array.isArray(body.students)?body.students:[]));
    if(action==='restore_master_students'||action==='repair_students'||action==='compact_students')return json_(restoreMasterStudents_());
    if(action==='setup')return json_({ok:true,message:setupSheet()});
    return json_({ok:false,error:'Unknown action'});
  }catch(err){log_('ERROR','SYSTEM','',String(err.stack||err));return json_({ok:false,error:String(err.message||err)})}
  finally{try{lock.releaseLock()}catch(_) {}}
}

function parseBody_(e){
  if(!e)return{};
  if(e.postData&&e.postData.contents){try{return JSON.parse(e.postData.contents)}catch(_){}}
  const p=e.parameter||{};
  if(p.payload){try{return JSON.parse(p.payload)}catch(_){}}
  return p;
}

function normalizeStudent_(s,index,now){
  const stt=Number(s.stt)||index+1;
  const id='HS'+String(stt).padStart(2,'0');
  return {
    id,
    name:String(s.name||s.hoTen||s.studentName||'').trim(),
    gender:String(s.gender||s.gioiTinh||'').trim(),
    birthDate:String(s.birthDate||s.ngaySinh||'').trim(),
    status:String(s.status||'active').trim()||'active',
    parentName:String(s.parentName||s.phuHuynh||'').trim(),
    phone:String(s.phone||s.dienThoai||'').trim(),
    address:String(s.address||s.diaChi||'').trim(),
    note:String(s.note||s.ghiChu||'').trim(),
    shareEnabled:s.shareEnabled===false?false:true,
    createdAt:s.createdAt||now,
    updatedAt:now,
    stt
  };
}

function dedupeStudents_(students){
  const byId=new Map(),duplicates=[];
  students.forEach(s=>{
    if(!s||!s.name)return;
    const id=String(s.id||'').trim();
    if(!id)throw new Error('Học sinh không có ID: '+s.name);
    if(byId.has(id)){duplicates.push({type:'ID',id,name:s.name});return}
    byId.set(id,s);
  });
  return{unique:Array.from(byId.values()).sort((a,b)=>a.stt-b.stt),duplicates};
}

function validateMaster_(students){
  if(!Array.isArray(students)||students.length!==42)throw new Error('Master Roster không hợp lệ: '+(students?students.length:0)+'/42.');
  const seen=new Set();
  students.forEach((s,i)=>{
    const stt=Number(s.stt)||i+1;
    if(stt<1||stt>42||seen.has(stt))throw new Error('STT Master lỗi tại vị trí '+(i+1)+': '+stt);
    seen.add(stt);
    if(!String(s.name||'').trim())throw new Error('Học sinh rỗng tại STT '+stt);
  });
  for(let i=1;i<=42;i++)if(!seen.has(i))throw new Error('Master thiếu STT '+i);
}

function expectedIds_(){return Array.from({length:42},(_,i)=>'HS'+String(i+1).padStart(2,'0'))}

function validateStudentSheetHeader_(sh){
  const expected=CONFIG.HEADERS.HOC_SINH;
  const actual=sh.getRange(1,1,1,expected.length).getValues()[0].map(v=>String(v||'').trim());
  return expected.every((h,i)=>actual[i]===h);
}

function restoreMasterStudents_(){
  const response=UrlFetchApp.fetch(CONFIG.MASTER_ROSTER_URL,{muteHttpExceptions:true,followRedirects:true});
  if(response.getResponseCode()!==200)throw new Error('Không tải được Master Roster: HTTP '+response.getResponseCode());
  const payload=JSON.parse(response.getContentText('UTF-8'));
  const source=Array.isArray(payload.students)?payload.students.slice():[];
  validateMaster_(source);
  const now=new Date();
  const normalized=source.sort((a,b)=>(Number(a.stt)||0)-(Number(b.stt)||0)).map((s,i)=>normalizeStudent_(s,i,now));
  const result=dedupeStudents_(normalized);
  if(result.unique.length!==42)throw new Error('Sau chống trùng còn '+result.unique.length+'/42. Không ghi.');
  const expected=expectedIds_();
  if(result.unique.some((s,i)=>s.id!==expected[i]))throw new Error('ID Master không liên tục HS01 → HS42. Không ghi.');
  return writeStudents_(result.unique,true,result.duplicates);
}

function syncStudents_(students){
  const now=new Date();
  const clean=(Array.isArray(students)?students:[]).map((s,i)=>normalizeStudent_(s,i,now)).filter(s=>s.name);
  if(!clean.length)throw new Error('Không có học sinh hợp lệ.');
  const result=dedupeStudents_(clean);
  if(result.unique.length!==42)throw new Error('Nguồn đồng bộ phải có đúng 42 học sinh; nhận được '+result.unique.length+'. Không ghi.');
  const expected=expectedIds_();
  if(result.unique.some((s,i)=>s.id!==expected[i]))throw new Error('Nguồn đồng bộ không đúng thứ tự HS01 → HS42. Không ghi.');
  return writeStudents_(result.unique,false,result.duplicates);
}

function resetVisibleRows_(sh){
  if(sh.getFilter())sh.getFilter().remove();
  sh.showRows(1,sh.getMaxRows());
  if(sh.getMaxRows()<43)sh.insertRowsAfter(sh.getMaxRows(),43-sh.getMaxRows());
  if(sh.getMaxRows()>43)sh.deleteRows(44,sh.getMaxRows()-43);
  sh.getRange(2,1,42,sh.getMaxColumns()).clearContent();
  SpreadsheetApp.flush();
}

function rebuildStudentRows_(sh,rows){
  const headers=CONFIG.HEADERS.HOC_SINH;
  if(rows.length!==42)throw new Error('HOC_SINH chỉ được ghi đúng 42 dòng.');
  prepareStudentSheet_(getSpreadsheet_());
  resetVisibleRows_(sh);
  sh.getRange(1,1,1,headers.length).setValues([headers]);
  sh.getRange(2,1,42,headers.length).setValues(rows);
  sh.setFrozenRows(1);
  SpreadsheetApp.flush();
  const check=sh.getRange(2,1,42,headers.length).getValues();
  const expected=expectedIds_();
  for(let i=0;i<42;i++){
    if(String(check[i][0]||'').trim()!==expected[i])throw new Error('HOC_SINH sai ID tại dòng '+(i+2));
    if(!String(check[i][1]||'').trim())throw new Error('HOC_SINH có dòng rỗng tại dòng '+(i+2));
  }
  if(!validateStudentSheetHeader_(sh))throw new Error('HOC_SINH sai header A1:L1.');
}

function writeLinksContiguous_(sh,rows,headers){
  const width=headers.length;
  if(sh.getFilter())sh.getFilter().remove();
  sh.showRows(1,sh.getMaxRows());
  if(sh.getMaxRows()<43)sh.insertRowsAfter(sh.getMaxRows(),43-sh.getMaxRows());
  if(sh.getMaxRows()>43)sh.deleteRows(44,sh.getMaxRows()-43);
  sh.getRange(2,1,42,Math.max(width,sh.getMaxColumns())).clearContent();
  sh.getRange(2,1,42,width).setValues(rows);
  sh.setFrozenRows(1);
  SpreadsheetApp.flush();
}

function writeStudents_(unique,fromMaster,duplicates){
  const ss=getSpreadsheet_(),sh=prepareStudentSheet_(ss),links=ensureTab_(ss,'LINK_HOC_SINH');
  if(unique.length!==42)throw new Error('Từ chối ghi: số HS không bằng 42.');
  const rows=unique.map(s=>[s.id,s.name,s.gender,s.birthDate,s.status,s.parentName,s.phone,s.address,s.note,s.shareEnabled,s.createdAt,s.updatedAt]);
  const linkRows=unique.map(s=>[s.id,s.id,s.name,'?student='+encodeURIComponent(s.id),s.shareEnabled,s.createdAt,s.updatedAt]);
  rebuildStudentRows_(sh,rows);
  writeLinksContiguous_(links,linkRows,CONFIG.HEADERS.LINK_HOC_SINH);
  log_(fromMaster?'RESTORE_MASTER_STUDENTS':'SYNC_STUDENTS','HOC_SINH','','Đã ghi đúng 42 HS liên tục từ dòng 2 đến 43.');
  return{ok:true,count:42,links:42,duplicateCount:(duplicates||[]).length,duplicates:duplicates||[],source:fromMaster?'MASTER_ROSTER':'CLIENT',targetSheet:'HOC_SINH',startRow:2,endRow:43,expected:42,version:CONFIG.VERSION};
}

function getStudents_(){
  const ss=getSpreadsheet_(),sh=prepareStudentSheet_(ss),headers=CONFIG.HEADERS.HOC_SINH;
  const last=sh.getLastRow();
  const headerOk=validateStudentSheetHeader_(sh);
  if(!headerOk||last<43){const r=restoreMasterStudents_();return getStudents_WithoutRestore_(r.count);}
  const values=sh.getRange(2,1,42,headers.length).getValues();
  const students=values.map(r=>{const o={};headers.forEach((h,i)=>o[h]=r[i]);return o});
  const expected=expectedIds_();
  const valid=students.length===42&&students.every((s,i)=>String(s.id||'').trim()===expected[i]&&String(s.name||'').trim());
  if(!valid){const r=restoreMasterStudents_();return getStudents_WithoutRestore_(r.count);}
  return{ok:true,count:42,students,source:'HOC_SINH',startRow:2,endRow:43,version:CONFIG.VERSION};
}

function getStudents_WithoutRestore_(restoredCount){
  const sh=prepareStudentSheet_(getSpreadsheet_()),headers=CONFIG.HEADERS.HOC_SINH;
  const values=sh.getRange(2,1,42,headers.length).getValues();
  const students=values.map(r=>{const o={};headers.forEach((h,i)=>o[h]=r[i]);return o});
  return{ok:true,count:students.length,students,source:'MASTER_ROSTER',restoredCount,restored:true,startRow:2,endRow:43,version:CONFIG.VERSION};
}

function log_(action,sheet,recordId,message){try{ensureTab_(getSpreadsheet_(),'NHAT_KY').appendRow([new Date(),action,sheet,recordId,message])}catch(_) {}}
function json_(obj){return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON)}
