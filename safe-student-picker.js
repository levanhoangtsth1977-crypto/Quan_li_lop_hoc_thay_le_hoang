/* LE HOANG SAFE STUDENT PICKER — scoped UI only */
(function(){
'use strict';
if(window.__LH_SAFE_STUDENT_PICKER__) return;
window.__LH_SAFE_STUDENT_PICKER__=true;
const IDS=['attendanceStudent','violationStudent','rewardStudent'];
const clean=v=>String(v??'').trim().replace(/\s+/g,' ');
const states=new WeakMap();
function normalizeRosterIds(){
 const src=Array.isArray(window.GOOGLE_SHEETS_STUDENTS)?window.GOOGLE_SHEETS_STUDENTS:(Array.isArray(window.students)?window.students:[]);
 if(!src.length)return;
 src.forEach((st,i)=>{
   if(!st||!clean(st.name))return;
   if(!clean(st.id)&&!clean(st.studentCode)) st.id='LH5C-'+String(Number(st.stt)||i+1).padStart(3,'0');
   else if(!clean(st.id)&&clean(st.studentCode)) st.id=clean(st.studentCode);
 });
}
function roster(){
 normalizeRosterIds();
 const a=Array.isArray(window.GOOGLE_SHEETS_STUDENTS)?window.GOOGLE_SHEETS_STUDENTS:[];
 if(a.length) return a;
 return Array.isArray(window.students)?window.students:[];
}
function ensure(id){
 const sel=document.getElementById(id);
 if(!sel || states.has(sel)) return;
 const parent=sel.parentElement;
 if(!parent) return;
 const wrap=document.createElement('div');
 wrap.className='lh-safe-picker';
 wrap.style.cssText='position:relative;width:100%;';
 const trigger=document.createElement('button');
 trigger.type='button';
 trigger.className='button secondary lh-safe-picker-trigger';
 trigger.style.cssText='width:100%;justify-content:space-between;text-align:left;';
 const label=document.createElement('span');
 const arrow=document.createElement('span');
 arrow.textContent='▾';
 trigger.append(label,arrow);
 const panel=document.createElement('div');
 panel.hidden=true;
 panel.className='lh-safe-picker-panel';
 panel.style.cssText='position:absolute;left:0;right:0;top:calc(100% + 4px);z-index:5000;max-height:300px;overflow:auto;background:#fff;border:1px solid #d1d5db;border-radius:8px;box-shadow:0 10px 24px rgba(0,0,0,.15);padding:4px;';
 parent.insertBefore(wrap,sel);
 wrap.append(trigger,panel);
 sel.style.display='none';
 states.set(sel,{wrap,trigger,panel,label,arrow});
 function syncLabel(){
   const v=clean(sel.value);
   const opt=Array.from(sel.options).find(o=>clean(o.value)===v);
   const student=roster().find(st=>clean(st?.id)===v);
   label.textContent=opt?.textContent||student?.name||'Chọn học sinh';
   arrow.textContent=panel.hidden?'▾':'▴';
 }
 function render(){
   normalizeRosterIds();
   const current=clean(sel.value);
   panel.replaceChildren();
   roster().forEach(st=>{
     const sid=clean(st?.id),name=clean(st?.name);
     if(!sid||!name) return;
     const b=document.createElement('button');
     b.type='button';
     b.textContent=name;
     b.style.cssText='display:block;width:100%;text-align:left;border:0;background:#fff;padding:8px 10px;border-radius:6px;cursor:pointer;';
     if(sid===current) b.style.fontWeight='700';
     b.addEventListener('click',function(e){
       e.preventDefault();
       sel.value=sid;
       sel.dispatchEvent(new Event('change',{bubbles:true}));
       syncLabel();
       panel.hidden=true;
       arrow.textContent='▾';
     });
     panel.appendChild(b);
   });
 }
 trigger.addEventListener('click',function(e){
   e.preventDefault();
   e.stopPropagation();
   panel.hidden=!panel.hidden;
   if(!panel.hidden) render();
   syncLabel();
 });
 panel.addEventListener('click',e=>e.stopPropagation());
 document.addEventListener('click',e=>{if(!wrap.contains(e.target)){panel.hidden=true;syncLabel();}},{passive:true});
 states.get(sel).refresh=()=>{render();syncLabel();};
 syncLabel();
}
function install(){normalizeRosterIds();IDS.forEach(ensure);}
function styleProfileLayout(){
 if(document.getElementById('lhProfileLowerPanelFix'))return;
 const s=document.createElement('style');
 s.id='lhProfileLowerPanelFix';
 s.textContent='#page-student-profiles .profile-layout{display:block!important}#page-student-profiles .profile-list-panel{display:none!important}#page-student-profiles #lhProfileSearch{display:none!important}#page-student-profiles .profile-detail{width:100%;box-sizing:border-box}';
 document.head.appendChild(s);
}
function loadProfileRepair(){
 if(document.getElementById('lhStudentProfileRepairScript'))return;
 const script=document.createElement('script');
 script.id='lhStudentProfileRepairScript';
 script.src='student-profile-repair.js?v=1.0.0';
 script.async=false;
 document.body.appendChild(script);
}
function start(){
 install();
 styleProfileLayout();
 loadProfileRepair();
 window.addEventListener('google-sheets-data-ready',()=>{install();styleProfileLayout();loadProfileRepair()});
 const mo=new MutationObserver(()=>{install();styleProfileLayout();if(document.getElementById('mainContent'))loadProfileRepair()});
 mo.observe(document.body,{childList:true,subtree:true});
}
function repairProfileMenu(){
 const run=()=>{
   normalizeRosterIds();
   const nav=document.querySelector('.main-menu');
   if(!nav)return;
   if(document.getElementById('lhStudentProfileMenu'))return;
   const script=document.createElement('script');
   script.src='student-profile-menu.js?repair='+Date.now();
   script.async=false;
   document.body.appendChild(script);
 };
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});else run();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
repairProfileMenu();
window.addEventListener('google-sheets-data-ready',repairProfileMenu);
})();
