/**
 * QUẢN LÝ LỚP HỌC THẦY LÊ HOÀNG
 * GOOGLE SHEETS SYNC API — SAFE STUDENT DATA 3.0
 *
 * NGUYÊN TẮC:
 * - Không ép HOC_SINH phải đủ 42 học sinh.
 * - Không tự khôi phục Master Roster khi dữ liệu Google thiếu dòng.
 * - Không xóa, dồn, đổi ID, đổi thứ tự hoặc sửa nội dung học sinh khi GET.
 * - GET chỉ đọc các bản ghi có ID + tên hợp lệ; bỏ qua dòng trống.
 * - POST sync chỉ cập nhật/upsert đúng các ID được gửi; không xóa bản ghi khác.
 */
const CONFIG=Object.freeze({
  SPREADSHEET_ID:'174xQ29phs-Or7OOEKOM0IHylFJXg5SsqzOC27x7K3Wg',
  SCHOOL_YEAR:'2026–2027',CLASS_NAME:'5C',EXPECTED_STUDENTS:42,
  MASTER_ROSTER_URL:'https://raw.githubusercontent.com/levanhoangtsth1977-crypto/Quan_li_lop_hoc_thay_le_hoang/master/DANH_SACH_HOC_SINH_5C_2026_2027.json',
  VERSION:'SAFE-STUDENT-3.0',
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
function json_(o){return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON)}
function log_(action,sheet,recordId,message){try{const sh=getSpreadsheet_().getSheetByName('NHAT_KY')||getSpreadsheet_().insertSheet('NHAT_KY');if(sh.getLastRow()===0)sh.getRange(1,1,1,5).setValues([CONFIG.HEADERS.NHAT_KY]);sh.appendRow([new Date(),action,sheet,recordId,message])}catch(_){}}
function headerOk_(sh,headers){if(sh.getMaxColumns()<headers.length)return false;const a=sh.getRange(1,1,1,headers.length).getValues()[0].map(v=>String(v||'').trim());return headers.every((h,i)=>a[i]===h)}
function ensureTab_(ss,name){let sh=ss.getSheetByName(name);if(!sh)sh=ss.insertSheet(name);const h=CONFIG.HEADERS[name]||[];if(h.length&&sh.getMaxColumns()<h.length)sh.insertColumnsAfter(sh.getMaxColumns(),h.length-sh.getMaxColumns());if(h.length&&sh.getLastRow()===0)sh.getRange(1,1,1,h.length).setValues([h]);if(h.length)sh.setFrozenRows(1);return sh}
function setupSheet(){const ss=getSpreadsheet_();CONFIG.TABS.forEach(n=>ensureTab_(ss,n));const sh=ss.getSheetByName('CAU_HINH');const rows=[['SPREADSHEET_ID',CONFIG.SPREADSHEET_ID,new Date()],['LOP',CONFIG.CLASS_NAME,new Date()],['NAM_HOC',CONFIG.SCHOOL_YEAR,new Date()],['SYNC_VERSION',CONFIG.VERSION,new Date()],['EXPECTED_STUDENTS',CONFIG.EXPECTED_STUDENTS,new Date()],['MASTER_ROSTER',CONFIG.MASTER_ROSTER_URL,new Date()]];if(sh.getLastRow()>1)sh.getRange(2,1,sh.getLastRow()-1,3).clearContent();sh.getRange(2,1,rows.length,3).setValues(rows);return'OK'}
function parseBody_(e){if(!e)return{};if(e.postData&&e.postData.contents){try{return JSON.parse(e.postData.contents)}catch(_){}}const p=e.parameter||{};if(p.payload){try{return JSON.parse(p.payload)}catch(_){}}return p}
function normalize_(r,row){return{id:String(r[0]??'').trim(),name:String(r[1]??'').trim(),gender:String(r[2]??'').trim(),birthDate:String(r[3]??'').trim(),status:String(r[4]??'').trim(),parentName:String(r[5]??'').trim(),phone:String(r[6]??'').trim(),address:String(r[7]??'').trim(),note:String(r[8]??'').trim(),shareEnabled:r[9]===false||String(r[9]).toUpperCase()==='FALSE'?false:true,createdAt:r[10]||'',updatedAt:r[11]||'',sheetRow:row}}
function readStudents_(){
  const sh=getSpreadsheet_().getSheetByName('HOC_SINH');
  if(!sh)throw new Error('Không tìm thấy SHEET HOC_SINH.');
  if(!headerOk_(sh,CONFIG.HEADERS.HOC_SINH))throw new Error('Header HOC_SINH không đúng schema A1:L1. API không sửa dữ liệu.');
  const last=sh.getLastRow();
  if(last<2)return{students:[],count:0,totalRows:0,source:'HOC_SINH',version:CONFIG.VERSION};
  const width=CONFIG.HEADERS.HOC_SINH.length;
  const values=sh.getRange(2,1,last-1,width).getValues();
  const students=[];
  values.forEach((r,i)=>{const s=normalize_(r,i+2);if(s.id&&s.name)students.push(s)});
  return{students,count:students.length,totalRows:values.length,source:'HOC_SINH',version:CONFIG.VERSION};
}
function doGet(e){const action=String((e&&e.parameter&&e.parameter.action)||'ping').toLowerCase();try{if(action==='ping')return json_({ok:true,service:'LE_HOANG_CLASSROOM_SYNC',version:CONFIG.VERSION,policy:'NO_AUTO_RESTORE'});if(action==='setup')return json_({ok:true,message:setupSheet()});if(action==='get_students'||action==='getstudents')return json_(Object.assign({ok:true},readStudents_()));if(action==='restore_master_students'||action==='repair_students'||action==='compact_students')return json_({ok:false,blocked:true,error:'Safe mode: không được tự ý khôi phục/xóa/dồn/sắp xếp dữ liệu học sinh. Hãy thao tác thủ công nếu cần.'});return json_({ok:false,error:'Unknown action'})}catch(err){log_('ERROR','SYSTEM','',String(err.stack||err));return json_({ok:false,error:String(err.message||err),version:CONFIG.VERSION})}}
function doPost(e){const lock=LockService.getScriptLock();try{lock.waitLock(30000);const body=parseBody_(e),action=String(body.action||'').toLowerCase();if(action==='sync_students')return json_(syncStudentsSafe_(Array.isArray(body.students)?body.students:[]));if(action==='setup')return json_({ok:true,message:setupSheet()});if(action==='restore_master_students'||action==='repair_students'||action==='compact_students')return json_({ok:false,blocked:true,error:'Safe mode: thao tác phục hồi hàng loạt đã bị khóa để bảo vệ dữ liệu học sinh.'});return json_({ok:false,error:'Unknown action'})}catch(err){log_('ERROR','SYSTEM','',String(err.stack||err));return json_({ok:false,error:String(err.message||err),version:CONFIG.VERSION})}finally{try{lock.releaseLock()}catch(_){}}}
function syncStudentsSafe_(incoming){
  if(!Array.isArray(incoming)||!incoming.length)throw new Error('Không có học sinh hợp lệ để đồng bộ.');
  const sh=getSpreadsheet_().getSheetByName('HOC_SINH');if(!sh)throw new Error('Không tìm thấy HOC_SINH.');
  if(!headerOk_(sh,CONFIG.HEADERS.HOC_SINH))throw new Error('Header HOC_SINH không đúng schema. API không sửa dữ liệu.');
  const last=Math.max(sh.getLastRow(),1),width=CONFIG.HEADERS.HOC_SINH.length;
  const values=last>=2?sh.getRange(2,1,last-1,width).getValues():[];
  const rowById=new Map();values.forEach((r,i)=>{const id=String(r[0]??'').trim();if(id&&!rowById.has(id))rowById.set(id,i+2)});
  const updated=[];const skipped=[];const now=new Date();
  incoming.forEach((s)=>{
    const id=String(s&& (s.id||s.studentId||s.studentCode)||'').trim();const name=String(s&&(s.name||s.studentName)||'').trim();
    if(!id||!name){skipped.push({id,name,reason:'missing-id-or-name'});return}
    if(!rowById.has(id)){skipped.push({id,name,reason:'id-not-found-no-new-student-created'});return}
    const row=rowById.get(id);const old=sh.getRange(row,1,1,width).getValues()[0];
    const out=[id,name,String(s.gender??old[2]??''),String(s.birthDate??old[3]??''),String(s.status??old[4]??'active'),String(s.parentName??old[5]??''),String(s.phone??old[6]??''),String(s.address??old[7]??''),String(s.note??old[8]??''),s.shareEnabled===false?false:(s.shareEnabled===true?true:(old[9]===false?false:true)),old[10]||now,now];
    sh.getRange(row,1,1,width).setValues([out]);updated.push(id);
  });
  SpreadsheetApp.flush();log_('SYNC_STUDENTS_SAFE','HOC_SINH','',`Cập nhật ${updated.length}; bỏ qua ${skipped.length}; không tạo/xóa học sinh.`);
  return{ok:true,count:updated.length,updated,skipped,created:0,deleted:0,source:'SAFE_UPSERT',version:CONFIG.VERSION};
}
