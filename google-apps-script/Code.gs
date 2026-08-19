/**
 * QUẢN LÝ LỚP HỌC THẦY LÊ HOÀNG
 * GOOGLE SHEETS SYNC API — MASTER 1.0
 *
 * Spreadsheet: 174xQ29phs-Or7OOEKOM0IHylFJXg5SsqzOC27x7K3Wg
 *
 * Mục tiêu:
 * - Khởi tạo/chuẩn hóa 10 tab dữ liệu.
 * - Nhận danh sách học sinh từ website và ghi vào HOC_SINH.
 * - Tạo LINK_HOC_SINH tương ứng, không trùng ID.
 * - Không xóa dữ liệu nghiệp vụ của các tab khác.
 * - Có khóa đồng bộ để tránh ghi đồng thời.
 *
 * CÁCH DÙNG:
 * 1. Mở Google Sheet đích.
 * 2. Extensions → Apps Script.
 * 3. Dán toàn bộ file này vào Code.gs.
 * 4. Chạy setupSheet() một lần và cấp quyền.
 * 5. Deploy → New deployment → Web app.
 *    Execute as: Me
 *    Who has access: Anyone
 * 6. Lấy Web app URL đưa vào cấu hình WEBSITE.
 */

const CONFIG = Object.freeze({
  SPREADSHEET_ID: '174xQ29phs-Or7OOEKOM0IHylFJXg5SsqzOC27x7K3Wg',
  SCHOOL_YEAR: '2026–2027',
  CLASS_NAME: '5C',
  TABS: [
    'HOC_SINH', 'DIEM_DANH', 'VI_PHAM', 'KHEN_THUONG',
    'HOC_TAP', 'TIEN_BO', 'NHAN_XET', 'LINK_HOC_SINH',
    'CAU_HINH', 'NHAT_KY'
  ],
  HEADERS: {
    HOC_SINH: ['STT','ID','HoTen','GioiTinh','NgaySinh','Lop','NamHoc','PhuHuynh','DienThoai','DiaChi','TrangThai','GhiChu'],
    LINK_HOC_SINH: ['STT','StudentID','HoTen','Lop','NamHoc','ProfileURL','LearningURL','AttendanceURL','ViolationsURL','RewardsURL','ProgressURL','CommentsURL','UpdatedAt'],
    DIEM_DANH: ['STT','StudentID','HoTen','Ngay','TrangThai','GhiChu','UpdatedAt'],
    VI_PHAM: ['STT','StudentID','HoTen','Ngay','Loai','NoiDung','MucDo','GhiChu','UpdatedAt'],
    KHEN_THUONG: ['STT','StudentID','HoTen','Ngay','Loai','NoiDung','GhiChu','UpdatedAt'],
    HOC_TAP: ['STT','StudentID','HoTen','Mon','Diem','KetQua','GhiChu','UpdatedAt'],
    TIEN_BO: ['STT','StudentID','HoTen','Ngay','NoiDung','MucDo','GhiChu','UpdatedAt'],
    NHAN_XET: ['STT','StudentID','HoTen','Mon','NhanXet','Ngay','UpdatedAt'],
    CAU_HINH: ['Key','Value','UpdatedAt'],
    NHAT_KY: ['STT','Action','User','Timestamp','Details']
  }
});

function getSpreadsheet_() {
  return SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
}

function setupSheet() {
  const ss = getSpreadsheet_();
  CONFIG.TABS.forEach(name => ensureTab_(ss, name));
  writeConfig_(ss);
  log_('SETUP', 'system', 'Đã chuẩn hóa 10 tab dữ liệu.');
  return 'OK';
}

function ensureTab_(ss, name) {
  let sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  const headers = CONFIG.HEADERS[name] || [];
  if (headers.length) {
    const current = sh.getLastColumn() ? sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0] : [];
    const same = headers.length === current.length && headers.every((v,i) => String(current[i] || '').trim() === v);
    if (!same) {
      sh.getRange(1,1,1,headers.length).setValues([headers]);
    }
    sh.setFrozenRows(1);
    sh.getRange(1,1,1,headers.length).setFontWeight('bold');
    sh.autoResizeColumns(1, headers.length);
  }
  return sh;
}

function writeConfig_(ss) {
  const sh = ensureTab_(ss, 'CAU_HINH');
  const rows = [
    ['SPREADSHEET_ID', CONFIG.SPREADSHEET_ID, new Date()],
    ['LOP', CONFIG.CLASS_NAME, new Date()],
    ['NAM_HOC', CONFIG.SCHOOL_YEAR, new Date()],
    ['SYNC_VERSION', 'MASTER-1.0', new Date()]
  ];
  if (sh.getLastRow() > 1) sh.getRange(2,1,sh.getLastRow()-1,3).clearContent();
  sh.getRange(2,1,rows.length,3).setValues(rows);
}

function doGet(e) {
  const action = String(e?.parameter?.action || 'ping').toLowerCase();
  if (action === 'ping') return json_({ok:true, service:'LE_HOANG_CLASSROOM_SYNC', version:'1.0'});
  if (action === 'setup') return json_({ok:true, message:setupSheet()});
  return json_({ok:false,error:'Unknown action'});
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
    const body = parseBody_(e);
    const action = String(body.action || '').toLowerCase();

    if (action === 'sync_students') {
      const students = Array.isArray(body.students) ? body.students : [];
      const result = syncStudents_(students);
      return json_(result);
    }

    return json_({ok:false,error:'Unknown action'});
  } catch (err) {
    log_('ERROR', 'system', String(err.stack || err));
    return json_({ok:false,error:String(err.message || err)});
  } finally {
    try { lock.releaseLock(); } catch (_) {}
  }
}

function parseBody_(e) {
  if (!e) return {};
  if (e.postData && e.postData.contents) {
    try { return JSON.parse(e.postData.contents); } catch (_) {}
  }
  const p = e.parameter || {};
  if (p.payload) {
    try { return JSON.parse(p.payload); } catch (_) {}
  }
  return p;
}

function syncStudents_(students) {
  const ss = getSpreadsheet_();
  const sh = ensureTab_(ss, 'HOC_SINH');
  const links = ensureTab_(ss, 'LINK_HOC_SINH');

  const clean = students.map((s,i) => ({
    stt: Number(s.stt || i+1),
    id: String(s.id || s.studentId || ('HS'+String(i+1).padStart(3,'0'))).trim(),
    name: String(s.name || s.hoTen || '').trim(),
    gender: String(s.gender || s.gioiTinh || '').trim(),
    birthDate: String(s.birthDate || s.ngaySinh || '').trim(),
    className: String(s.className || CONFIG.CLASS_NAME).trim(),
    schoolYear: String(s.schoolYear || CONFIG.SCHOOL_YEAR).trim(),
    parentName: String(s.parentName || s.phuHuynh || '').trim(),
    phone: String(s.phone || s.dienThoai || '').trim(),
    address: String(s.address || s.diaChi || '').trim(),
    status: String(s.status || 'active').trim(),
    note: String(s.note || s.ghiChu || '').trim()
  })).filter(s => s.name);

  const seen = new Set();
  const unique = clean.filter(s => {
    if (seen.has(s.id)) return false;
    seen.add(s.id);
    return true;
  });

  const rows = unique.map(s => [s.stt,s.id,s.name,s.gender,s.birthDate,s.className,s.schoolYear,s.parentName,s.phone,s.address,s.status,s.note]);
  replaceData_(sh, rows, 12);

  const linkRows = unique.map((s,i) => {
    const q = encodeURIComponent(s.id);
    return [i+1,s.id,s.name,s.className,s.schoolYear,
      '?student='+q,
      '?page=learning&student='+q,
      '?page=attendance&student='+q,
      '?page=violations&student='+q,
      '?page=rewards&student='+q,
      '?page=progress&student='+q,
      '?page=comments&student='+q,
      new Date()];
  });
  replaceData_(links, linkRows, 13);

  log_('SYNC_STUDENTS', 'website', 'Đồng bộ '+unique.length+' học sinh; tạo '+linkRows.length+' link.');
  return {ok:true,count:unique.length,links:linkRows.length,duplicateIds:clean.length-unique.length};
}

function replaceData_(sh, rows, width) {
  const last = sh.getLastRow();
  if (last > 1) sh.getRange(2,1,last-1,width).clearContent();
  if (rows.length) sh.getRange(2,1,rows.length,width).setValues(rows);
  sh.autoResizeColumns(1,width);
}

function log_(action, user, details) {
  try {
    const sh = ensureTab_(getSpreadsheet_(), 'NHAT_KY');
    const row = Math.max(2, sh.getLastRow()+1);
    sh.getRange(row,1,1,5).setValues([[row-1,action,user,new Date(),details]]);
  } catch (_) {}
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
