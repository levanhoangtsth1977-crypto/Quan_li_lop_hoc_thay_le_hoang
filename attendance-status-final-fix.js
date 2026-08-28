/* ATTENDANCE STATUS FINAL 6.1 — MOBILE/TOUCH LAYOUT ONLY
   script.js remains the sole source of truth for students and attendance data.
*/
(function(){
  'use strict';
  if(window.__LH_ATTENDANCE_FINAL_61__) return;
  window.__LH_ATTENDANCE_FINAL_61__=true;

  function install(){
    if(document.getElementById('lhAttendance61Css')) return;
    const s=document.createElement('style');
    s.id='lhAttendance61Css';
    s.textContent=`
      #page-attendance .attendance-table{position:relative;z-index:1}
      #page-attendance .attendance-table td{position:relative}
      #page-attendance .attendance-table td:nth-child(3){z-index:5;min-width:150px}
      #page-attendance select.attendance-status{
        display:block;width:100%;min-width:140px;min-height:40px;position:relative;z-index:6;
        pointer-events:auto!important;cursor:pointer;-webkit-appearance:auto;appearance:auto;
        touch-action:manipulation;-webkit-tap-highlight-color:transparent;
      }
      @media (max-width:680px){
        #page-attendance .page-header{margin-bottom:12px}
        #page-attendance .attendance-summary{margin-bottom:10px}
        #page-attendance .table-container{
          display:block;width:100%;margin-top:0;
          overflow-x:auto;overflow-y:visible;
          -webkit-overflow-scrolling:touch;
          overscroll-behavior-x:contain;overscroll-behavior-y:auto;
          touch-action:auto;
        }
        #page-attendance .attendance-table{
          min-width:720px;margin-top:0;
        }
        #page-attendance .attendance-table th,
        #page-attendance .attendance-table td{padding-top:10px;padding-bottom:10px}
        #page-attendance .attendance-table td:nth-child(3){min-width:175px}
        #page-attendance select.attendance-status{
          min-height:46px;padding:8px 34px 8px 10px;font-size:16px;line-height:1.2;
          touch-action:manipulation;pointer-events:auto!important;
        }
      }
      @media (max-width:420px){
        #page-attendance .page-header{gap:10px;margin-bottom:10px}
        #page-attendance .attendance-summary{gap:6px;margin-bottom:8px}
        #page-attendance .mini-stat{padding:9px 11px}
      }
    `;
    document.head.appendChild(s);
  }

  function boot(){install()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
