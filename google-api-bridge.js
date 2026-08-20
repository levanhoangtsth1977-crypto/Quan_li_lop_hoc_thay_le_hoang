/* GOOGLE API BRIDGE 7.1 — MASTER STUDENT RECOVERY
   HOC_SINH = 12 columns only. No studentCode in Google payload.
   IMPORTANT: recovered roster is written to window.students AFTER legacy
   loadClassData hooks, so old UI loaders cannot overwrite the live roster.
*/
'use strict';
(function(){
  if(window.__LH_GOOGLE_BRIDGE_710__) return;
  window.__LH_GOOGLE_BRIDGE_710__ = true;

  const CFG={url:'https://script.google.com/macros/s/AKfycbynklm7SobnkcEZKfAUGdMIBugA4lQ2kA3yOThHVjNoiJzCK7veuwO2vE1tR1QKI-nkIQ/exec',key:'QL_LOP_HOC_LE_HOANG_2026_2027'};
  const SCHEMA=['id','name','gender','birthDate','status','parentName','phone','address','note','shareEnabled','createdAt','updatedAt'];
  const clean=v=>String(v??'').trim().replace(/\s+/g,' ');
  const norm=v=>clean(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/Đ/g,'D').toLowerCase().replace(/[^a-z0-9]/g,'');
  const dateKey=v=>{let s=clean(v),m=s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})/);return m?m[1].padStart(2,'0')+m[2].padStart(2,'0')+m[3]:s.replace(/\D/g,'')};
  const identity=s=>norm(s.name)+'|'+dateKey(s.birthDate)+'|'+norm(s.gender);
  function stableId(s,i){return clean(s.id)||('STU_5C_2026_'+String(i+1).padStart(3,'0'));}
  function normalize(s,i){
    s=s||{};
    return {id:stableId(s,i),name:clean(s.name||s.studentName||''),gender:clean(s.gender||''),birthDate:clean(s.birthDate||''),status:clean(s.status)||'active',parentName:clean(s.parentName||''),phone:clean(s.phone||''),address:clean(s.address||''),note:clean(s.note||''),shareEnabled:s.shareEnabled!==false,createdAt:clean(s.createdAt)||new Date().toISOString(),updatedAt:clean(s.updatedAt)||new Date().toISOString()};
  }
  function dedupe(list){
    const m=new Map();
    (Array.isArray(list)?list:[]).map((s,i)=>normalize(s,i)).filter(s=>s.name).forEach(s=>{const k=identity(s);if(!m.has(k))m.set(k,s)});
    return [...m.values()];
  }
  function local(){try{const x=JSON.parse(localStorage.getItem(CFG.key)||'null');return x&&Array.isArray(x.students)?x:{students:[]}}catch(_){return{students:[]}}}

  function setLiveRoster(list){
    const d=dedupe(list);
    if(!d.length) return [];
    /* Legacy loaders may replace window.students. Restore the authoritative
       live roster only after those hooks have finished. */
    window.students=d;
    window.studentList=d;
    window.currentStudents=d;
    try{window.appData=window.appData||{};window.appData.students=d}catch(_){}
    return d;
  }

  function save(list){
    const d=dedupe(list);
    if(!d.length) return [];
    const old=local();
    const p={...old,version:'7.1',savedAt:new Date().toISOString(),students:d,schema:SCHEMA};
    try{localStorage.setItem(CFG.key,JSON.stringify(p))}catch(_){}
    /* Compatibility hooks first; they are allowed to initialize the legacy app. */
    try{if(typeof window.loadClassData==='function')window.loadClassData()}catch(_){}
    try{if(typeof window.syncAppDataReferences==='function')window.syncAppDataReferences()}catch(_){}
    return setLiveRoster(d);
  }

  function render(){
    const list=setLiveRoster(window.students&&window.students.length?window.students:local().students);
    try{if(typeof window.renderStudents==='function')window.renderStudents()}catch(_){}
    try{if(typeof window.renderDashboard==='function')window.renderDashboard()}catch(_){}
    const body=document.getElementById('studentTableBody');
    if(!body)return;
    if(!list.length){body.innerHTML='<tr><td colspan="7"><div class="empty-state"><span class="empty-icon"><i class="fa-solid fa-users"></i></span><strong>Chưa có học sinh</strong><p>Đang chờ đồng bộ dữ liệu từ Google Sheets.</p></div></td></tr>';return;}
    body.innerHTML=list.map((s,i)=>'<tr><td>'+(i+1)+'</td><td><strong>'+esc(s.name)+'</strong></td><td>'+esc(s.gender)+'</td><td>'+esc(s.birthDate)+'</td><td>—</td><td><span class="status-badge active">Đang học</span></td><td></td></tr>').join('');
  }
  function esc(v){return String(v??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}
  function jsonp(action){
    return new Promise((resolve,reject)=>{
      const cb='__LH710_'+Date.now()+'_'+Math.random().toString(36).slice(2),sc=document.createElement('script'),tm=setTimeout(()=>finish(Error('Google API timeout')),15000);
      function finish(e,d){clearTimeout(tm);try{delete window[cb]}catch(_){}sc.remove();e?reject(e):resolve(d)}
      window[cb]=d=>finish(null,d);sc.onerror=()=>finish(Error('Không truy cập được Google Apps Script'));sc.src=CFG.url+'?action='+encodeURIComponent(action)+'&callback='+encodeURIComponent(cb)+'&_='+Date.now();document.head.appendChild(sc);
    });
  }
  async function backup(){
    const r=await fetch('DANH_SACH_HOC_SINH_5C_2026_2027.json?x='+Date.now(),{cache:'no-store'});
    if(!r.ok)throw Error('Không đọc được bản sao 42 học sinh');
    const j=await r.json();
    return dedupe(j.students||[]);
  }
  async function load(){
    let list=[];
    try{const r=await jsonp('get_students');if(r&&r.ok===true&&Array.isArray(r.students)&&r.students.length)list=dedupe(r.students)}catch(_){}
    if(!list.length){
      list=local().students||[];
      if(list.length<42){try{list=await backup()}catch(_){}
      }
      if(list.length){
        save(list);
        window.__LH_ROSTER_RECOVERY__={ok:true,count:list.length,source:'BACKUP_OR_LOCAL'};
        try{await post(list)}catch(_){}
      }
    }else{
      save(list);
      window.__LH_ROSTER_RECOVERY__={ok:true,count:list.length,source:'GOOGLE'};
    }
    setLiveRoster(list);
    render();
    if(typeof window.showToast==='function'&&list.length)window.showToast('Đã tải '+list.length+' học sinh.','success');
    return list;
  }
  function post(list){
    const students=dedupe(list);
    return new Promise((resolve,reject)=>{
      const n='LH710_'+Date.now(),f=document.createElement('iframe'),form=document.createElement('form');
      f.name=n;f.style.display='none';form.method='POST';form.action=CFG.url;form.target=n;form.style.display='none';
      const input=document.createElement('input');input.type='hidden';input.name='payload';input.value=JSON.stringify({action:'sync_students',students});
      form.appendChild(input);document.body.append(f,form);let done=false;
      const finish=ok=>{if(done)return;done=true;setTimeout(()=>{f.remove();form.remove()},500);ok?resolve():reject()};
      f.onload=()=>finish(true);try{form.submit()}catch(_){finish(false)}setTimeout(()=>finish(true),10000);
    });
  }
  window.loadGoogleSheetsMenuData=load;
  window.syncGoogleSheetsNow=load;
  window.syncRosterToGoogle=list=>post(list).then(()=>({ok:true,count:dedupe(list).length}));
  window.getGoogleStudentRoster=()=>dedupe(window.students||local().students||[]);
  function init(){setTimeout(load,400);setTimeout(()=>render(),1800);setTimeout(()=>render(),3500);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
