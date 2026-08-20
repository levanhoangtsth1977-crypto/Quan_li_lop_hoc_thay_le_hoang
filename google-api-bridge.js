/* ============================================================
   GOOGLE API BRIDGE 6.4 — STUDENT ROSTER RECOVERY
   12-column HOC_SINH schema. No studentCode in HOC_SINH.
   GET uses JSONP to avoid browser CORS/redirect failures.
   POST uses hidden form + verification GET.
   ============================================================ */
'use strict';

(function(){
  if(window.__LH_GOOGLE_BRIDGE_640__) return;
  window.__LH_GOOGLE_BRIDGE_640__=true;

  const CONFIG=Object.freeze({
    url:'https://script.google.com/macros/s/AKfycbynklm7SobnkcEZKfAUGdMIBugA4lQ2kA3yOThHVjNoiJzCK7veuwO2vE1tR1QKI-nkIQ/exec',
    timeout:20000,
    version:'6.4.0',
    storageKey:'QL_LOP_HOC_LE_HOANG_2026_2027'
  });
  const SCHEMA=Object.freeze(['id','name','gender','birthDate','status','parentName','phone','address','note','shareEnabled','createdAt','updatedAt']);

  function txt(v){return String(v??'').trim().replace(/\s+/g,' ')}
  function key(v){return txt(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/Đ/g,'D').toLowerCase().replace(/[^a-z0-9]/g,'')}
  function dateKey(v){
    if(v instanceof Date&&!isNaN(v.getTime())) return String(v.getDate()).padStart(2,'0')+String(v.getMonth()+1).padStart(2,'0')+v.getFullYear();
    const s=txt(v); if(!s)return '';
    let m=s.match(/^(\d{4})[-\/.](\d{1,2})[-\/.](\d{1,2})/); if(m)return m[3].padStart(2,'0')+m[2].padStart(2,'0')+m[1];
    m=s.match(/^(\d{1,2})[-\/.](\d{1,2})[-\/.](\d{4})/); if(m)return m[1].padStart(2,'0')+m[2].padStart(2,'0')+m[3];
    return s.replace(/\D/g,'');
  }
  function identity(s){return key(s.name)+'|'+dateKey(s.birthDate)+'|'+key(s.gender)}
  function normalize(s){s=s&&typeof s==='object'?s:{};return{
    id:txt(s.id||s.studentId||''), name:txt(s.name||s.studentName||s.hoTen||''), gender:txt(s.gender||s.gioiTinh||''),
    birthDate:txt(s.birthDate||s.dateOfBirth||s.ngaySinh||''), status:txt(s.status)||'active', parentName:txt(s.parentName||s.phuHuynh||''),
    phone:txt(s.phone||s.dienThoai||''), address:txt(s.address||s.diaChi||''), note:txt(s.note||s.ghiChu||''),
    shareEnabled:s.shareEnabled!==false, createdAt:txt(s.createdAt)||new Date().toISOString(), updatedAt:txt(s.updatedAt)||new Date().toISOString()
  }}
  function valid(s){return !!(s.id&&s.name&&SCHEMA.every(k=>Object.prototype.hasOwnProperty.call(s,k)))}
  function dedupe(list){
    const map=new Map(), dup=[];
    (Array.isArray(list)?list:[]).map(normalize).filter(valid).forEach(s=>{
      const k=identity(s), old=map.get(k);
      if(!old){map.set(k,s);return}
      const keep=/^STU_5C_2026_/i.test(s.id)?s:(/^STU_5C_2026_/i.test(old.id)?old:(s.id<old.id?s:old));
      map.set(k,keep); dup.push({keptId:keep.id,name:keep.name});
    });
    return {students:[...map.values()],duplicateCount:dup.length,duplicates:dup};
  }
  function localPayload(){try{const x=JSON.parse(localStorage.getItem(CONFIG.storageKey)||'null');return x&&typeof x==='object'?x:{students:[]}}catch(_){return{students:[]}}}
  function saveLocal(list,source){
    const d=dedupe(list); if(!d.students.length) throw new Error('Không có học sinh hợp lệ.');
    const old=localPayload();
    const p={version:old.version||'3.1.1',savedAt:new Date().toISOString(),config:old.config||{},students:d.students,
      attendance:Array.isArray(old.attendance)?old.attendance:[],violations:Array.isArray(old.violations)?old.violations:[],rewards:Array.isArray(old.rewards)?old.rewards:[],learning:Array.isArray(old.learning)?old.learning:[],progress:Array.isArray(old.progress)?old.progress:[],comments:Array.isArray(old.comments)?old.comments:[]};
    localStorage.setItem(CONFIG.storageKey,JSON.stringify(p));
    if(typeof window.loadClassData==='function') try{window.loadClassData()}catch(e){console.warn(e)}
    if(typeof window.syncAppDataReferences==='function') try{window.syncAppDataReferences()}catch(e){console.warn(e)}
    return {ok:true,count:d.students.length,source,duplicateCount:d.duplicateCount,schema:SCHEMA.slice()};
  }
  function refresh(){['renderDashboard','renderStudents','renderAttendance','renderViolations','renderRewards','renderLearningSafe','renderCommentsSafe','renderStatistics','renderStudentLinks','updateStudentSelects'].forEach(n=>{if(typeof window[n]==='function')try{window[n]()}catch(e){}})}

  function jsonp(action){
    return new Promise((resolve,reject)=>{
      const cb='__LH_JSONP_'+Date.now()+'_'+Math.random().toString(36).slice(2);
      const script=document.createElement('script'); let done=false;
      const timer=setTimeout(()=>finish(new Error('Google API timeout')),CONFIG.timeout);
      function finish(err,data){if(done)return;done=true;clearTimeout(timer);try{delete window[cb]}catch(_){}script.remove();err?reject(err):resolve(data)}
      window[cb]=data=>finish(null,data);
      script.onerror=()=>finish(new Error('Không truy cập được Google Apps Script Web App.'));
      script.src=CONFIG.url+'?action='+encodeURIComponent(action)+'&callback='+encodeURIComponent(cb)+'&_='+Date.now();
      document.head.appendChild(script);
    });
  }

  function loadGoogleSheetsMenuData(){
    return jsonp('get_students').then(r=>{
      if(!r||r.ok!==true) throw new Error(r&&r.error||'Google API trả lỗi.');
      const list=Array.isArray(r.students)?r.students:[];
      if(!list.length) throw new Error('Google trả về 0 học sinh; không ghi đè dữ liệu hiện có.');
      const saved=saveLocal(list,'google-sheets');
      window.__GOOGLE_CLASS_SYNC__={ok:true,count:saved.count,physicalCount:Number(r.physicalCount)||list.length,logicalCount:saved.count,duplicateCount:Number(r.duplicateCount)||saved.duplicateCount,source:'google-sheets',fallbackUsed:false,schema:SCHEMA.slice(),at:new Date().toISOString()};
      refresh();
      if(typeof window.showToast==='function') window.showToast('Đã tải '+saved.count+' học sinh từ Google Sheets.','success');
      return window.__GOOGLE_CLASS_SYNC__;
    }).catch(err=>{
      const n=Array.isArray(localPayload().students)?localPayload().students.length:0;
      window.__GOOGLE_CLASS_SYNC__={ok:false,count:n,source:n?'local-preserved':'no-data',fallbackUsed:true,error:err.message,schema:SCHEMA.slice(),at:new Date().toISOString()};
      refresh();
      if(typeof window.showToast==='function') window.showToast(n?'Google chưa kết nối; giữ danh sách hiện có.':'Chưa tải được danh sách Google Sheets.','warning');
      return window.__GOOGLE_CLASS_SYNC__;
    });
  }

  function postStudents(list){
    const students=(Array.isArray(list)?list:[]).map(normalize).filter(valid);
    if(!students.length)return Promise.reject(new Error('Danh sách học sinh rỗng hoặc thiếu ID/họ tên.'));
    return new Promise((resolve,reject)=>{
      const name='LH_POST_'+Date.now()+'_'+Math.random().toString(36).slice(2);
      const iframe=document.createElement('iframe'),form=document.createElement('form');
      iframe.name=name;iframe.style.display='none';form.method='POST';form.action=CONFIG.url;form.target=name;form.style.display='none';
      const input=document.createElement('input');input.type='hidden';input.name='payload';input.value=JSON.stringify({action:'sync_students',students});form.appendChild(input);
      document.body.appendChild(iframe);document.body.appendChild(form);
      let done=false;const timer=setTimeout(()=>finish(true),12000);
      function finish(ok){if(done)return;done=true;clearTimeout(timer);setTimeout(()=>{iframe.remove();form.remove()},500);ok?resolve({ok:true,count:students.length}):reject(new Error('Không gửi được dữ liệu.'))}
      iframe.addEventListener('load',()=>finish(true),{once:true});
      try{form.submit()}catch(e){finish(false)}
    });
  }
  function verify(list){return jsonp('get_students').then(r=>{if(!r||r.ok!==true)throw new Error(r&&r.error||'Không đọc lại được Google.');const remote=Array.isArray(r.students)?r.students:[];const ok=list.every(s=>{const n=normalize(s);return remote.some(x=>{const y=normalize(x);return n.id===y.id||identity(n)===identity(y)})});if(!ok)throw new Error('Google chưa xác nhận đầy đủ danh sách vừa tải lên.');return r})}
  function syncRosterToGoogle(list,source){
    return postStudents(list).then(()=>verify(list)).then(r=>{
      window.__GOOGLE_ROSTER_UPLOAD__={ok:true,count:Array.isArray(list)?list.length:0,source:source||'import',verified:true,remoteCount:Array.isArray(r.students)?r.students.length:0,schema:SCHEMA.slice(),at:new Date().toISOString()};
      if(typeof window.showToast==='function')window.showToast('Đã tải danh sách lên Google Sheets và kiểm tra lại thành công.','success');
      return window.__GOOGLE_ROSTER_UPLOAD__;
    }).catch(e=>{window.__GOOGLE_ROSTER_UPLOAD__={ok:false,error:e.message,source:source||'import',verified:false,schema:SCHEMA.slice(),at:new Date().toISOString()};if(typeof window.showToast==='function')window.showToast('Tải danh sách lên Google thất bại: '+e.message,'error');return window.__GOOGLE_ROSTER_UPLOAD__});
  }

  function hookReplace(){
    if(typeof window.replaceStudents!=='function'){setTimeout(hookReplace,300);return}
    if(window.replaceStudents.__LH_GOOGLE_640__)return;
    const original=window.replaceStudents;
    function wrapped(incoming,options){
      const result=original.apply(this,arguments);const opts=options&&typeof options==='object'?options:{};const source=String(opts.source||'').toLowerCase();
      if(result&&result.success!==false&&Array.isArray(incoming)&&incoming.length&&/excel|csv|import|upload|sheet|google/.test(source)) syncRosterToGoogle(incoming,source);
      return result;
    }
    wrapped.__LH_GOOGLE_640__=true;window.replaceStudents=wrapped;
  }
  function hookWrites(){
    if(typeof window.addStudent==='function'&&!window.addStudent.__LH_GOOGLE_640__){const f=window.addStudent;const w=function(){const r=f.apply(this,arguments);if(r&&r.success&&r.student)syncRosterToGoogle([r.student],'add');return r};w.__LH_GOOGLE_640__=true;window.addStudent=w}
    if(typeof window.updateStudent==='function'&&!window.updateStudent.__LH_GOOGLE_640__){const f=window.updateStudent;const w=function(){const r=f.apply(this,arguments);if(r&&r.success&&r.student)syncRosterToGoogle([r.student],'update');return r};w.__LH_GOOGLE_640__=true;window.updateStudent=w}
  }
  function installHooks(){hookReplace();hookWrites();setTimeout(hookWrites,1000);setTimeout(hookWrites,2500)}

  window.loadGoogleSheetsMenuData=loadGoogleSheetsMenuData;
  window.syncGoogleSheetsNow=loadGoogleSheetsMenuData;
  window.syncRosterToGoogle=syncRosterToGoogle;
  window.getGoogleStudentSyncStatus=()=>window.__GOOGLE_CLASS_SYNC__||{ok:false,source:'not-started',schema:SCHEMA.slice()};
  window.getGoogleRosterUploadStatus=()=>window.__GOOGLE_ROSTER_UPLOAD__||{ok:false,source:'not-started',schema:SCHEMA.slice()};

  function init(){installHooks();setTimeout(loadGoogleSheetsMenuData,500)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();