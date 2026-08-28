/* ATTENDANCE STATUS FINAL 6.2 — MOBILE/TOUCH PICKER ONLY
   The main script.js remains the sole source of truth for students/attendance.
   This module NEVER renders the attendance table and NEVER replaces renderAttendance.
*/
(function(){
  'use strict';
  if(window.__LH_ATTENDANCE_FINAL_62__) return;
  window.__LH_ATTENDANCE_FINAL_62__=true;

  function isStatus(el){
    return !!(el && el.matches && el.matches('#page-attendance select.attendance-status'));
  }

  function openPicker(el){
    if(!isStatus(el)) return;
    try{
      if(typeof el.showPicker==='function'){
        el.showPicker();
        return;
      }
    }catch(_){ }
    try{ el.focus({preventScroll:true}); }catch(_){ try{ el.focus(); }catch(__){} }
  }

  function install(){
    if(!document.getElementById('lhAttendance62Css')){
      const s=document.createElement('style');
      s.id='lhAttendance62Css';
      s.textContent=`
        #page-attendance select.attendance-status{
          display:block!important;
          width:100%!important;
          min-width:140px!important;
          min-height:42px!important;
          position:relative!important;
          z-index:9999!important;
          pointer-events:auto!important;
          visibility:visible!important;
          opacity:1!important;
          -webkit-appearance:auto!important;
          appearance:auto!important;
          touch-action:manipulation!important;
          cursor:pointer!important;
        }
        @media (max-width:680px){
          #page-attendance .table-container{
            overflow-x:auto;
            overflow-y:visible;
            -webkit-overflow-scrolling:touch;
          }
          #page-attendance .attendance-table{min-width:720px}
          #page-attendance select.attendance-status{
            min-height:48px!important;
            font-size:16px!important;
            padding:8px 34px 8px 10px!important;
            touch-action:manipulation!important;
          }
        }
      `;
      document.head.appendChild(s);
    }

    if(document.__lhAttendancePicker62) return;
    document.__lhAttendancePicker62=true;

    document.addEventListener('pointerdown',function(e){
      const el=e.target && e.target.closest ? e.target.closest('#page-attendance select.attendance-status') : null;
      if(!el) return;
      e.stopPropagation();
      openPicker(el);
    },true);

    document.addEventListener('touchstart',function(e){
      const el=e.target && e.target.closest ? e.target.closest('#page-attendance select.attendance-status') : null;
      if(!el) return;
      e.stopPropagation();
    },true);

    document.addEventListener('click',function(e){
      const el=e.target && e.target.closest ? e.target.closest('#page-attendance select.attendance-status') : null;
      if(!el) return;
      e.stopPropagation();
    },true);
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',install,{once:true});
  }else{
    install();
  }
})();