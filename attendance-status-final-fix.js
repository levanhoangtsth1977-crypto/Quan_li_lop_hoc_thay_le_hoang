/* ATTENDANCE STATUS FINAL 6.0 — MOBILE/TOUCH ONLY
   IMPORTANT: Do NOT render or save attendance here.
   script.js remains the single source of truth for the student list and records.
*/
(function(){
  'use strict';
  if(window.__LH_ATTENDANCE_FINAL_60__) return;
  window.__LH_ATTENDANCE_FINAL_60__=true;

  function install(){
    if(document.getElementById('lhAttendance60Css')) return;
    const s=document.createElement('style');
    s.id='lhAttendance60Css';
    s.textContent=`
      #page-attendance .attendance-table{position:relative;z-index:1}
      #page-attendance .attendance-table td{position:relative}
      #page-attendance .attendance-table td:nth-child(3){z-index:5;min-width:150px}
      #page-attendance select.attendance-status{
        display:block;
        width:100%;
        min-width:140px;
        min-height:40px;
        position:relative;
        z-index:6;
        pointer-events:auto !important;
        cursor:pointer;
        -webkit-appearance:auto;
        appearance:auto;
        touch-action:manipulation;
        -webkit-tap-highlight-color:transparent;
      }
      @media (max-width:680px){
        #page-attendance .table-container{
          overflow-x:auto;
          overflow-y:visible;
          -webkit-overflow-scrolling:touch;
        }
        #page-attendance .attendance-table{min-width:720px}
        #page-attendance .attendance-table td:nth-child(3){min-width:175px}
        #page-attendance select.attendance-status{
          min-height:46px;
          padding:8px 34px 8px 10px;
          font-size:16px;
          line-height:1.2;
          touch-action:manipulation;
          pointer-events:auto !important;
        }
      }
    `;
    document.head.appendChild(s);
  }

  function boot(){ install(); }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',boot,{once:true});
  }else{
    boot();
  }
})();
