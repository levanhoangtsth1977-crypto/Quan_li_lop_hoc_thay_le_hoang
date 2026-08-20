/**
 * QUẢN LÝ LỚP HỌC THẦY LÊ HOÀNG
 * GOOGLE SHEETS SYNC API — MASTER 1.6
 *
 * AN TOÀN:
 * - Chỉ HOC_SINH được làm sạch/ghi lại từ dòng 2.
 * - Các SHEET nghiệp vụ khác giữ nguyên cấu trúc và dữ liệu.
 * - Master Roster 42 HS là nguồn chuẩn.
 * - ID ổn định HS01 -> HS42 khi nguồn chưa có studentCode.
 * - Không ghi nếu nguồn không đủ chính xác 42 HS.
 * - Ghi một mảng duy nhất để tuyệt đối không tạo dòng trống.
 * - Chống trùng theo ID; không loại hai học sinh chỉ vì trùng tên.
 */

const CONFIG = Object.freeze({
  SPREADSHEET_ID: '174xQ29phs-Or7OOEKOM0IHylFJXg5SsqzOC27x7K3Wg',
  SCHOOL_YEAR: '2026–2027', CLASS_NAME: '5C', EXPECTED_STUDENTS: 42,
  MASTER_ROSTER_URL: 'https://raw.githubusercontent.com/levanhoangtsth1977-crypto/Quan_li_lop_hoc_thay_le_hoang/master/DANH_SACH_HOC_SINH_5C_2026_2027.json',
  VERSION: 'MASTER-1.6',
  TABS: ['HOC_SINH','DIEM_DANH','VI_PHAM','KHEN_THUONG','HOC_TAP','TIEN_BO','NHAN_XET','LINK_HOC_SINH','CAU_HINH','NHAT_KY'],
  HEADERS: {
    HOC_SINH: ['id','name','gender','birthDate','status','parentName','phone','address','note','shareEnabled','createdAt','updatedAt'],
    DIEM_DANH: ['id','studentId','date','status','note','createdAt','updatedAt'],
    VI_PHAM: ['id','studentId','date','type','level','status','action','note','createdAt','updatedAt'],
    KHEN_THUONG: ['id','studentId','date','type','formType','note','createdAt','updatedAt'],
    HOC_TAP: ['id','studentId','date','subject','result','level','note','createdAt','updatedAt'],
    TIEN_BO: ['id','studentId','date','category','level','score','note','createdAt','updatedAt'],
    NHAN_XET: ['id','studentId','date','subject','content','level','createdAt','updatedAt'],
    LINK_HOC_SINH: ['studentId','studentCode','studentName','studentUrl','enabled','createdAt','updatedAt'],
    CAU_HINH: ['Key','Value','UpdatedAt'], NHAT_KY: ['timestamp','action','sheet','recordId','message']
  }
});

function getSpreadsheet_(){ return SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID); }
function ensureTab_(ss,name){
  let sh=ss.getSheetByName(name); if(!sh) sh=ss.insertSheet(name);
  const h=CONFIG.HEADERS[name]||[];
  if(h.length){ const width=Math.max(sh.getLastColumn(),h.length); const first=sh.getRange(1,1,1,width).getValues()[0].map(v=>String(v||'').trim()); if(!first.slice(0,h.length).some(Boolean)) sh.getRange(1,1,1,h.length).setValues([h]); sh.setFrozenRows(1); }
  return sh;
}
function setupSheet(){ const ss=getSpreadsheet_(); CONFIG.TABS.forEach(n=>ensureTab_(ss,n)); writeConfig_(ss); log_('SETUP','CAU_HINH','','Đã kiểm tra cấu trúc 10 SHEET.'); return 'OK'; }
function writeConfig_(ss){ const sh=ensureTab_(ss,'CAU_HINH'); const rows=[['SPREADSHEET_ID',CONFIG.SPREADSHEET_ID,new Date()],['LOP',CONFIG.CLASS_NAME,new Date()],['NAM_HOC',CONFIG.SCHOOL_YEAR,new Date()],['SYNC_VERSION',CONFIG.VERSION,new Date()],['EXPECTED_STUDENTS',CONFIG.EXPECTED_STUDENTS,new Date()],['MASTER_ROSTER',CONFIG.MASTER_ROSTER_URL,new Date()]]; if(sh.getLastRow()>1) sh.getRange(2,1,sh.getLastRow()-1,3).clearContent(); sh.getRange(2,1,rows.length,3).setValues(rows); }

function doGet(e){ const action=String((e&&e.parameter&&e.parameter.action)||'ping').toLowerCase(); try{ if(action==='ping') return json_({ok:true,service:'LE_HOANG_CLASSROOM_SYNC',version:CONFIG.VERSION}); if(action==='setup') return json_({ok:true,message:setupSheet()}); if(action==='restore_master_students'||action==='repair_students') return json_(restoreMasterStudents_()); if(action==='get_students') return json_(getStudents_()); return json_({ok:false,error:'Unknown action'}); }catch(err){ log_('ERROR','SYSTEM','',String(err.stack||err)); return json_({ok:false,error:String(err.message||err)}); } }
function doPost(e){ const lock=LockService.getScriptLock(); try{ lock.waitLock(30000); const body=parseBody_(e); const action=String(body.action||'').toLowerCase(); if(action==='sync_students') return json_(syncStudents_(Array.isArray(body.students)?body.students:[])); if(action==='restore_master_students'||action==='repair_students') return json_(restoreMasterStudents_()); if(action==='setup') return json_({ok:true,message:setupSheet()}); return json_({ok:false,error:'Unknown action'}); }catch(err){ log_('ERROR','SYSTEM','',String(err.stack||err)); return json_({ok:false,error:String(err.message||err)}); }finally{ try{lock.releaseLock();}catch(_){} } }
function parseBody_(e){ if(!e) return {}; if(e.postData&&e.postData.contents){try{return JSON.parse(e.postData.contents);}catch(_){}} const p=e.parameter||{}; if(p.payload){try{return JSON.parse(p.payload);}catch(_){}} return p; }

function normalizeStudent_(s,index,now){ const stt=Number(s.stt)||index+1; const id=String(s.studentCode||s.id||'').trim()||'HS'+String(stt).padStart(2,'0'); return {id:id,name:String(s.name||s.hoTen||s.studentName||'').trim(),gender:String(s.gender||s.gioiTinh||'').trim(),birthDate:String(s.birthDate||s.ngaySinh||'').trim(),status:String(s.status||'active').trim()||'active',parentName:String(s.parentName||s.phuHuynh||'').trim(),phone:String(s.phone||s.dienThoai||'').trim(),address:String(s.address||s.diaChi||'').trim(),note:String(s.note||s.ghiChu||'').trim(),shareEnabled:s.shareEnabled===false?false:true,createdAt:s.createdAt||now,updatedAt:now,stt:stt}; }
function dedupeStudents_(students){ const byId=new Map(),duplicates=[]; students.forEach(s=>{ if(!s||!s.name)return; const id=String(s.id||'').trim(); if(!id) throw new Error('Học sinh không có ID: '+s.name); if(byId.has(id)){duplicates.push({type:'ID',id:id,name:s.name});return;} byId.set(id,s); }); return {unique:Array.from(byId.values()).sort((a,b)=>a.stt-b.stt),duplicates:duplicates}; }
function validateMaster_(students){ if(!Array.isArray(students)||students.length!==CONFIG.EXPECTED_STUDENTS) throw new Error('Master Roster không hợp lệ: '+(students?students.length:0)+'/'+CONFIG.EXPECTED_STUDENTS+' học sinh.'); const seen=new Set(); students.forEach((s,i)=>{const stt=Number(s.stt)||i+1; if(stt<1||stt>CONFIG.EXPECTED_STUDENTS||seen.has(stt)) throw new Error('STT Master Roster lỗi tại vị trí '+(i+1)+': '+stt); seen.add(stt); if(!String(s.name||'').trim()) throw new Error('Master Roster có học sinh rỗng tại STT '+stt);}); for(let i=1;i<=CONFIG.EXPECTED_STUDENTS;i++) if(!seen.has(i)) throw new Error('Master Roster thiếu STT '+i); }

function restoreMasterStudents_(){
  const response=UrlFetchApp.fetch(CONFIG.MASTER_ROSTER_URL,{muteHttpExceptions:true,followRedirects:true});
  if(response.getResponseCode()!==200) throw new Error('Không tải được Master Roster: HTTP '+response.getResponseCode());
  const payload=JSON.parse(response.getContentText('UTF-8')); const source=Array.isArray(payload.students)?payload.students.slice():[]; validateMaster_(source);
  const now=new Date(); const normalized=source.sort((a,b)=>(Number(a.stt)||0)-(Number(b.stt)||0)).map((s,i)=>normalizeStudent_(s,i,now)); const result=dedupeStudents_(normalized);
  if(result.unique.length!==CONFIG.EXPECTED_STUDENTS) throw new Error('Sau chống trùng còn '+result.unique.length+'/'+CONFIG.EXPECTED_STUDENTS+'. Không ghi dữ liệu để tránh mất HS.');
  const expected=Array.from({length:CONFIG.EXPECTED_STUDENTS},(_,i)=>'HS'+String(i+1).padStart(2,'0')); const ids=result.unique.map(s=>s.id); if(ids.some((id,i)=>id!==expected[i])) throw new Error('ID Master không liên tục HS01 → HS42. Không ghi dữ liệu.');
  return writeStudents_(result.unique,true,result.duplicates);
}
function syncStudents_(students){ const now=new Date(); const clean=(Array.isArray(students)?students:[]).map((s,i)=>normalizeStudent_(s,i,now)).filter(s=>s.name); if(!clean.length) throw new Error('Không có học sinh hợp lệ để ghi vào HOC_SINH.'); const result=dedupeStudents_(clean); if(result.unique.length!==CONFIG.EXPECTED_STUDENTS) throw new Error('Nguồn đồng bộ phải có đúng '+CONFIG.EXPECTED_STUDENTS+' học sinh; nhận được '+result.unique.length+'. Không ghi dữ liệu.'); return writeStudents_(result.unique,false,result.duplicates); }

function clearDataRows_(sh,width){ const last=sh.getLastRow(); if(last>1) sh.getRange(2,1,last-1,width).clearContent(); }
function writeContiguous_(sh,rows,headers){ const width=headers.length; clearDataRows_(sh,width); if(rows.length) sh.getRange(2,1,rows.length,width).setValues(rows); SpreadsheetApp.flush(); }
function writeStudents_(unique,fromMaster,duplicates){
  const ss=getSpreadsheet_(), sh=ensureTab_(ss,'HOC_SINH'), links=ensureTab_(ss,'LINK_HOC_SINH'); if(unique.length!==CONFIG.EXPECTED_STUDENTS) throw new Error('Từ chối ghi: số HS không bằng 42.');
  const rows=unique.map(s=>[s.id,s.name,s.gender,s.birthDate,s.status,s.parentName,s.phone,s.address,s.note,s.shareEnabled,s.createdAt,s.updatedAt]);
  const linkRows=unique.map(s=>[s.id,s.id,s.name,'?student='+encodeURIComponent(s.id),s.shareEnabled,s.createdAt,s.updatedAt]);
  // Chỉ HOC_SINH và LINK_HOC_SINH được làm sạch. Các SHEET nghiệp vụ khác không bị đụng tới.
  writeContiguous_(sh,rows,CONFIG.HEADERS.HOC_SINH); writeContiguous_(links,linkRows,CONFIG.HEADERS.LINK_HOC_SINH);
  const dupCount=(duplicates||[]).length; log_(fromMaster?'RESTORE_MASTER_STUDENTS':'SYNC_STUDENTS','HOC_SINH','', 'Đã ghi liên tục '+unique.length+' HS từ dòng 2; loại '+dupCount+' bản ghi trùng; giữ nguyên các SHEET nghiệp vụ khác.');
  return {ok:true,count:unique.length,links:linkRows.length,duplicateCount:dupCount,duplicates:duplicates||[],source:fromMaster?'MASTER_ROSTER':'CLIENT',targetSheet:'HOC_SINH',startRow:2,endRow:1+unique.length,expected:CONFIG.EXPECTED_STUDENTS,version:CONFIG.VERSION};
}

function getStudents_(){ const sh=ensureTab_(getSpreadsheet_(),'HOC_SINH'), headers=CONFIG.HEADERS.HOC_SINH, last=sh.getLastRow(); if(last<2){const restored=restoreMasterStudents_();return getStudents_WithoutRestore_(restored.count);} const values=sh.getRange(2,1,last-1,headers.length).getValues(); const students=values.filter(r=>String(r[1]||'').trim()).map(r=>{const o={};headers.forEach((h,i)=>o[h]=r[i]);return o;}); if(students.length!==CONFIG.EXPECTED_STUDENTS){const restored=restoreMasterStudents_();return getStudents_WithoutRestore_(restored.count);} return {ok:true,count:students.length,students:students,source:'HOC_SINH'}; }
function getStudents_WithoutRestore_(restoredCount){ const sh=ensureTab_(getSpreadsheet_(),'HOC_SINH'),headers=CONFIG.HEADERS.HOC_SINH,last=sh.getLastRow(),values=last<2?[]:sh.getRange(2,1,last-1,headers.length).getValues(); const students=values.filter(r=>String(r[1]||'').trim()).map(r=>{const o={};headers.forEach((h,i)=>o[h]=r[i]);return o;}); return {ok:true,count:students.length,students:students,source:'MASTER_ROSTER',restoredCount:restoredCount,restored:true}; }
function log_(action,sheet,recordId,message){ try{ensureTab_(getSpreadsheet_(),'NHAT_KY').appendRow([new Date(),action,sheet,recordId,message]);}catch(_){} }
function json_(obj){ return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON); }
