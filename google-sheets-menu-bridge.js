/* QUẢN LÝ LỚP HỌC — GOOGLE SHEETS MENU BRIDGE 1.4
 * Spreadsheet: 174xQ29phs-Or7OOEKOM0IHylFJXg5SsqzOC27x7K3Wg
 *
 * Website vẫn mở module như hiện tại.
 * Mỗi module đọc dữ liệu từ đúng SHEET:
 * HOC_SINH, DIEM_DANH, VI_PHAM, KHEN_THUONG, HOC_TAP,
 * TIEN_BO, NHAN_XET, LINK_HOC_SINH, CAU_HINH, NHAT_KY.
 *
 * NGUYÊN TẮC AN TOÀN:
 * - Không đổi menu/UI hiện tại.
 * - Không xóa LocalStorage.
 * - Không thay đổi logic CRUD hiện có.
 * - Chỉ đồng bộ dữ liệu Google Sheets vào các mảng dữ liệu hiện hành
 *   trước khi module website render.
 * - Không dùng JSON dự phòng khi Google Sheets đã được cấu hình;
 *   nếu tab lỗi/không có dữ liệu thì giữ mảng tương ứng rỗng.
 */
(function(){
  'use strict';
  if(window.__LH_GOOGLE_MENU_BRIDGE__) return;
  window.__LH_GOOGLE_MENU_BRIDGE__=true;

  const SHEET_ID='174xQ29phs-Or7OOEKOM0IHylFJXg5SsqzOC27x7K3Wg';
  const SYNC_WEB_APP_URL='';
  const TAB_NAMES=['HOC_SINH','DIEM_DANH','VI_PHAM','KHEN_THUONG','HOC_TAP','TIEN_BO','NHAN_XET','LINK_HOC_SINH','CAU_HINH','NHAT_KY'];
  const KEY='QL_LOP_HOC_LE_HOANG_GOOGLE_SHEETS_2026_2027';

  const ALIASES={
    id:['id','studentid','studentcode','maso','mahs','mahocsinh','mahocsinhvien','mahsinh','mahochsinh'],
    studentId:['studentid','id','studentcode','maso','mahs','mahocsinh','mahochsinh'],
    name:['name','studentname','hoten','hovaten','hocsinh','ten','tenhocsinh'],
    date:['date','ngay','ngaythang','ngayghi','ngaydiemdanh','ngaythangnam'],
    status:['status','trangthai','tinhtrang','tinhtranghoc','trangthaihoc'],
    note:['note','ghichu','noidung','ghichu2'],
    type:['type','loai','loaiviolation','loaikhen'],
    subject:['mon','monhoc','subject'], score:['score','diem','diemso','diemtrungbinh'],
    result:['result','ketqua','xeploai'], url:['url','link','lienket','duongdan','linkhocsinh','linkhoclieu'],
    gender:['gender','gioitinh'], birthDate:['birthdate','ngaysinh','ngaysinhhocsinh'],
    parentName:['parentname','phuhuynh','tenphuhuynh','hotenphuhuynh'], phone:['phone','sdt','sodienthoai','dienthoai'],
    address:['address','diachi'], className:['class','lop','tenlop'], schoolYear:['schoolyear','namhoc']
  };

  function norm(v){return String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/Đ/g,'D').replace(/[^a-zA-Z0-9]+/g,'').toLowerCase();}
  function clean(v){return String(v??'').trim();}
  function headerMap(cols){
    const heads=cols.map(c=>norm(c.label||c.id||'')),out={};
    Object.keys(ALIASES).forEach(k=>{out[k]=-1;for(const a of ALIASES[k]){const i=heads.indexOf(norm(a));if(i>=0){out[k]=i;break;}}});
    return out;
  }
  function rowsToObjects(data,tab){
    if(!data||!data.table) throw new Error('Google Sheets không trả về dữ liệu bảng: '+tab);
    const cols=data.table.cols||[],rows=data.table.rows||[],map=headerMap(cols),labels=cols.map(c=>clean(c.label||c.id||''));
    const objects=rows.map(r=>{const cells=r.c||[],o={};labels.forEach((h,i)=>{if(h)o[h]=clean(cells[i]?.v);});Object.keys(map).forEach(k=>{const i=map[k];if(i>=0)o[k]=clean(cells[i]?.v);});return o;});
    return {objects,map,labels};
  }
  function validateTab(tab,map){
    const required={HOC_SINH:['id','name'],DIEM_DANH:['studentId','date'],VI_PHAM:['studentId'],KHEN_THUONG:['studentId'],HOC_TAP:['studentId'],TIEN_BO:['studentId'],NHAN_XET:['studentId'],LINK_HOC_SINH:['studentId'],CAU_HINH:[],NHAT_KY:[]}[tab]||[];
    const missing=required.filter(k=>map[k]===undefined||map[k]<0); if(missing.length) throw new Error(tab+' thiếu cột: '+missing.join(', '));
  }
  function fetchTab(tab){
    return new Promise((resolve,reject)=>{
      const cb='__LH_TAB_'+Date.now()+'_'+Math.random().toString(36).slice(2),s=document.createElement('script');
      const timer=setTimeout(()=>{cleanup();reject(new Error('Timeout: '+tab));},15000);
      function cleanup(){clearTimeout(timer);delete window[cb];s.remove();}
      window[cb]=data=>{try{const parsed=rowsToObjects(data,tab);validateTab(tab,parsed.map);cleanup();resolve(parsed);}catch(e){cleanup();reject(e);}};
      s.onerror=()=>{cleanup();reject(new Error('Không truy cập được tab '+tab));};
      s.src='https://docs.google.com/spreadsheets/d/'+SHEET_ID+'/gviz/tq?sheet='+encodeURIComponent(tab)+'&tqx='+encodeURIComponent('out:json;responseHandler:'+cb)+'&headers=1';
      document.head.appendChild(s);
    });
  }

  function normalizeRecord(o){return {id:o.id||'',studentId:o.studentId||o.id||'',name:o.name||'',date:o.date||'',status:o.status||'',note:o.note||'',type:o.type||'',subject:o.subject||'',score:o.score||'',result:o.result||'',url:o.url||'',raw:o};}

  function normalizeStatus(v){
    const s=norm(v);
    if(['present','comat','co mat','p'].includes(s)) return 'present';
    if(['excused','cophep','co phep','phep'].includes(s)) return 'excused';
    if(['absent','vang','vangmat','vang mat','khongphep','khong phep'].includes(s)) return 'absent';
    return clean(v)||'present';
  }

  function mapStudent(raw,index){
    const id=clean(raw.id||raw.studentId||raw.studentCode)||('HS'+String(index+1).padStart(3,'0'));
    return {id,studentCode:id,stt:Number(raw.stt||index+1),name:clean(raw.name),gender:clean(raw.gender),birthDate:clean(raw.birthDate),status:clean(raw.status)||'active',parentName:clean(raw.parentName),phone:clean(raw.phone),address:clean(raw.address),note:clean(raw.note),shareEnabled:true,className:clean(raw.className)||'5C',schoolYear:clean(raw.schoolYear)||'2026–2027'};
  }

  /* ============================================================
     SHEET → WEBSITE MODULE DATA ADAPTER
     ============================================================ */
  function applySheetDataToWebsiteModules(tabs){
    try{
      const mapStudents=(tabs.HOC_SINH||[]).map((r,i)=>mapStudent(r.raw||r,i)).filter(s=>s.name);
      const mapAttendance=(tabs.DIEM_DANH||[]).map((r,i)=>({
        id:clean(r.id)||('ATT_SHEET_'+i),studentId:clean(r.studentId),date:clean(r.date),status:normalizeStatus(r.status),note:clean(r.note)
      })).filter(r=>r.studentId);
      const mapViolations=(tabs.VI_PHAM||[]).map((r,i)=>({
        id:clean(r.id)||('VIO_SHEET_'+i),studentId:clean(r.studentId),date:clean(r.date),type:clean(r.type)||'other',level:clean(r.raw?.mucdo||r.raw?.MucDo||r.raw?.mucDo)||'light',status:clean(r.raw?.trangthai||r.raw?.TrangThai)||'monitoring',note:clean(r.note),action:clean(r.raw?.noidung||r.raw?.NoiDung)
      })).filter(r=>r.studentId);
      const mapRewards=(tabs.KHEN_THUONG||[]).map((r,i)=>({
        id:clean(r.id)||('REW_SHEET_'+i),studentId:clean(r.studentId),date:clean(r.date),type:clean(r.type)||'other',formType:'praise',note:clean(r.note)||clean(r.raw?.noidung||r.raw?.NoiDung)
      })).filter(r=>r.studentId);
      const mapLearning=(tabs.HOC_TAP||[]).map((r,i)=>({
        id:clean(r.id)||('LRN_SHEET_'+i),studentId:clean(r.studentId),date:clean(r.date)||new Date().toISOString().slice(0,10),subject:clean(r.subject),result:clean(r.result||r.score),level:clean(r.raw?.mucdo||r.raw?.MucDo||r.raw?.mucDo),note:clean(r.note)
      })).filter(r=>r.studentId);
      const mapProgress=(tabs.TIEN_BO||[]).map((r,i)=>({
        id:clean(r.id)||('PRO_SHEET_'+i),studentId:clean(r.studentId),date:clean(r.date),content:clean(r.raw?.noidung||r.raw?.NoiDung||r.note),level:clean(r.raw?.mucdo||r.raw?.MucDo||r.raw?.mucDo),note:clean(r.note)
      })).filter(r=>r.studentId);
      const mapComments=(tabs.NHAN_XET||[]).map((r,i)=>({
        id:clean(r.id)||('COM_SHEET_'+i),studentId:clean(r.studentId),date:clean(r.date),subject:clean(r.subject),comment:clean(r.raw?.nhanxet||r.raw?.NhanXet||r.note)
      })).filter(r=>r.studentId);

      /* Preserve existing array references used by data.js. */
      if(typeof students!=='undefined' && Array.isArray(students)){students.splice(0,students.length,...mapStudents);}
      if(typeof attendanceRecords!=='undefined' && Array.isArray(attendanceRecords)){attendanceRecords.splice(0,attendanceRecords.length,...mapAttendance);}
      if(typeof violationRecords!=='undefined' && Array.isArray(violationRecords)){violationRecords.splice(0,violationRecords.length,...mapViolations);}
      if(typeof rewardRecords!=='undefined' && Array.isArray(rewardRecords)){rewardRecords.splice(0,rewardRecords.length,...mapRewards);}
      if(typeof learningRecords!=='undefined' && Array.isArray(learningRecords)){learningRecords.splice(0,learningRecords.length,...mapLearning);}
      if(typeof progressRecords!=='undefined' && Array.isArray(progressRecords)){progressRecords.splice(0,progressRecords.length,...mapProgress);}
      if(typeof commentRecords!=='undefined' && Array.isArray(commentRecords)){commentRecords.splice(0,commentRecords.length,...mapComments);}

      if(typeof syncAppDataReferences==='function') syncAppDataReferences();

      window.GOOGLE_SHEET_MODULE_SOURCE={
        students:'HOC_SINH',attendance:'DIEM_DANH',violations:'VI_PHAM',rewards:'KHEN_THUONG',learning:'HOC_TAP',progress:'TIEN_BO',comments:'NHAN_XET',links:'LINK_HOC_SINH',config:'CAU_HINH',log:'NHAT_KY'
      };
      window.dispatchEvent(new CustomEvent('google-sheet-modules-ready',{detail:{sheetId:SHEET_ID,tabs:Object.keys(tabs)}}));
    }catch(e){console.error('[GOOGLE SHEETS MODULE ADAPTER]',e);}
  }

  function syncStudentsToGoogleSheet(studentsData){
    if(!SYNC_WEB_APP_URL){
      const msg='Chưa cấu hình Apps Script Web App URL; không giả mạo trạng thái đồng bộ.';
      if(typeof window.showToast==='function')window.showToast(msg,'warning');
      return Promise.resolve({ok:false,configured:false,error:msg});
    }
    const payload=JSON.stringify({action:'sync_students',students:studentsData});
    return new Promise(resolve=>{
      const frameName='lhSyncFrame_'+Date.now(),iframe=document.createElement('iframe'),form=document.createElement('form');
      iframe.name=frameName;iframe.style.display='none';document.body.appendChild(iframe);
      form.method='POST';form.action=SYNC_WEB_APP_URL;form.target=frameName;form.style.display='none';
      const input=document.createElement('input');input.type='hidden';input.name='payload';input.value=payload;form.appendChild(input);document.body.appendChild(form);
      let done=false;const finish=()=>{if(done)return;done=true;setTimeout(()=>{iframe.remove();form.remove();},1200);resolve({ok:true,submitted:true});};
      iframe.addEventListener('load',finish,{once:true});form.submit();setTimeout(finish,10000);
    });
  }

  async function loadAll(){
    const out={},errors=[],sources={};
    for(const tab of TAB_NAMES){try{const r=await fetchTab(tab);out[tab]=r.objects.map(normalizeRecord);sources[tab]='google-sheets';}catch(e){out[tab]=[];sources[tab]='unavailable';errors.push(tab+': '+e.message);}}

    /* IMPORTANT: website modules use Google Sheets as their source of truth. */
    window.GOOGLE_SHEETS_STUDENTS=(out.HOC_SINH||[]).map((r,i)=>mapStudent(r.raw||r,i)).filter(s=>s.name);

    const payload={version:'1.4.0',sheetId:SHEET_ID,loadedAt:new Date().toISOString(),tabs:out,sources,errors};
    try{localStorage.setItem(KEY,JSON.stringify(payload));}catch(e){console.warn('[GOOGLE MENU BRIDGE] localStorage:',e);}
    window.GOOGLE_SHEET_DATA=payload;
    window.GOOGLE_SHEET_CONFIG={sheetId:SHEET_ID,tabs:TAB_NAMES,key:KEY,errors,sources,studentCount:window.GOOGLE_SHEETS_STUDENTS.length,syncConfigured:Boolean(SYNC_WEB_APP_URL)};
    window.syncStudentsToGoogleSheet=()=>syncStudentsToGoogleSheet(window.GOOGLE_SHEETS_STUDENTS);

    applySheetDataToWebsiteModules(out);

    window.__LH_GOOGLE_SHEETS_STATUS__={ok:errors.length===0,loadedTabs:TAB_NAMES.length-errors.length,totalTabs:TAB_NAMES.length,errors,sources,studentCount:window.GOOGLE_SHEETS_STUDENTS.length,syncConfigured:Boolean(SYNC_WEB_APP_URL),at:payload.loadedAt};
    if(typeof window.showToast==='function'){
      const n=window.GOOGLE_SHEETS_STUDENTS.length;
      if(errors.length)window.showToast('Google Sheets: '+(TAB_NAMES.length-errors.length)+'/10 tab; module website đang dùng đúng các tab đã đọc.','warning');
      else window.showToast('Đã kết nối Google Sheets: 10/10 tab; các module website đã nhận đúng SHEET.','success');
    }
    return payload;
  }

  window.loadGoogleSheetsMenuData=loadAll;
  window.getGoogleSheetTab=function(tab){return window.GOOGLE_SHEET_DATA?.tabs?.[tab]||[];};
  window.getGoogleSheetUrl=function(){return 'https://docs.google.com/spreadsheets/d/'+SHEET_ID+'/edit';};
  window.getGoogleSheetModuleSource=function(module){return window.GOOGLE_SHEET_MODULE_SOURCE?.[module]||'';};
  window.addEventListener('google-sheets-refresh',loadAll);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(loadAll,700),{once:true});else setTimeout(loadAll,700);
})();
