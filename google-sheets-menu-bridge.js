/* QUẢN LÝ LỚP HỌC — GOOGLE SHEETS MENU BRIDGE 1.1
 * Spreadsheet: 174xQ29phs-Or7OOEKOM0IHylFJXg5SsqzOC27x7K3Wg
 * Source tabs: HOC_SINH, DIEM_DANH, VI_PHAM, KHEN_THUONG,
 * HOC_TAP, TIEN_BO, NHAN_XET, LINK_HOC_SINH, CAU_HINH, NHAT_KY.
 * Read-only data bridge. Existing Data Engine remains authoritative for local CRUD.
 */
(function(){
  'use strict';
  if(window.__LH_GOOGLE_MENU_BRIDGE__) return;
  window.__LH_GOOGLE_MENU_BRIDGE__=true;

  const SHEET_ID='174xQ29phs-Or7OOEKOM0IHylFJXg5SsqzOC27x7K3Wg';
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
    subject:['mon','monhoc','subject'],
    score:['score','diem','diemso','diemtrungbinh'],
    result:['result','ketqua','xepLoai','xeploai'],
    url:['url','link','lienket','duongdan','linkhocsinh','linkhoclieu'],
    gender:['gender','gioitinh'],
    birthDate:['birthdate','ngaysinh','ngaysinhhocsinh'],
    parentName:['parentname','phuhuynh','tenphuhuynh','hotenphuhuynh'],
    phone:['phone','sdt','sodienthoai','dienthoai'],
    address:['address','diachi'],
    className:['class','lop','tenlop'],
    schoolYear:['schoolyear','namhoc']
  };

  function norm(v){
    return String(v??'')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g,'')
      .replace(/đ/g,'d').replace(/Đ/g,'D')
      .replace(/[^a-zA-Z0-9]+/g,'')
      .toLowerCase();
  }
  function clean(v){return String(v??'').trim();}

  function headerMap(cols){
    const heads=cols.map(c=>norm(c.label||c.id||''));
    const out={};
    Object.keys(ALIASES).forEach(k=>{
      out[k]=-1;
      for(const a of ALIASES[k]){
        const i=heads.indexOf(norm(a));
        if(i>=0){out[k]=i;break;}
      }
    });
    return out;
  }

  function rowsToObjects(data,tab){
    if(!data||!data.table) throw new Error('Google Sheets không trả về dữ liệu bảng: '+tab);
    const cols=data.table.cols||[], rows=data.table.rows||[];
    const map=headerMap(cols);
    const labels=cols.map(c=>clean(c.label||c.id||''));
    const objects=rows.map(r=>{
      const cells=r.c||[], o={};
      labels.forEach((h,i)=>{if(h)o[h]=clean(cells[i]?.v);});
      Object.keys(map).forEach(k=>{
        const i=map[k];
        if(i>=0)o[k]=clean(cells[i]?.v);
      });
      return o;
    });
    return {objects,map,labels};
  }

  function validateTab(tab,rows,map){
    const required={HOC_SINH:['id','name'],DIEM_DANH:['studentId','date'],VI_PHAM:['studentId'],KHEN_THUONG:['studentId'],HOC_TAP:['studentId'],TIEN_BO:['studentId'],NHAN_XET:['studentId'],LINK_HOC_SINH:['studentId'],CAU_HINH:[],NHAT_KY:[]}[tab]||[];
    const missing=required.filter(k=>map[k]===undefined||map[k]<0);
    if(missing.length) throw new Error(tab+' thiếu cột: '+missing.join(', '));
    return true;
  }

  function fetchTab(tab){
    return new Promise((resolve,reject)=>{
      const cb='__LH_TAB_'+Date.now()+'_'+Math.random().toString(36).slice(2);
      const s=document.createElement('script');
      const timer=setTimeout(()=>{cleanup();reject(new Error('Timeout: '+tab));},15000);
      function cleanup(){clearTimeout(timer);delete window[cb];s.remove();}
      window[cb]=data=>{
        try{
          const parsed=rowsToObjects(data,tab);
          validateTab(tab,parsed.objects,parsed.map);
          cleanup();
          resolve(parsed);
        }catch(e){cleanup();reject(e);}
      };
      s.onerror=()=>{cleanup();reject(new Error('Không truy cập được tab '+tab));};
      s.src='https://docs.google.com/spreadsheets/d/'+SHEET_ID+'/gviz/tq?sheet='+encodeURIComponent(tab)+'&tqx='+encodeURIComponent('out:json;responseHandler:'+cb)+'&headers=1';
      document.head.appendChild(s);
    });
  }

  function normalizeRecord(o){
    return {
      id:o.id||'',studentId:o.studentId||o.id||'',name:o.name||'',date:o.date||'',status:o.status||'',note:o.note||'',type:o.type||'',subject:o.subject||'',score:o.score||'',result:o.result||'',url:o.url||'',raw:o
    };
  }

  function mapStudent(raw,index){
    const id=raw.id||('HS'+String(index+1).padStart(2,'0'));
    return {
      id,
      studentCode:id,
      name:raw.name||'',
      gender:raw.gender||'',
      birthDate:raw.birthDate||'',
      status:raw.status||'active',
      parentName:raw.parentName||'',
      phone:raw.phone||'',
      address:raw.address||'',
      note:raw.note||'',
      shareEnabled:true
    };
  }

  async function loadAll(){
    const out={}; const errors=[];
    for(const tab of TAB_NAMES){
      try{
        const r=await fetchTab(tab);
        out[tab]=r.objects.map(normalizeRecord);
      }catch(e){
        out[tab]=[];
        errors.push(tab+': '+e.message);
      }
    }

    const payload={version:'1.1.0',sheetId:SHEET_ID,loadedAt:new Date().toISOString(),tabs:out,errors};
    try{localStorage.setItem(KEY,JSON.stringify(payload));}catch(e){console.warn('[GOOGLE MENU BRIDGE] localStorage:',e);}
    window.GOOGLE_SHEET_DATA=payload;
    window.GOOGLE_SHEET_CONFIG={sheetId:SHEET_ID,tabs:TAB_NAMES,key:KEY,errors};

    const students=(out.HOC_SINH||[]).map((r,i)=>mapStudent(r.raw||r,i)).filter(s=>s.name);
    window.GOOGLE_SHEETS_STUDENTS=students;
    window.__LH_GOOGLE_SHEETS_STATUS__={ok:errors.length===0,loadedTabs:TAB_NAMES.length-errors.length,totalTabs:TAB_NAMES.length,errors,at:payload.loadedAt};

    if(typeof window.showToast==='function'){
      if(errors.length) window.showToast('Google Sheets: tải được '+(TAB_NAMES.length-errors.length)+'/10 tab.','warning');
      else window.showToast('Đã kết nối Google Sheets: 10/10 tab.','success');
    }
    return payload;
  }

  window.loadGoogleSheetsMenuData=loadAll;
  window.getGoogleSheetTab=function(tab){return window.GOOGLE_SHEET_DATA?.tabs?.[tab]||[];};
  window.getGoogleSheetUrl=function(tab){return 'https://docs.google.com/spreadsheets/d/'+SHEET_ID+'/edit';};
  window.addEventListener('google-sheets-refresh',loadAll);

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',()=>setTimeout(loadAll,700),{once:true});
  }else{
    setTimeout(loadAll,700);
  }
})();
