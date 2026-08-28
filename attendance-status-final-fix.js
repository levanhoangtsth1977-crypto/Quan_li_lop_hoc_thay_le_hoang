/* ATTENDANCE STATUS FINAL 6.0
   MOBILE SAFE / CSS-ONLY
   - KHÔNG render lại danh sách học sinh.
   - KHÔNG ghi đè renderAttendance.
   - KHÔNG ghi đè saveAttendance.
   - KHÔNG dùng MutationObserver.
   - Chỉ đảm bảo native select Trạng thái dễ chạm/chọn trên điện thoại.
*/
(function(){
  'use strict';
  if(window.__LH_ATTENDANCE_FINAL_60__) return;
  window.__LH_ATTENDANCE_FINAL_60__=true;

  function installCss(){
    if(document.getElementById('lhAttendance60Css')) return;
    const s=document.createElement('style');
    s.id='lhAttendance60Css';
    s.textContent=`
      #page-attendance .attendance-table{position:relative;z-index:1}
      #page-attendance .attendance-table td:nth-child(3){position:relative;z-index:5;min-width:150px}
      #page-attendance select.attendance-status{
        display:block;
        width:100%;
        min-width:145px;
        min-height:44px;
        position:relative;
        z-index:6;
        pointer-events:auto !important;
        cursor:pointer;
        touch-action:manipulation;
        -webkit-appearance:auto;
        appearance:auto;
      }
      @media (max-width:680px){
        #page-attendance .table-container{
          overflow-x:auto;
          overflow-y:visible;
          -webkit-overflow-scrolling:touch;
          touch-action:pan-x;
        }
        #page-attendance .attendance-table{min-width:720px}
        #page-attendance .attendance-table td:nth-child(3){min-width:175px}
        #page-attendance select.attendance-status{
          min-height:48px;
          min-width:165px;
          padding:8px 34px 8px 10px;
          font-size:16px;
          line-height:1.2;
          touch-action:manipulation;
        }
      }
    `;
    document.head.appendChild(s);
  }

  installCss();
  window.LHAttendanceMobileSafe={installCss};
})();
