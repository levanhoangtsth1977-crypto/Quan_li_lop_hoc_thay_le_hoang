/**
 * QUẢN LÝ LỚP HỌC THẦY LÊ HOÀNG
 * GOOGLE SHEETS SYNC API — MASTER 1.2
 *
 * HOC_SINH: row 1 = header, row 2+ = student data.
 * Các SHEET khác giữ nguyên cấu trúc riêng.
 */

const CONFIG = Object.freeze({
  SPREADSHEET_ID: '174xQ29phs-Or7OOEKOM0IHylFJXg5SsqzOC27x7K3Wg',
  SCHOOL_YEAR: '2026–2027',
  CLASS_NAME: '5C',
  STUDENT_START_ROW: 2,
  TABS: ['HOC_SINH','DIEM_DANH','VI_PHAM','KHEN_THUONG','HOC_TAP','TIEN_BO','NHAN_XET','LINK_HOC_SINH','CAU_HINH','NHAT_KY'],
  HEADERS: {
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

function getSpreadsheet_(){return SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);}

function setupSheet(){
  const ss=getSpreadsheet_();
  CONFIG.TABS.forEach(name=>ensureTab_(ss,name));
  writeConfig_(ss);
  log_('SETUP','CAU_HINH','','Đã kiểm tra cấu trúc 10 tab dữ liệu.');
  return 'OK';
}

function ensureTab_(ss,name){
  let sh=ss.getSheetByName(name);
  if(!sh) sh=ss.insertSheet(name);
  const headers=CONFIG.HEADERS[name]||[];
  if(headers.length){
    const lastColumn=sh.getLastColumn();
    const current=lastColumn?sh.getRange(1,1,1,lastColumn).getValues()[0].map(v=>String(v||'').trim()):[];
    if(!current.length||current.every(v=>!v)) sh.getRange(1,1,1,headers.length).setValues([headers]);
    sh.setFrozenRows(1);
    sh.getRange(1,1,1,headers.length).setFontWeight('bold');
  }
  return sh;
}

function writeConfig_(ss){
  const sh=ensureTab_(ss,'CAU_HINH');
  const rows=[['SPREADSHEET_ID',CONFIG.SPREADSHEET_ID,new Date()],['LOP',CONFIG.CLASS_NAME,new Date()],['NAM_HOC',CONFIG.SCHOOL_YEAR,new Date()],['SYNC_VERSION','MASTER-1.2',new Date()]];
  if(sh.getLastRow()>1) sh.getRange(2,1,sh.getLastRow()-1,3).clearContent();
  sh.getRange(2,1,rows.length,3).setValues(rows);
}

function doGet(e){
  const action=String(e?.parameter?.action||'ping').toLowerCase();
  if(action==='ping') return json_({ok:true,service:'LE_HOANG_CLASSROOM_SYNC',version:'1.2'});
  if(action==='setup') return json_({ok:true,message:setupSheet()});
  return json_({ok:false,error:'Unknown action'});
}

function doPost(e){
  const lock=LockService.getScriptLock();
  try{
    lock.waitLock(30000);
    const body=parseBody_(e);
    const action=String(body.action||'').toLowerCase();
    if(action==='sync_students') return json_(syncStudents_(Array.isArray(body.students)?body.students:[]));
    return json_({ok:false,error:'Unknown action'});
  }catch(err){
    log_('ERROR','SYSTEM','',String(err.stack||err));
    return json_({ok:false,error:String(err.message||err)});
  }finally{try{lock.releaseLock();}catch(_) {}}
}

function parseBody_(e){
  if(!e) return {};
  if(e.postData&&e.postData.contents){try{return JSON.parse(e.postData.contents);}catch(_) {}}
  const p=e.parameter||{};
  if(p.payload){try{return JSON.parse(p.payload);}catch(_) {}}
  return p;
}

function syncStudents_(students){
  const ss=getSpreadsheet_();
  const sh=ensureTab_(ss,'HOC_SINH');
  const links=ensureTab_(ss,'LINK_HOC_SINH');
  const now=new Date();
  const clean=students.map((s,i)=>({
    id:String(s.id||s.studentId||('HS'+String(i+1).padStart(3,'0'))).trim(),
    name:String(s.name||s.hoTen||'').trim(),
    gender:String(s.gender||s.gioiTinh||'').trim(),
    birthDate:String(s.birthDate||s.ngaySinh||'').trim(),
    status:String(s.status||'active').trim(),
    parentName:String(s.parentName||s.phuHuynh||'').trim(),
    phone:String(s.phone||s.dienThoai||'').trim(),
    address:String(s.address||s.diaChi||'').trim(),
    note:String(s.note||s.ghiChu||'').trim(),
    shareEnabled:s.shareEnabled===false?false:true,
    createdAt:s.createdAt||now,
    updatedAt:now
  })).filter(s=>s.name);
  const seen=new Set();
  const unique=clean.filter(s=>{if(seen.has(s.id))return false;seen.add(s.id);return true;});
  const rows=unique.map(s=>[s.id,s.name,s.gender,s.birthDate,s.status,s.parentName,s.phone,s.address,s.note,s.shareEnabled,s.createdAt,s.updatedAt]);
  replaceStudentData_(sh,rows,CONFIG.HEADERS.HOC_SINH);
  const linkRows=unique.map(s=>[s.id,s.id,s.name,'?student='+encodeURIComponent(s.id),s.shareEnabled,s.createdAt,now]);
  replaceData_(links,linkRows,CONFIG.HEADERS.LINK_HOC_SINH);
  log_('SYNC_STUDENTS','HOC_SINH','','Đồng bộ '+unique.length+' học sinh từ dòng 2; cập nhật LINK_HOC_SINH.');
  return {ok:true,count:unique.length,links:linkRows.length,duplicateIds:clean.length-unique.length,startRow:CONFIG.STUDENT_START_ROW};
}

function replaceStudentData_(sh,rows,headers){
  const start=CONFIG.STUDENT_START_ROW;
  const width=headers.length;
  const last=sh.getLastRow();
  if(last>=start) sh.getRange(start,1,last-start+1,width).clearContent();
  if(rows.length) sh.getRange(start,1,rows.length,width).setValues(rows);
  if(width) sh.autoResizeColumns(1,width);
}

function replaceData_(sh,rows,headers){
  const width=headers.length;
  const last=sh.getLastRow();
  if(last>1) sh.getRange(2,1,last-1,width).clearContent();
  if(rows.length) sh.getRange(2,1,rows.length,width).setValues(rows);
  if(width) sh.autoResizeColumns(1,width);
}

function log_(action,sheet,recordId,message){
  try{
    const sh=ensureTab_(getSpreadsheet_(),'NHAT_KY');
    const row=Math.max(2,sh.getLastRow()+1);
    sh.getRange(row,1,1,5).setValues([[new Date(),action,sheet,recordId,message]]);
  }catch(_){}
}

function json_(obj){return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);}
