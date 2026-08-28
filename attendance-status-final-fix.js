/* ATTENDANCE STATUS FINAL 6.4 — direct status buttons
   Main script.js remains the source of truth for students and dates.
   Native <select> is converted to three explicit buttons so every status
   is directly touchable on mobile. No capture-phase event interception.
*/
(function(){
  'use strict';
  if(window.__LH_ATTENDANCE_FINAL_64__) return;
  window.__LH_ATTENDANCE_FINAL_64__=true;

  const STATUS=[['present','Có mặt'],['excused','Có phép'],['absent','Không phép']];
  const text=v=>String(v==null?'':v).trim();
  const norm=v=>STATUS.some(x=>x[0]===text(v))?text(v):'present';
  const label=v=>STATUS.find(x=>x[0]===norm(v))?.[1]||'Có mặt';
  const byId=id=>document.getElementById(id);

  function summary(){
    let p=0,e=0,a=0;
    document.querySelectorAll('#attendanceTableBody .lh-att-status-group').forEach(g=>{
      const v=norm(g.dataset.value);
      if(v==='present')p++; else if(v==='excused')e++; else a++;
    });
    [['attendancePresentCount',p],['attendanceExcusedCount',e],['attendanceAbsentCount',a]].forEach(([id,v])=>{const el=byId(id);if(el)el.textContent=String(v)});
  }

  function apply(group,status){
    if(!group)return;
    const v=norm(status);
    group.dataset.value=v;
    group.querySelectorAll('.lh-att-status-option').forEach(btn=>{
      const active=btn.dataset.choice===v;
      btn.classList.toggle('is-selected',active);
      btn.setAttribute('aria-pressed',String(active));
    });
    summary();
    document.dispatchEvent(new CustomEvent('lh:attendance-status-changed',{detail:{studentId:text(group.dataset.studentId),status:v}}));
  }

  function makeGroup(id,current){
    const g=document.createElement('div');
    g.className='lh-att-status-group';
    g.dataset.studentId=text(id);
    g.dataset.value=norm(current);
    STATUS.forEach(([v,t])=>{
      const b=document.createElement('button');
      b.type='button';
      b.className='lh-att-status-option';
      b.dataset.attendanceStatus='1';
      b.dataset.choice=v;
      b.textContent=t;
      b.setAttribute('aria-label',t);
      b.setAttribute('aria-pressed',String(v===norm(current)));
      b.setAttribute('tabindex','0');
      g.appendChild(b);
    });
    return g;
  }

  function convert(){
    const selects=[...document.querySelectorAll('#attendanceTableBody select.attendance-status')];
    selects.forEach(sel=>{
      const id=text(sel.dataset.studentId||'');
      sel.replaceWith(makeGroup(id,sel.value));
    });
    summary();
  }

  function save(){
    const date=byId('attendanceDate')?.value||'';
    const groups=[...document.querySelectorAll('#attendanceTableBody .lh-att-status-group')];
    if(!groups.length){window.showToast?.('Chưa có danh sách học sinh để điểm danh.','warning');return;}
    let saved=0,failed=0;
    groups.forEach(g=>{
      const id=text(g.dataset.studentId);
      const note=byId('attendanceTableBody')?.querySelector('.attendance-note[data-student-id="'+CSS.escape(id)+'"]')?.value||'';
      try{
        const fn=window.saveAttendanceRecord;
        if(typeof fn!=='function'){failed++;return;}
        const r=fn(id,date,norm(g.dataset.value),note);
        if(r===true||(r&&r.success!==false))saved++;else failed++;
      }catch(err){failed++;console.error('[ATTENDANCE 6.4]',err);}
    });
    summary();
    window.showToast?.(failed?`Đã lưu ${saved}/${groups.length} học sinh; ${failed} bản ghi lỗi.`:`Đã lưu điểm danh ${saved} học sinh.`,failed?'warning':'success');
  }

  function css(){
    if(byId('lhAttendance64Css'))return;
    const s=document.createElement('style');
    s.id='lhAttendance64Css';
    s.textContent=`
      #page-attendance .table-container{overflow-x:auto!important;-webkit-overflow-scrolling:touch!important}
      #page-attendance .attendance-table{min-width:820px!important}
      #page-attendance .attendance-table td:nth-child(3){min-width:310px!important;position:relative!important;z-index:100000!important;overflow:visible!important}
      #page-attendance .lh-att-status-group{display:grid!important;grid-template-columns:repeat(3,minmax(90px,1fr));gap:7px!important;width:100%!important;min-width:292px!important;position:relative!important;z-index:100001!important;pointer-events:auto!important}
      #page-attendance .lh-att-status-option{display:flex!important;align-items:center!important;justify-content:center!important;min-height:52px!important;padding:9px 7px!important;border:1px solid #cbd5e1!important;border-radius:10px!important;background:#fff!important;color:#172033!important;font:inherit!important;font-size:15px!important;font-weight:700!important;line-height:1.15!important;text-align:center!important;white-space:normal!important;cursor:pointer!important;pointer-events:auto!important;touch-action:manipulation!important;user-select:none!important;-webkit-user-select:none!important;position:relative!important;z-index:100002!important}
      #page-attendance .lh-att-status-option.is-selected{outline:3px solid #2563eb!important;background:#eff6ff!important}
      #page-attendance .lh-att-status-option:active{transform:scale(.98)!important}
      @media(max-width:680px){#page-attendance .lh-att-status-option{min-height:56px!important;font-size:16px!important}}
    `;
    document.head.appendChild(s);
  }

  function bind(){
    if(document.__lhAttendance64Bound)return;
    document.__lhAttendance64Bound=true;
    document.addEventListener('click',e=>{
      const btn=e.target?.closest?.('#attendanceTableBody .lh-att-status-option');
      if(btn){e.preventDefault();e.stopPropagation();apply(btn.closest('.lh-att-status-group'),btn.dataset.choice);}
    },false);
    const saveBtn=byId('saveAttendance');
    if(saveBtn)saveBtn.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();save();},false);
    const body=byId('attendanceTableBody');
    if(body){
      const obs=new MutationObserver(()=>{
        if(document.__lhAttendance64Converting)return;
        if(body.querySelector('select.attendance-status')){
          document.__lhAttendance64Converting=true;
          convert();
          document.__lhAttendance64Converting=false;
        }else summary();
      });
      obs.observe(body,{childList:true,subtree:true});
    }
    const date=byId('attendanceDate');
    if(date)date.addEventListener('change',()=>setTimeout(convert,0));
  }

  function boot(){css();bind();setTimeout(convert,100);setTimeout(convert,600);setTimeout(convert,1500);}
  window.LHAttendanceFinal={convert,save,summary,apply};
  window.renderAttendanceSummary=summary;
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
