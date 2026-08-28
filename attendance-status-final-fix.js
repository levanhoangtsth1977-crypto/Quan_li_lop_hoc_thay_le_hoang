/* ATTENDANCE STATUS FINAL 6.3 — native select, NO capture blocking
   Main script.js remains the source of truth for attendance rows/data.
*/
(function(){
  'use strict';
  if(window.__LH_ATTENDANCE_FINAL_63__) return;
  window.__LH_ATTENDANCE_FINAL_63__=true;

  function install(){
    if(!document.getElementById('lhAttendance63Css')){
      const s=document.createElement('style');
      s.id='lhAttendance63Css';
      s.textContent=`
        #page-attendance .table-container{overflow-x:auto!important;overflow-y:visible!important;-webkit-overflow-scrolling:touch!important}
        #page-attendance .attendance-table{position:relative!important;z-index:1!important;min-width:720px}
        #page-attendance .attendance-table td:nth-child(3){position:relative!important;z-index:20!important;min-width:170px!important;overflow:visible!important}
        #page-attendance select.attendance-status{display:block!important;box-sizing:border-box!important;width:100%!important;min-width:150px!important;min-height:48px!important;padding:8px 34px 8px 12px!important;position:relative!important;z-index:30!important;pointer-events:auto!important;visibility:visible!important;opacity:1!important;appearance:auto!important;-webkit-appearance:auto!important;touch-action:manipulation!important;cursor:pointer!important;font-size:16px!important}
      `;
      document.head.appendChild(s);
    }

    if(document.__lhAttendance63Bound)return;
    document.__lhAttendance63Bound=true;

    // Do NOT intercept pointerdown/touchstart/click. Native select controls need them.
    document.addEventListener('change',function(e){
      const el=e.target;
      if(el&&el.matches&&el.matches('#page-attendance select.attendance-status')){
        if(typeof window.renderAttendanceSummary==='function'){
          try{window.renderAttendanceSummary();}catch(_){ }
        }
        document.dispatchEvent(new CustomEvent('lh:attendance-status-changed',{detail:{studentId:el.dataset.studentId,status:el.value}}));
      }
    },false);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
