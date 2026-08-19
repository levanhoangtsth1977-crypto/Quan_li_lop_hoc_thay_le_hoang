/* QUẢN LÝ LỚP HỌC — GOOGLE SHEETS MENU BRIDGE 1.2
 * Spreadsheet: 174xQ29phs-Or7OOEKOM0IHylFJXg5SsqzOC27x7K3Wg
 * 10 tabs: HOC_SINH, DIEM_DANH, VI_PHAM, KHEN_THUONG, HOC_TAP,
 * TIEN_BO, NHAN_XET, LINK_HOC_SINH, CAU_HINH, NHAT_KY.
 *
 * Nguyên tắc:
 * - Google Sheets là nguồn đồng bộ từ xa.
 * - Dữ liệu danh sách học sinh đã có trong repository là nguồn dự phòng
 *   để website không mất danh sách khi tab HOC_SINH còn trống.
 * - Không tự bịa học sinh.
 * - LINK_HOC_SINH được tạo ổn định từ mã học sinh.
 * - Không ghi đè LocalStorage hiện có.
 */
(function(){
  'use strict';
  if(window.__LH_GOOGLE_MENU_BRIDGE__) return;
  window.__LH_GOOGLE_MENU_BRIDGE__=true;

  const SHEET_ID='174xQ29phs-Or7OOEKOM0IHylFJXg5SsqzOC27x7K3Wg';
  const TAB_NAMES=['HOC_SINH','DIEM_DANH','VI_PHAM','KHEN_THUONG','HOC_TAP','TIEN_BO','NHAN_XET','LINK_HOC_SINH','CAU_HINH','NHAT_KY'];
  const KEY='QL_LOP_HOC_LE_HOANG_GOOGLE_SHEETS_2026_2027';
  const STUDENT_JSON='DANH_SACH_HOC_SINH_5C_2026_2027.json';

  const ALIASES={
    id:['id','studentid','studentcode','maso','mahs','mahocsinh','mahocsinhvien','mahsinh','mahochsinh'],
    studentId:['studentid','id','studentcode','maso','mahs','mahocsinh','mahochsinh'],
    name:['name','studentname','hoten','hovaten','hocsinh','ten','tenhocsinh'],
    date:['date','ngay','ngaythang','ngayghi','ngaydiemdanh','ngaythangnam'],
    status:['status','trangthai','tinhtrang','tinhtranghoc','trangthaihoc'],
    note:['note','ghichu','noidung','ghichu2'],
    type:['type','loai','loaiviolation','loaikhen'],
    subject:['mon','monhoc','subject'],
    score:['score','diem','diemso','diemtrungbinh'],
    result:['result','ketqua','xeploai'],
    url:['url','link','lienket','duongdan','linkhocsinh','linkhoclieu'],
    gender:['gender','gioitinh'],
    birthDate:['birthdate','ngaysinh','ngaysinhhocsinh'],
    parentName:['parentname','phuhuynh','tenphuhuynh','hotenphuhuynh'],
    phone:['phone','sdt','sodienthoai','dienthoai'],
    address:['address','diachi'],
    className:['class','lop','tenlop'],
    schoolYear:['schoolyear','namhoc']
  };

  function norm(v){return String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/Đ/g,'D').replace(/[^a-zA-Z0-9]+/g,'').toLowerCase();}
  function clean(v){return String(v??'').trim();}

  function headerMap(cols){
    const heads=cols.map(c=>norm(c.label||c.id||''));
    const out={};
    Object.keys(ALIASES).forEach(k=>{
      out[k]=-1;
      for(const a of ALIASES[k]){const i=heads.indexOf(norm(a));if(i>=0){out[k]=i;break;}}
    });
    return out;
  }

  function rowsToObjects(data,tab){
    if(!data||!data.table) throw new Error('Google Sheets không trả về dữ liệu bảng: '+tab);
    const cols=data.table.cols||[], rows=data.table.rows||[];
    const map=headerMap(cols);
    const labels=cols.map(c=>clean(c.label||c.id||''));
    const objects=rows.map(r=>{
      const cells=r.c||[],o={};
      labels.forEach((h,i)=>{if(h)o[h]=clean(cells[i]?.v);});
      Object.keys(map).forEach(k=>{const i=map[k];if(i>=0)o[k]=clean(cells[i]?.v);});
      return o;
    });
    return {objects,map,labels};
  }

  function validateTab(tab,map){
    /* Các tab nghiệp vụ có thể rỗng; chỉ kiểm tra cấu trúc khi có dữ liệu/header. */
    const required={
      HOC_SINH:['id','name'], DIEM_DANH:['studentId','date'], VI_PHAM:['studentId'],
      KHEN_THUONG:['studentId'], HOC_TAP:['studentId'], TIEN_BO:['studentId'],
      NHAN_XET:['studentId'], LINK_HOC_SINH:['studentId'], CAU_HINH:[], NHAT_KY:[]
    }[tab]||[];
    const missing=required.filter(k=>map[k]===undefined||map[k]<0);
    if(missing.length) throw new Error(tab+' thiếu cột: '+missing.join(', '));
  }

  function fetchTab(tab){
    return new Promise((resolve,reject)=>{
      const cb='__LH_TAB_'+Date.now()+'_'+Math.random().toString(36).slice(2);
      const s=document.createElement('script');
      const timer=setTimeout(()=>{cleanup();reject(new Error('Timeout: '+tab));},15000);
      function cleanup(){clearTimeout(timer);delete window[cb];s.remove();}
      window[cb]=data=>{try{const parsed=rowsToObjects(data,tab);validateTab(tab,parsed.map);cleanup();resolve(parsed);}catch(e){cleanup();reject(e);}};
      s.onerror=()=>{cleanup();reject(new Error('Không truy cập được tab '+tab));};
      s.src='https://docs.google.com/spreadsheets/d/'+SHEET_ID+'/gviz/tq?sheet='+encodeURIComponent(tab)+'&tqx='+encodeURIComponent('out:json;responseHandler:'+cb)+'&headers=1';
      document.head.appendChild(s);
    });
  }

  function normalizeRecord(o){return {id:o.id||'',studentId:o.studentId||o.id||'',name:o.name||'',date:o.date||'',status:o.status||'',note:o.note||'',type:o.type||'',subject:o.subject||'',score:o.score||'',result:o.result||'',url:o.url||'',raw:o};}

  function makeStudentCode(index){return 'HS'+String(index+1).padStart(3,'0');}

  function mapStudent(raw,index){
    const id=clean(raw.id||raw.studentId||raw.studentCode)||makeStudentCode(index);
    return {
      id, studentCode:id, stt:Number(raw.stt||index+1), name:clean(raw.name), gender:clean(raw.gender),
      birthDate:clean(raw.birthDate), status:clean(raw.status)||'active', parentName:clean(raw.parentName),
      phone:clean(raw.phone), address:clean(raw.address), note:clean(raw.note), shareEnabled:true
    };
  }

  async function loadLocalStudents(){
    try{
      const r=await fetch(STUDENT_JSON,{cache:'no-store'});
      if(!r.ok) throw new Error('HTTP '+r.status);
      const wrapper=await r.json();
      const raw=wrapper?.students||[];
      return raw.map(mapStudent).filter(s=>s.name);
    }catch(e){
      console.warn('[GOOGLE MENU BRIDGE] Không đọc được danh sách học sinh dự phòng:',e);
      return [];
    }
  }

  function buildStudentLinks(students){
    return students.map(s=>({
      id:s.id,
      studentId:s.id,
      name:s.name,
      className:'5C',
      schoolYear:'2026–2027',
      profileUrl:'?student='+encodeURIComponent(s.id),
      learningUrl:'?page=learning&student='+encodeURIComponent(s.id),
      attendanceUrl:'?page=attendance&student='+encodeURIComponent(s.id),
      violationsUrl:'?page=violations&student='+encodeURIComponent(s.id),
      rewardsUrl:'?page=rewards&student='+encodeURIComponent(s.id),
      progressUrl:'?page=progress&student='+encodeURIComponent(s.id),
      commentsUrl:'?page=comments&student='+encodeURIComponent(s.id)
    }));
  }

  async function loadAll(){
    const out={},errors=[],sources={};
    for(const tab of TAB_NAMES){
      try{const r=await fetchTab(tab);out[tab]=r.objects.map(normalizeRecord);sources[tab]='google-sheets';}
      catch(e){out[tab]=[];sources[tab]='unavailable';errors.push(tab+': '+e.message);}
    }

    const localStudents=await loadLocalStudents();
    if((out.HOC_SINH||[]).length){
      window.GOOGLE_SHEETS_STUDENTS=out.HOC_SINH.map((r,i)=>mapStudent(r.raw||r,i)).filter(s=>s.name);
      sources.HOC_SINH='google-sheets';
    }else{
      window.GOOGLE_SHEETS_STUDENTS=localStudents;
      sources.HOC_SINH='repository-json-fallback';
    }

    if((out.LINK_HOC_SINH||[]).length){sources.LINK_HOC_SINH='google-sheets';}
    else{out.LINK_HOC_SINH=buildStudentLinks(window.GOOGLE_SHEETS_STUDENTS);sources.LINK_HOC_SINH='generated-from-student-master';}

    const payload={version:'1.2.0',sheetId:SHEET_ID,loadedAt:new Date().toISOString(),tabs:out,sources,errors};
    try{localStorage.setItem(KEY,JSON.stringify(payload));}catch(e){console.warn('[GOOGLE MENU BRIDGE] localStorage:',e);}
    window.GOOGLE_SHEET_DATA=payload;
    window.GOOGLE_SHEET_CONFIG={sheetId:SHEET_ID,tabs:TAB_NAMES,key:KEY,errors,sources,studentCount:window.GOOGLE_SHEETS_STUDENTS.length};
    window.__LH_GOOGLE_SHEETS_STATUS__={ok:errors.length===0,loadedTabs:TAB_NAMES.length-errors.length,totalTabs:TAB_NAMES.length,errors,sources,studentCount:window.GOOGLE_SHEETS_STUDENTS.length,at:payload.loadedAt};

    if(typeof window.showToast==='function'){
      const n=window.GOOGLE_SHEETS_STUDENTS.length;
      if(errors.length) window.showToast('Google Sheets: '+(TAB_NAMES.length-errors.length)+'/10 tab; HOC_SINH đang dùng dữ liệu dự phòng '+n+' học sinh.','warning');
      else window.showToast('Đã kết nối Google Sheets: 10/10 tab; '+n+' học sinh.','success');
    }
    return payload;
  }

  window.loadGoogleSheetsMenuData=loadAll;
  window.getGoogleSheetTab=function(tab){return window.GOOGLE_SHEET_DATA?.tabs?.[tab]||[];};
  window.getGoogleSheetUrl=function(){return 'https://docs.google.com/spreadsheets/d/'+SHEET_ID+'/edit';};
  window.addEventListener('google-sheets-refresh',loadAll);

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>setTimeout(loadAll,700),{once:true});
  else setTimeout(loadAll,700);
})();
